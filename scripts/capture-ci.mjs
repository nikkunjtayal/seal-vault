import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "docs", "screenshots");
mkdirSync(out, { recursive: true });

const run = JSON.parse(
  execSync(
    "gh run view 36729200203 --repo nikkunjtayal/vault-bid --json url,conclusion,displayTitle,headBranch,event,createdAt,updatedAt,jobs,headSha",
    { encoding: "utf8" },
  ),
);

const job = run.jobs[0];
const steps = (job.steps || [])
  .filter((s) => !String(s.name).startsWith("Post ") && s.name !== "Complete job" && s.name !== "Set up job")
  .map(
    (s) =>
      `<tr><td class="ok">âœ“</td><td>${s.name}</td><td class="muted">${s.conclusion}</td></tr>`,
  )
  .join("");

const html = `<!doctype html>
<html><head><meta charset="utf-8" />
<style>
  body{margin:0;background:#0d1117;color:#e6edf3;font:14px/1.45 -apple-system,Segoe UI,sans-serif;padding:28px}
  h1{font-size:22px;margin:0 0 6px;font-weight:650}
  .sub{color:#8b949e;margin:0 0 18px}
  .badge{display:inline-block;background:#238636;color:#fff;border-radius:999px;padding:3px 10px;font-size:12px;font-weight:600;margin-right:8px}
  .card{border:1px solid #30363d;border-radius:10px;padding:16px 18px;background:#161b22}
  table{width:100%;border-collapse:collapse;margin-top:8px}
  td{padding:8px 6px;border-top:1px solid #21262d}
  .ok{color:#3fb950;width:28px;font-weight:700}
  .muted{color:#8b949e;text-align:right}
  a{color:#58a6ff;text-decoration:none}
  .meta{display:grid;grid-template-columns:140px 1fr;gap:6px 12px;margin:14px 0 4px}
  .meta span{color:#8b949e}
</style></head>
<body>
  <h1>ShadePass â€” GitHub Actions CI</h1>
  <p class="sub"><span class="badge">success</span> Workflow <b>CI</b> on <b>main</b> Â· push</p>
  <div class="card">
    <div><b>${run.displayTitle}</b></div>
    <div class="meta">
      <span>Repo</span><div>nikkunjtayal/vault-bid</div>
      <span>Job</span><div>${job.name} Â· ${job.conclusion}</div>
      <span>Run</span><div><a href="${run.url}">${run.url}</a></div>
      <span>Branch</span><div>${run.headBranch}</div>
    </div>
    <table>${steps}</table>
  </div>
</body></html>`;

writeFileSync(join(out, "ci-run.html"), html);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1100, height: 720 } });
await page.setContent(html, { waitUntil: "load" });
await page.screenshot({ path: join(out, "ci-cd.png"), fullPage: true });

// Also try live Actions page if accessible
try {
  await page.goto(run.url, { waitUntil: "domcontentloaded", timeout: 45_000 });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: join(out, "ci-actions.png"), fullPage: false });
} catch (e) {
  console.error("live actions shot skipped:", e.message);
}

await browser.close();
console.log("Wrote ci-cd.png");

