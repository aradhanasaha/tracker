/**
 * GST statistics reader — reads from the local gstdatabase/ folder.
 * Source: https://www.gst.gov.in/download/gststatistics
 *
 * Two column formats exist:
 *   FY ≤ 2024-25 : 5 cols/month  (CGST, SGST, IGST, CESS, TOTAL)
 *   FY   2025-26+: 4 cols/month  (CGST, SGST, IGST, TOTAL — no CESS)
 */

import * as fs from "fs";
import * as path from "path";
import * as XLSX from "xlsx";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GSTMonthRecord {
  month: string;   // "Apr-25"
  cgst: number;
  sgst: number;
  igst: number;
  cess: number;
  total: number;
}

export interface StateGSTData {
  state: string;
  series: GSTMonthRecord[];    // last 12 months across FY boundaries
  source: string;
  dataUpTo: string;
}

export interface StateTotal {
  state: string;
  slug: string;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
}

export interface FYSeries {
  fy: string;          // "2024-25"
  series: GSTMonthRecord[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DB_DIR = path.join(process.cwd(), "gstdatabase");
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// ─── Slug helpers (pure — safe for client import via a shared utils file) ────

export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .trim()
    .replace(/\s+/g, "-");
}

export function matchStateBySlug(slug: string, states: string[]): string | undefined {
  return states.find((s) => toSlug(s) === slug);
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function excelSerialToMonthLabel(serial: number): string {
  const d = new Date((serial - 25569) * 86400 * 1000);
  return `${MONTHS[d.getUTCMonth()]}-${String(d.getUTCFullYear()).slice(2)}`;
}

function monthSortKey(label: string): number {
  const y = 2000 + parseInt(label.slice(4), 10);
  const m = MONTHS.indexOf(label.slice(0, 3));
  return y * 12 + m;
}

interface ParsedSheet {
  rows: unknown[][];
  subRow: (string | null)[];
  dateRow: (number | null)[];
  hasCess: boolean;
  cgstCols: number[];      // all CGST column positions
  annualTotalCol: number;  // col index of annual TOTAL
}

function openSheet(filePath: string): ParsedSheet | null {
  try {
    const buf = fs.readFileSync(filePath);
    const wb = XLSX.read(buf, { type: "buffer" });
    const ws = wb.Sheets["Collections-Statewise"];
    if (!ws) return null;

    const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1 });
    const dateRow = (rows[4] ?? []) as (number | null)[];
    const subRow  = (rows[5] ?? []) as (string | null)[];
    const hasCess = subRow.some((c) => c === "CESS");

    const cgstCols: number[] = [];
    subRow.forEach((v, i) => { if (v === "CGST") cgstCols.push(i); });

    const annualTotalCol = hasCess ? 6 : 5;

    return { rows, subRow, dateRow, hasCess, cgstCols, annualTotalCol };
  } catch {
    return null;
  }
}

function stateRowsFrom(parsed: ParsedSheet) {
  return parsed.rows.slice(6).filter((r) => {
    const row = r as unknown[];
    const cd = row[0];
    const name = row[1];
    return (
      typeof cd === "number" && cd > 0 && cd < 200 &&
      typeof name === "string" && name.length > 0 &&
      !["total", "all india"].some((kw) => (name as string).toLowerCase().includes(kw))
    );
  }) as unknown[][];
}

function findStateRow(parsed: ParsedSheet, needle: string): unknown[] | undefined {
  const norm = needle.toLowerCase().replace(/[\s-]+/g, "");
  return stateRowsFrom(parsed).find(
    (r) =>
      ((r as unknown[])[1] as string)
        .toLowerCase()
        .replace(/[\s-]+/g, "")
        .includes(norm)
  );
}

function parseMonthlyRecords(
  parsed: ParsedSheet,
  stateRow: unknown[]
): GSTMonthRecord[] {
  const { cgstCols, dateRow, hasCess } = parsed;
  const monthlyCgstCols = cgstCols.slice(1);
  const colsPerMonth = hasCess ? 5 : 4;
  const records: GSTMonthRecord[] = [];

  for (const cgstCol of monthlyCgstCols) {
    const serial = [dateRow[cgstCol - 1], dateRow[cgstCol], dateRow[cgstCol + 1]].find(
      (v): v is number => typeof v === "number" && v > 40000
    );
    if (!serial) continue;

    const cgst  = Number(stateRow[cgstCol]) || 0;
    const sgst  = Number(stateRow[cgstCol + 1]) || 0;
    const igst  = Number(stateRow[cgstCol + 2]) || 0;
    const cess  = hasCess ? Number(stateRow[cgstCol + 3]) || 0 : 0;
    const total = Number(stateRow[cgstCol + (colsPerMonth - 1)]) || 0;

    if (total > 0) {
      records.push({ month: excelSerialToMonthLabel(serial), cgst, sgst, igst, cess, total });
    }
  }
  return records;
}

