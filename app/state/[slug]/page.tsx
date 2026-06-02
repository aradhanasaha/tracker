import { Suspense } from "react";
import { notFound } from "next/navigation";
import DashboardSelectors from "@/components/state/DashboardSelectors";
import GSTChart from "@/components/state/GSTChart";
import TaxBreakdownPie from "@/components/state/TaxBreakdownPie";
import YoYChart from "@/components/state/YoYChart";
import StateComparisonChart from "@/components/state/StateComparisonChart";
import {
  getAvailableFYears,
  getAvailableStates,
  getStateDataForFY,
  getAllStatesTotalsForFY,
  getStateYoYData,
  matchStateBySlug,
  toSlug,
} from "@/lib/pib-scraper";

export async function generateStaticParams() {
  return getAvailableStates().map((name) => ({ slug: toSlug(name) }));
}

function formatCrore(n: number) {
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })} cr`;
}

function pct(a: number, b: number) {
  if (!b) return "—";
  const c = ((a - b) / b) * 100;
  return `${c >= 0 ? "+" : ""}${c.toFixed(1)}%`;
}

export default async function StatePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ fy?: string }>;
}) {
  const { slug } = await params;
  const { fy: fyParam } = await searchParams;

  const allStates = getAvailableStates();
  const allFYs    = getAvailableFYears();

  if (allStates.length === 0 || allFYs.length === 0) {
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-md text-center space-y-3">
          <h1 className="text-2xl font-bold text-gray-900">Database empty</h1>
          <p className="text-gray-500">
            Run <code className="bg-gray-100 px-1 rounded">node scripts/download-gst-files.mjs</code> to populate the local data.
          </p>
        </div>
      </main>
    );
  }

  const stateName = matchStateBySlug(slug, allStates);
  if (!stateName) notFound();

  const currentFY = allFYs.includes(fyParam ?? "") ? (fyParam as string) : allFYs[0];
  const prevFY    = allFYs[allFYs.indexOf(currentFY) + 1] ?? null;

  // Parallel data fetch
  const [series, comparisonData, yoyData] = await Promise.all([
    Promise.resolve(getStateDataForFY(stateName, currentFY)),
    Promise.resolve(getAllStatesTotalsForFY(currentFY)),
    Promise.resolve(getStateYoYData(stateName, [prevFY, currentFY].filter(Boolean) as string[])),
  ]);

  if (series.length === 0) {
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        <p className="text-gray-500">No data found for {stateName} in FY {currentFY}.</p>
      </main>
    );
  }

  const latest   = series[series.length - 1];
  const prev     = series[series.length - 2];
  const fyTotal  = series.reduce((s, m) => s + m.total, 0);
  const avg      = Math.round(fyTotal / series.length);
  const momChange = pct(latest.total, prev?.total ?? 0);
  const momPos   = !prev || latest.total >= prev.total;
  const dataUpTo = latest.month;

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-2 text-sm text-gray-500">
          <a href="/" className="hover:text-blue-600">India Tax Tracker</a>
          <span>/</span>
          <span className="text-gray-900 font-medium">{stateName}</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Header row */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{stateName}</h1>
            <p className="text-gray-500 mt-1 text-sm">
              GST Collections · FY {currentFY}
              <span className="ml-2 text-gray-400">· Data up to {dataUpTo}</span>
            </p>
          </div>
          <Suspense>
            <DashboardSelectors
              states={allStates}
              years={allFYs}
              currentState={stateName}
              currentFY={currentFY}
            />
          </Suspense>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label={`Latest (${latest.month})`}
            value={formatCrore(latest.total)}
            change={momChange}
            positive={momPos}
            sub="vs prev month"
          />
          <StatCard
            label={`FY ${currentFY} total`}
            value={formatCrore(fyTotal)}
            sub={`${series.length} months recorded`}
          />
          <StatCard
            label="Monthly average"
            value={formatCrore(avg)}
            sub={`${series[0].month} – ${dataUpTo}`}
          />
          <StatCard
            label="CGST / SGST split"
            value={`${((latest.cgst / latest.total) * 100).toFixed(0)} / ${((latest.sgst / latest.total) * 100).toFixed(0)}%`}
            sub={`of ${latest.month} total`}
          />
        </div>

        {/* Monthly trend chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Monthly GST Collections</h2>
              <p className="text-sm text-gray-500 mt-0.5">CGST + SGST + IGST{series.some(m => m.cess > 0) ? " + Cess" : ""} · ₹ crore</p>
            </div>
            <a
              href="https://www.gst.gov.in/download/gststatistics"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline"
            >
              Source data ↗
            </a>
          </div>
          <Suspense fallback={<div className="h-80 bg-gray-100 rounded-lg animate-pulse" />}>
            <GSTChart series={series} />
          </Suspense>
        </div>

        {/* Pie + YoY row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <Suspense fallback={<div className="h-72 bg-gray-100 rounded-lg animate-pulse" />}>
              <TaxBreakdownPie
                cgst={latest.cgst}
                sgst={latest.sgst}
                igst={latest.igst}
                cess={latest.cess}
                month={latest.month}
              />
            </Suspense>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <Suspense fallback={<div className="h-72 bg-gray-100 rounded-lg animate-pulse" />}>
              {yoyData.length >= 2 ? (
                <YoYChart data={yoyData} stateName={stateName} />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-gray-400">
                  Year-on-year data needs at least 2 FY files
                </div>
              )}
            </Suspense>
          </div>
        </div>

        {/* State comparison chart */}
        {comparisonData.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <Suspense fallback={<div className="h-96 bg-gray-100 rounded-lg animate-pulse" />}>
              <StateComparisonChart
                data={comparisonData}
                selectedSlug={slug}
                fy={currentFY}
              />
            </Suspense>
          </div>
        )}

        <p className="text-xs text-gray-400 pb-4">
          Source: gst.gov.in/download/gststatistics · Files synced via GitHub Actions every 2 weeks.
        </p>
      </div>
    </main>
  );
}

function StatCard({
  label, value, sub, change, positive,
}: {
  label: string; value: string; sub?: string; change?: string; positive?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide truncate">{label}</p>
      <p className="mt-1.5 text-2xl font-bold text-gray-900 leading-tight">{value}</p>
      <div className="mt-1 flex items-center gap-1.5 flex-wrap">
        {change && (
          <span className={`text-xs font-medium ${positive ? "text-green-600" : "text-red-600"}`}>
            {change}
          </span>
        )}
        {sub && <span className="text-xs text-gray-400">{sub}</span>}
      </div>
    </div>
  );
}
