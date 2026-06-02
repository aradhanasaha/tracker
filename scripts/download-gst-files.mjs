/**
 * Downloads all GST statistics files from tutorial.gst.gov.in.
 * Run with: node scripts/download-gst-files.mjs
 *
 * The server requires a Referer + User-Agent to serve real files.
 * Without them it returns a 404 stub with a fake xlsx content-type.
 */

import https from "https";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "gstdatabase");

const BASE = "https://tutorial.gst.gov.in/offlineutilities/gst_statistics";
const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Referer: "https://www.gst.gov.in/download/gststatistics",
};

const FILES = [
  // Registration
  "REGISTRATION.xlsx",

  // GSTR-3B (FY 2017-18 to 2025-26)
  ...["2017-2018","2018-2019","2019-2020","2020-2021","2021-2022","2022-2023","2023-2024","2024-2025","2025-2026"]
    .map((fy) => `GSTR-3B-${fy}.xlsx`),

  // GSTR-1 (FY 2017-18 to 2025-26)
  ...["2017-2018","2018-2019","2019-2020","2020-2021","2021-2022","2022-2023","2023-2024","2024-2025","2025-2026"]
    .map((fy) => `GSTR-1-${fy}.xlsx`),

  // State-wise GST collection (short-year filenames)
  "Gross_Net_Tax_collection.xlsx",
  ...["2017-18","2018-19","2019-20","2020-21","2021-22","2022-23","2023-24","2024-25","2025-26"]
    .map((fy) => `statewise_GST_collection_${fy}.xlsx`),

  // IGST settlement to states
  ...["2017-2018","2018-2019","2019-2020","2020-2021","2021-2022","2022-2023","2023-2024","2024-2025","2025-2026"]
    .map((fy) => `Settlement-of-IGST-to-State-${fy}.xlsx`),

  // E-Way bill data
  ...["2018-19","2019-20","2020-21","2021-22","2022-23","2023-24","2024-25","2025-26"]
    .map((fy) => `ewb-data-${fy}.xlsx`),

  // PDFs
  "Yearwise-Pre-GST-revenue.pdf",
  "8YearsReport.pdf",
];

function download(filename) {
  return new Promise((resolve) => {
    const url = `${BASE}/${filename}`;
    const dest = path.join(OUT_DIR, filename);

    const req = https.get(url, { headers: HEADERS }, (res) => {
      if (res.statusCode !== 200) {
        console.error(`  SKIP  ${filename}  (HTTP ${res.statusCode})`);
        res.resume();
        return resolve({ filename, status: "skip", code: res.statusCode });
      }

      const size = parseInt(res.headers["content-length"] ?? "0", 10);
      const stream = fs.createWriteStream(dest);
      res.pipe(stream);
      stream.on("finish", () => {
        console.log(`  OK    ${filename}  (${(size / 1024).toFixed(0)} KB)`);
        resolve({ filename, status: "ok", bytes: size });
      });
      stream.on("error", (err) => {
        console.error(`  ERR   ${filename}  ${err.message}`);
        resolve({ filename, status: "error", message: err.message });
      });
    });

    req.on("error", (err) => {
      console.error(`  ERR   ${filename}  ${err.message}`);
      resolve({ filename, status: "error", message: err.message });
    });
  });
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log(`Downloading ${FILES.length} files to ${OUT_DIR}\n`);

  let ok = 0, skip = 0, err = 0;
  for (const f of FILES) {
    const r = await download(f);
    if (r.status === "ok") ok++;
    else if (r.status === "skip") skip++;
    else err++;
  }

  console.log(`\nDone — OK: ${ok}  Skipped: ${skip}  Errors: ${err}`);
}

main();
