// vite-plugin-run-scripts.js
// Dev-server endpoints for the control panel. Whitelisted scripts only;
// each request spawns the same script the terminal would run and returns
// its full output. Dev-only, local machine only.
import { execFile } from "child_process";
import fs from "fs";

const SCRIPTS = {
  "new-audit": { file: "scripts/new-audit.js", args: 1 },
  "csv": { file: "scripts/csv-to-data.js", args: 1 },
  "check-ai": { file: "scripts/check-ai.js" },
  "check-tech": { file: "scripts/check-tech.js" },
  "check-brand": { file: "scripts/check-brand.js" },
  "check-pagespeed": { file: "scripts/check-pagespeed.js" },
  "check-access": { file: "scripts/check-access.js" },
  "check-seo-scores": { file: "scripts/check-seo-scores.js" },
  "check-domain": { file: "scripts/check-domain.js" },
  "check-authority": { file: "scripts/check-authority.js" },
  "check-freshness": { file: "scripts/check-freshness.js" },
  "check-usability": { file: "scripts/check-usability.js" },
  "set-agentic": { file: "scripts/set-agentic.js", args: 2 },
  "set-competitors": { file: "scripts/set-competitors.js", args: 9 },
};

const readBody = (req) =>
  new Promise((resolve) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
  });

export default function runScriptsPlugin() {
  return {
    name: "auditsmith-run-scripts",
    configureServer(server) {
      // upload a crawl CSV, then feed it to csv-to-data
      server.middlewares.use("/api/upload-csv", async (req, res) => {
        try {
          const buf = await readBody(req);
          fs.mkdirSync("uploads", { recursive: true });
          const path = "uploads/crawl-upload.csv";
          fs.writeFileSync(path, buf);
          execFile("node", ["scripts/csv-to-data.js", path], { timeout: 120000, maxBuffer: 8e6 }, (err, stdout, stderr) => {
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ ok: !err, output: `${stdout || ""}${stderr || ""}${err && !stdout ? err.message : ""}` }));
          });
        } catch (e) {
          res.statusCode = 500;
          res.end(JSON.stringify({ ok: false, output: String(e) }));
        }
      });

      // run a whitelisted script: POST /api/run {"id":"check-ai","args":[]}
      server.middlewares.use("/api/run", async (req, res) => {
        try {
          const body = JSON.parse((await readBody(req)).toString() || "{}");
          const spec = SCRIPTS[body.id];
          if (!spec) { res.statusCode = 400; res.end(JSON.stringify({ ok: false, output: `unknown script: ${body.id}` })); return; }
          const args = (body.args || []).slice(0, spec.args || 0).map(String);
          execFile("node", [spec.file, ...args], { timeout: 300000, maxBuffer: 8e6 }, (err, stdout, stderr) => {
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ ok: !err, output: `${stdout || ""}${stderr ? `\n${stderr}` : ""}${err && !stdout ? `\n${err.message}` : ""}` }));
          });
        } catch (e) {
          res.statusCode = 500;
          res.end(JSON.stringify({ ok: false, output: String(e) }));
        }
      });

      // fresh data for the preview after runs
      server.middlewares.use("/api/data", (req, res) => {
        res.setHeader("Content-Type", "application/json");
        res.end(fs.readFileSync("src/data/audit-data.json", "utf8"));
      });
    },
  };
}
