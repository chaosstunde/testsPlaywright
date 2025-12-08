import fs from "fs";
import { urls } from "./test-urls.js";

const results = JSON.parse(
  fs.readFileSync("./tests-results/results.json", "utf8")
);

// Gruppieren: URL → Tests
const testsByUrl = {};

function getUrlFromProjectName(projectName) {
  if (!projectName.startsWith("url-")) return null;
  const key = projectName.replace("url-", "");
  return urls[key] || null;
}

// Tests extrahieren
for (const rootSuite of results.suites) {
  for (const suite of rootSuite.suites || []) {
    for (const spec of suite.specs || []) {
      for (const test of spec.tests) {
        const result = test.results[0];
        const projectName = test.projectName;
        const testedUrl = getUrlFromProjectName(projectName);
        if (!testedUrl) continue;

        if (!testsByUrl[testedUrl]) testsByUrl[testedUrl] = [];

        testsByUrl[testedUrl].push({
          title: spec.title,
          project: projectName,
          status: result.status,
          duration: result.duration,
          timestamp: new Date(result.startTime).toLocaleString()
        });
      }
    }
  }
}

// Datei einlesen oder Grundgerüst erzeugen
let html = "";

if (fs.existsSync("test-report.html")) {
  html = fs.readFileSync("test-report.html", "utf8");

  // Alte Datei ohne </body></html> damit wir anhängen können
  html = html.replace("</body></html>", "");
} else {
  // Neue Datei Grundgerüst
  html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Playwright Testreport – Historie</title>
  <style>
    body { font-family: Arial; margin: 20px; }
    h1 { margin-bottom: 10px; }
    .run-section { margin-bottom: 40px; }
    summary { cursor: pointer; font-weight: bold; padding: 5px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th, td { border: 1px solid #aaa; padding: 8px; }
    th { background: #ddd; }
    .passed { color: green; font-weight: bold; }
    .failed { color: red; font-weight: bold; }
  </style>
</head>
<body>
<h1>Playwright Testreport – Historie</h1>
`;
}

// Neue Testlauf-Section erzeugen
html += `
<hr/>
<div class="run-section">
<h2>Testlauf vom ${new Date().toLocaleString()}</h2>
`;

// Für jede Webseite collapsible Tabelle erzeugen
for (const [url, tests] of Object.entries(testsByUrl)) {
  html += `
  <details>
    <summary>Getestete Webseite: ${url} (${tests.length} Tests)</summary>
    <table>
      <tr>
        <th>Testname</th>
        <th>Projekt</th>
        <th>Status</th>
        <th>Dauer (ms)</th>
        <th>Zeitpunkt</th>
      </tr>
  `;

  for (const t of tests) {
    html += `
      <tr>
        <td>${t.title}</td>
        <td>${t.project}</td>
        <td class="${t.status}">${t.status}</td>
        <td>${t.duration}</td>
        <td>${t.timestamp}</td>
      </tr>
    `;
  }

  html += `
    </table>
  </details>
  <br/>
  `;
}

html += `
</div>
</body>
</html>
`;

fs.writeFileSync("test-report.html", html, "utf8");

console.log("✔ HTML-Report aktualisiert und erweitert: test-report.html");