// ─── File catalogue ───────────────────────────────────────────────────────────

interface FYFile { file: string; fy: string; fyStart: number }

function getAvailableFiles(): FYFile[] {
  if (!fs.existsSync(DB_DIR)) return [];
  return fs
    .readdirSync(DB_DIR)
    .filter((f) => /^statewise_GST_collection_\d{4}-\d{2}\.xlsx$/.test(f))
    .map((f) => {
      const m = f.match(/(\d{4})-(\d{2})\.xlsx$/);
      if (!m) return null;
      return { file: f, fy: `${m[1]}-${m[2]}`, fyStart: parseInt(m[1], 10) };
    })
    .filter(Boolean)
    .sort((a, b) => b!.fyStart - a!.fyStart) as FYFile[];
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** All FY strings available in the database, newest first (e.g. "2025-26"). */
export function getAvailableFYears(): string[] {
  return getAvailableFiles().map((f) => f.fy);
}

/** All state/UT names extracted from the most recent statewise file. */
export function getAvailableStates(): string[] {
  const files = getAvailableFiles();
  if (files.length === 0) return [];
  const parsed = openSheet(path.join(DB_DIR, files[0].file));
  if (!parsed) return [];
  return stateRowsFrom(parsed).map((r) => ((r as unknown[])[1] as string).trim());
}

/** Monthly series for `stateName` in a single FY. */
export function getStateDataForFY(stateName: string, fy: string): GSTMonthRecord[] {
  const file = getAvailableFiles().find((f) => f.fy === fy);
  if (!file) return [];
  const parsed = openSheet(path.join(DB_DIR, file.file));
  if (!parsed) return [];
  const stateRow = findStateRow(parsed, stateName);
  if (!stateRow) return [];
  return parseMonthlyRecords(parsed, stateRow);
}

/** Annual totals for every state in a given FY, sorted largest-first. */
export function getAllStatesTotalsForFY(fy: string): StateTotal[] {
  const file = getAvailableFiles().find((f) => f.fy === fy);
  if (!file) return [];
  const parsed = openSheet(path.join(DB_DIR, file.file));
  if (!parsed) return [];
  const { annualTotalCol } = parsed;

  return stateRowsFrom(parsed)
    .map((r) => ({
      state: ((r as unknown[])[1] as string).trim(),
      slug:  toSlug(((r as unknown[])[1] as string).trim()),
      cgst:  Number((r as unknown[])[2]) || 0,
      sgst:  Number((r as unknown[])[3]) || 0,
      igst:  Number((r as unknown[])[4]) || 0,
      total: Number((r as unknown[])[annualTotalCol]) || 0,
    }))
    .filter((s) => s.total > 0)
    .sort((a, b) => b.total - a.total);
}

/** Year-on-year series for `stateName` across multiple FY years. */
export function getStateYoYData(stateName: string, fys: string[]): FYSeries[] {
  return fys
    .map((fy) => ({ fy, series: getStateDataForFY(stateName, fy) }))
    .filter((d) => d.series.length > 0);
}

/**
 * Last 12 months of data for `stateName` by combining the two most recent FY files.
 * Used by the API route.
 */
export async function getStateGSTData(stateName: string): Promise<StateGSTData | null> {
  const files = getAvailableFiles();
  if (files.length === 0) return null;

  const allRecords: GSTMonthRecord[] = [];
  for (const { file } of files.slice(0, 2)) {
    const parsed = openSheet(path.join(DB_DIR, file));
    if (!parsed) continue;
    const row = findStateRow(parsed, stateName);
    if (!row) continue;
    allRecords.push(...parseMonthlyRecords(parsed, row));
  }
  if (allRecords.length === 0) return null;

  const byMonth = new Map<string, GSTMonthRecord>();
  for (const r of allRecords) byMonth.set(r.month, r);

  const sorted = [...byMonth.values()].sort(
    (a, b) => monthSortKey(a.month) - monthSortKey(b.month)
  );
  const series = sorted.slice(-12);

  return {
    state: stateName,
    series,
    source: "gst.gov.in/download/gststatistics (local cache)",
    dataUpTo: series[series.length - 1].month,
  };
}


