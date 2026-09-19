// server/auditsmith-server.js
// Phase 2 of the product: the audit machine behind an HTTP API.
// Serial by design (the repo has one audit slot; new-audit archives the
// previous), a queue runs one job at a time through the SAME scripts
// the terminal and panel use, streams per-step status, and renders the
// PDF at the end. Keys come from .env as always; the brand API (paid
// credits) runs only when BRAND_CREDITS=on.
//
//   node server/auditsmith-server.js            (port 8787, or PORT env)
//
//   POST /api/audit   {"site":"example.com"}  -> {"id": "..."}
//   GET  /api/job/ID                          -> status + per-step outputs
//   GET  /api/job/ID/report.pdf               -> the finished PDF
//   GET  /api/jobs                            -> recent jobs

import http from "http";
import { execFile } from "child_process";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.env.PORT || 8787);
const JOBS_DIR = path.join(ROOT, "jobs");
fs.mkdirSync(JOBS_DIR, { recursive: true });

const DEFAULT_STEPS = [
  "new-audit", "crawl-lite", "check-ai", "check-tech",
  ...(process.env.BRAND_CREDITS === "on" ? ["check-brand"] : []),
  "check-pagespeed", "check-access", "check-seo-scores", "check-domain",
  "check-authority", "check-freshness", "check-usability", "check-render",
  "render-pdf",
];
const STEPS = process.env.AUDIT_STEPS ? process.env.AUDIT_STEPS.split(",") : DEFAULT_STEPS;
const REQUIRED = new Set(["new-audit", "crawl-lite", "render-pdf"]);
const STEP_TIMEOUT = 320000;

const jobs = new Map();
const queue = [];
let working = false;

// public-era guards: polite limits for strangers
const MAX_QUEUE = 10;
const RATE = { perHour: 4 };
const hits = new Map(); // ip -> [timestamps]
const allowed = (ip) => {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < 3600000);
  if (list.length >= RATE.perHour) { hits.set(ip, list); return false; }
  list.push(now);
  hits.set(ip, list);
  return true;
};

const PUBLIC_DIR = path.join(ROOT, "public");
const MIME = { ".html": "text/html; charset=utf-8", ".png": "image/png", ".svg": "image/svg+xml", ".ico": "image/x-icon" };
const serveStatic = (res, rel) => {
  const file = path.join(PUBLIC_DIR, rel);
  if (!file.startsWith(PUBLIC_DIR) || !fs.existsSync(file)) return false;
  res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
  return true;
};

const runStep = (job, id) =>
  new Promise((resolve) => {
    const args =
      id === "new-audit" ? ["scripts/new-audit.js", job.site]
      : id === "render-pdf" ? ["render.mjs", path.join(JOBS_DIR, `${job.id}.pdf`)]
      : [`scripts/${id}.js`];
    execFile("node", args, { cwd: id === "render-pdf" ? path.join(ROOT, "build") : ROOT, timeout: STEP_TIMEOUT, maxBuffer: 8e6 }, (err, stdout, stderr) => {
      resolve({ ok: !err, output: `${stdout || ""}${stderr ? `\n${stderr}` : ""}${err && !stdout ? `\n${err.message}` : ""}` });
    });
  });

const bundleRenderer = () =>
  new Promise((resolve) => {
    execFile("npx", ["esbuild", "scripts/render-pdf.jsx", "--bundle", "--platform=node", "--format=esm",
      "--outfile=build/render.mjs", "--packages=external", "--jsx=automatic",
      "--loader:.ttf=file", "--asset-names=[name]"],
      { cwd: ROOT, timeout: 60000 }, (err, so, se) => resolve(!err));
  });

async function work() {
  if (working) return;
  const job = queue.shift();
  if (!job) return;
  working = true;
  job.status = "running";
  for (const step of job.steps) {
    step.status = "running";
    const r = await runStep(job, step.id);
    step.status = r.ok ? "done" : "failed";
    step.output = r.output.slice(-4000);
    if (!r.ok && REQUIRED.has(step.id)) { job.status = "failed"; break; }
  }
  if (job.status !== "failed") {
    job.status = "done";
    job.pdf = `/api/job/${job.id}/report.pdf`;
  }
  job.finishedAt = new Date().toISOString();
  working = false;
  setImmediate(work);
}

const json = (res, code, obj) => { res.writeHead(code, { "Content-Type": "application/json" }); res.end(JSON.stringify(obj)); };
const body = (req) => new Promise((r) => { const c = []; req.on("data", (d) => c.push(d)); req.on("end", () => r(Buffer.concat(c).toString())); });

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://x`);
  if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/index.html")) {
    if (serveStatic(res, "index.html")) return;
  }
  if (req.method === "GET" && !url.pathname.startsWith("/api/")) {
    if (serveStatic(res, url.pathname.slice(1))) return;
  }
  if (req.method === "POST" && url.pathname === "/api/audit") {
    const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.socket.remoteAddress || "?";
    if (queue.length >= MAX_QUEUE) return json(res, 429, { error: "queue is full, try again soon" });
    if (!allowed(ip)) return json(res, 429, { error: "rate limit: a few audits per hour per visitor" });
    let site;
    try { site = String(JSON.parse(await body(req)).site || ""); } catch { return json(res, 400, { error: "bad json" }); }
    site = site.replace(/^https?:\/\//, "").replace(/\/.*$/, "").toLowerCase();
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(site)) return json(res, 400, { error: "not a valid domain" });
    const job = {
      id: crypto.randomUUID(), site, status: "queued",
      createdAt: new Date().toISOString(),
      steps: STEPS.map((id) => ({ id, status: "queued" })),
    };
    jobs.set(job.id, job);
    queue.push(job);
    setImmediate(work);
    return json(res, 202, { id: job.id, site, position: queue.length });
  }
  const jobMatch = url.pathname.match(/^\/api\/job\/([0-9a-f-]+)$/);
  if (req.method === "GET" && jobMatch) {
    const job = jobs.get(jobMatch[1]);
    return job ? json(res, 200, job) : json(res, 404, { error: "no such job" });
  }
  const pdfMatch = url.pathname.match(/^\/api\/job\/([0-9a-f-]+)\/report\.pdf$/);
  if (req.method === "GET" && pdfMatch) {
    const p = path.join(JOBS_DIR, `${pdfMatch[1]}.pdf`);
    if (!fs.existsSync(p)) return json(res, 404, { error: "no pdf (job unfinished?)" });
    res.writeHead(200, { "Content-Type": "application/pdf" });
    return fs.createReadStream(p).pipe(res);
  }
  if (req.method === "GET" && url.pathname === "/api/jobs") {
    return json(res, 200, [...jobs.values()].slice(-20).map(({ id, site, status, createdAt }) => ({ id, site, status, createdAt })));
  }
  json(res, 404, { error: "unknown route" });
});

const ok = await bundleRenderer();
console.log(`renderer ${ok ? "bundled" : "BUNDLE FAILED (render-pdf step will fail)"}`);
server.listen(PORT, () => console.log(`Auditsmith server on http://localhost:${PORT}`));
