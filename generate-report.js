import fs from "fs";
import path from "path";

const RESULTS_DIR = path.resolve("tests-results");
const REPORT_FILE = path.resolve("test-report.html");

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatLocal(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return String(iso);
  }
}

function buildShell() {
  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <title>Playwright Testreport – Historie</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { margin-bottom: 6px; }
    .meta { color: #555; margin-bottom: 16px; }
    .run { margin: 24px 0 40px; }
    details.site { border: 1px solid #bbb; border-radius: 8px; padding: 10px 12px; margin: 12px 0; }
    details.test { border: 1px solid #ddd; border-radius: 8px; padding: 8px 10px; margin: 8px 0; background: #fafafa; }
    summary { cursor: pointer; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #ccc; padding: 8px; text-align: left; vertical-align: top; }
    th { background: #f2f2f2; }
    .passed { font-weight: bold; color: green; }
    .failed { font-weight: bold; color: red; }
    .skipped { font-weight: bold; color: #777; }
    .pill { display: inline-block; padding: 2px 8px; border-radius: 999px; border: 1px solid #ccc; margin-left: 8px; font-size: 12px; color: #333; }
    .url { word-break: break-all; }
    pre { white-space: pre-wrap; margin: 6px 0 0; }
    .small { color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <h1>Playwright Testreport – Historie</h1>
  <div class="meta">Wird bei jedem Lauf erweitert. Quelle: <code>tests-results/results-url-*.json</code></div>
</body>
</html>`;
}

function stripClosingTags(html) {
  return html.replace(/<\/body>\s*<\/html>\s*$/i, "");
}

function findPerSiteJsonFiles() {
  if (!fs.existsSync(RESULTS_DIR)) return [];
  return fs
    .readdirSync(RESULTS_DIR)
    .filter((f) => f.startsWith("results-url-") && f.endsWith(".json"))
    .map((f) => path.join(RESULTS_DIR, f));
}

// ---------- read site files ----------
const files = findPerSiteJsonFiles();
if (files.length === 0) {
  console.error("❌ Keine Dateien gefunden: tests-results/results-url-*.json");
  process.exit(1);
}

const siteReports = files.map((fp) => {
  const data = JSON.parse(fs.readFileSync(fp, "utf8"));
  return data;
});

// stable sorting by URL / projectName
siteReports.sort((a, b) => {
  const au = a.testedUrl || a.projectName || "";
  const bu = b.testedUrl || b.projectName || "";
  return au.localeCompare(bu);
});

// ---------- build run section ----------
const runIso = new Date().toISOString();
const runLabel = new Date().toLocaleString();

let total = 0, passed = 0, failed = 0, skipped = 0, other = 0;
for (const sr of siteReports) {
  total += sr.stats?.total ?? 0;
  passed += sr.stats?.passed ?? 0;
  failed += sr.stats?.failed ?? 0;
  skipped += sr.stats?.skipped ?? 0;
  other += sr.stats?.other ?? 0;
}

let runSection = `
<hr/>
<div class="run">
  <h2 style="margin:0;">Testlauf vom ${escapeHtml(runLabel)}</h2>
  <div class="small">generatedAt: <code>${escapeHtml(runIso)}</code></div>
  <div style="margin-top:8px;">
    <span class="pill">Total: ${total}</span>
    <span class="pill passed">Passed: ${passed}</span>
    <span class="pill failed">Failed: ${failed}</span>
    <span class="pill skipped">Skipped: ${skipped}</span>
    <span class="pill">Other: ${other}</span>
  </div>
`;

// Per site: collapsible
for (const sr of siteReports) {
  const url = sr.testedUrl || "";
  const projectName = sr.projectName || "unknown";
  const stats = sr.stats || {};
  const tests = Array.isArray(sr.tests) ? sr.tests : [];

  runSection += `
  <details class="site">
    <summary>
      <span class="url">${escapeHtml(url || projectName)}</span>
      <span class="pill">${escapeHtml(projectName)}</span>
      <span class="pill passed">P: ${stats.passed ?? 0}</span>
      <span class="pill failed">F: ${stats.failed ?? 0}</span>
      <span class="pill skipped">S: ${stats.skipped ?? 0}</span>
      <span class="pill">T: ${stats.total ?? 0}</span>
    </summary>
    ${url ? `<div class="small">Link: <a class="url" href="${escapeHtml(url)}" target="_blank" rel="noreferrer">${escapeHtml(url)}</a></div>` : ""}

    <table>
      <thead>
        <tr>
          <th>Status</th>
          <th>Test</th>
          <th>Datei</th>
          <th>Letzte Dauer (ms)</th>
          <th>Letzte Startzeit</th>
          <th>Details</th>
        </tr>
      </thead>
      <tbody>
  `;

  // Für jede Spec/Test: Zeige den letzten Result als Summary, aber Details aufklappbar mit allen Results
  for (const t of tests) {
    const results = Array.isArray(t.results) ? t.results : [];
    const last = results[results.length - 1] || {};
    const status = last.status || "unknown";
    const titlePath = Array.isArray(t.titlePath) ? t.titlePath.join(" › ") : t.title;
    const loc = `${t.file}:${t.line}:${t.column}`;

    // Baue Detail-Inhalt: alle results (retries), errors, stdout/stderr, snippet etc.
    const detailsHtml = `
      <details class="test">
        <summary>anzeigen</summary>

        <div class="small"><b>Expected:</b> ${escapeHtml(t.expectedStatus)} &nbsp; <b>Timeout:</b> ${escapeHtml(t.timeout ?? "")}</div>
        ${Array.isArray(t.annotations) && t.annotations.length
          ? `<div class="small"><b>Annotations:</b> ${escapeHtml(JSON.stringify(t.annotations))}</div>`
          : ""}

        <h4 style="margin:10px 0 6px;">Results (inkl. Retries)</h4>
        ${results.map((r, idx) => {
          const err = r.error || {};
          const errs = Array.isArray(r.errors) ? r.errors : [];
          const stdout = Array.isArray(r.stdout) ? r.stdout.map(x => x.text).join("") : "";
          const stderr = Array.isArray(r.stderr) ? r.stderr.map(x => x.text).join("") : "";

          const loc2 = err.location
            ? `${err.location.file}:${err.location.line}:${err.location.column}`
            : "";

          return `
            <div style="border:1px solid #e0e0e0; border-radius:8px; padding:8px; margin:8px 0; background:#fff;">
              <div>
                <span class="${escapeHtml(r.status)}">${escapeHtml(r.status)}</span>
                <span class="pill">retry: ${escapeHtml(r.retry)}</span>
                <span class="pill">duration: ${escapeHtml(r.duration)}ms</span>
                <span class="pill">start: ${escapeHtml(formatLocal(r.startTime))}</span>
              </div>

              ${err.message ? `<div style="margin-top:6px;"><b>Error message:</b><pre>${escapeHtml(err.message)}</pre></div>` : ""}
              ${err.stack ? `<div style="margin-top:6px;"><b>Stack:</b><pre>${escapeHtml(err.stack)}</pre></div>` : ""}
              ${loc2 ? `<div class="small"><b>Error location:</b> ${escapeHtml(loc2)}</div>` : ""}
              ${err.snippet ? `<div style="margin-top:6px;"><b>Snippet:</b><pre>${escapeHtml(err.snippet)}</pre></div>` : ""}

              ${errs.length ? `<div style="margin-top:6px;"><b>Additional errors:</b><pre>${escapeHtml(JSON.stringify(errs, null, 2))}</pre></div>` : ""}

              ${stdout ? `<div style="margin-top:6px;"><b>stdout:</b><pre>${escapeHtml(stdout)}</pre></div>` : ""}
              ${stderr ? `<div style="margin-top:6px;"><b>stderr:</b><pre>${escapeHtml(stderr)}</pre></div>` : ""}

              ${Array.isArray(r.attachments) && r.attachments.length
                ? `<div style="margin-top:6px;"><b>attachments:</b><pre>${escapeHtml(JSON.stringify(r.attachments, null, 2))}</pre></div>`
                : ""}
            </div>
          `;
        }).join("")}
      </details>
    `;

    runSection += `
      <tr>
        <td class="${escapeHtml(status)}">${escapeHtml(status)}</td>
        <td>${escapeHtml(titlePath)}</td>
        <td>${escapeHtml(loc)}</td>
        <td>${escapeHtml(last.duration ?? "")}</td>
        <td>${escapeHtml(formatLocal(last.startTime))}</td>
        <td>${detailsHtml}</td>
      </tr>
    `;
  }

  runSection += `
      </tbody>
    </table>
  </details>
  `;
}

runSection += `
</div>
`;

// ---------- append to report (history) ----------
let existing = "";
if (fs.existsSync(REPORT_FILE)) {
  existing = fs.readFileSync(REPORT_FILE, "utf8");
} else {
  existing = buildShell();
}

const finalHtml = `${stripClosingTags(existing)}\n${runSection}\n</body>\n</html>\n`;
fs.writeFileSync(REPORT_FILE, finalHtml, "utf8");

console.log("✔ Report erweitert: test-report.html");
