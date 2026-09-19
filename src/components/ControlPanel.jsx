// src/components/ControlPanel.jsx
// The audit cockpit: every terminal step as a gated button. Each step
// unlocks when the previous one succeeds; every run shows the script's
// own printout. Dev-only, it talks to the run-scripts plugin.
import { useState, useRef } from "react";

const P = "#460073";
const card = { background: "#fff", border: "1px solid #e6e2ee", borderRadius: 12, padding: "14px 16px", marginBottom: 10 };
const btn = (enabled, busy) => ({
  background: busy ? "#a58fc4" : enabled ? P : "#d8d2e4",
  color: "#fff", border: "none", borderRadius: 8, padding: "8px 14px",
  fontWeight: 600, cursor: enabled && !busy ? "pointer" : "default", fontSize: 13,
});
const inp = { border: "1px solid #d8d2e4", borderRadius: 8, padding: "8px 10px", fontSize: 13, width: "100%", boxSizing: "border-box" };
const tick = (state) => (state === "done" ? "✓" : state === "fail" ? "✕" : "");

const ROBOTS = [
  ["check-ai", "AI readiness + keywords"],
  ["check-tech", "Technology + email"],
  ["check-brand", "Brand colour + fonts"],
  ["check-pagespeed", "PageSpeed (both devices)"],
  ["check-access", "Accessibility (axe-core)"],
  ["check-seo-scores", "AI score rings"],
  ["check-domain", "Domain + history"],
  ["check-authority", "Off-site authority"],
  ["check-freshness", "Content freshness"],
  ["check-usability", "Usability"],
  ["check-render", "JavaScript dependence"],
];

export default function ControlPanel({ onData }) {
  const [site, setSite] = useState("");
  const [busy, setBusy] = useState(null);
  const [states, setStates] = useState({});
  const [outputs, setOutputs] = useState({});
  const [open, setOpen] = useState(null);
  const [agentic, setAgentic] = useState({ m: "", d: "" });
  const [comps, setComps] = useState("");
  const fileRef = useRef();

  const refresh = async () => onData?.(await (await fetch("/api/data")).json());
  const mark = (id, ok, out) => {
    setStates((s) => ({ ...s, [id]: ok ? "done" : "fail" }));
    setOutputs((o) => ({ ...o, [id]: out }));
    if (!ok) setOpen(id);
  };
  const run = async (id, args = []) => {
    setBusy(id);
    try {
      const r = await fetch("/api/run", { method: "POST", body: JSON.stringify({ id, args }) });
      const j = await r.json();
      mark(id, j.ok, j.output);
      if (j.ok) await refresh();
    } catch (e) { mark(id, false, String(e)); }
    setBusy(null);
  };
  const uploadCsv = async (file) => {
    setBusy("csv");
    try {
      const r = await fetch("/api/upload-csv", { method: "POST", body: await file.arrayBuffer() });
      const j = await r.json();
      mark("csv", j.ok, j.output);
      if (j.ok) await refresh();
    } catch (e) { mark("csv", false, String(e)); }
    setBusy(null);
  };

  const started = states["new-audit"] === "done";
  const crawled = states["csv"] === "done";
  const robotDone = (i) => states[ROBOTS[i][0]] === "done";
  const robotEnabled = (i) => crawled && (i === 0 || robotDone(i - 1));

  const Out = ({ id }) =>
    outputs[id] ? (
      <div style={{ marginTop: 8 }}>
        <button onClick={() => setOpen(open === id ? null : id)} style={{ background: "none", border: "none", color: P, fontSize: 12, cursor: "pointer", padding: 0 }}>
          {open === id ? "hide output" : "show output"}
        </button>
        {open === id && (
          <pre style={{ fontSize: 11, background: "#f6f4fa", borderRadius: 8, padding: 10, whiteSpace: "pre-wrap", maxHeight: 180, overflow: "auto" }}>{outputs[id]}</pre>
        )}
      </div>
    ) : null;

  return (
    <div style={{ width: 380, minWidth: 380, height: "100vh", overflow: "auto", background: "#faf9fc", borderRight: "1px solid #e6e2ee", padding: 18, boxSizing: "border-box", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ textAlign: "center", marginBottom: 14 }}>
        <img src="/auditsmith-logo.png" alt="Auditsmith" style={{ width: 190 }} />
      </div>

      <div style={card}>
        <div style={{ fontWeight: 700, marginBottom: 8, color: "#1c1430" }}>Enter the website to analyse {tick(states["new-audit"])}</div>
        <input style={inp} placeholder="brand.com" value={site} onChange={(e) => setSite(e.target.value)} />
        <div style={{ marginTop: 8 }}>
          <button style={btn(!!site.trim(), busy === "new-audit")} disabled={!site.trim() || busy} onClick={() => run("new-audit", [site.trim()])}>
            {busy === "new-audit" ? "Starting..." : "Analyse"}
          </button>
        </div>
        <Out id="new-audit" />
      </div>

      {started && (
        <div style={card}>
          <div style={{ fontWeight: 700, color: "#1c1430" }}>Crawl {tick(states["csv"])}</div>
          <div style={{ fontSize: 12, color: "#5a5470", margin: "6px 0" }}>
            In Screaming Frog: crawl {site || "the site"}, then Internal tab, filter All, Export. Choose that CSV here.
          </div>
          <button style={{ ...btn(true, busy === "csv"), width: "100%", marginBottom: 8 }} disabled={busy}
            onClick={async () => {
              setBusy("csv");
              try {
                const r = await fetch("/api/run", { method: "POST", body: JSON.stringify({ id: "crawl-lite" }) });
                const j = await r.json();
                mark("csv", j.ok, j.output);
                if (j.ok) await refresh();
              } catch (e) { mark("csv", false, String(e)); }
              setBusy(null);
            }}>
            {busy === "csv" ? "Crawling (2-4 min)..." : "Crawl automatically (no Screaming Frog)"}
          </button>
          <div style={{ fontSize: 11, color: "#8a84a0", margin: "2px 0 6px" }}>or, for deeper crawls, the Screaming Frog export:</div>
          <input ref={fileRef} type="file" accept=".csv" style={{ fontSize: 12 }} onChange={(e) => e.target.files[0] && uploadCsv(e.target.files[0])} />
          <Out id="csv" />
        </div>
      )}

      {crawled && (
        <div style={card}>
          <div style={{ fontWeight: 700, color: "#1c1430", marginBottom: 8 }}>The measurements</div>
          {ROBOTS.map(([id, label], i) => (
            <div key={id} style={{ marginBottom: 8 }}>
              <button style={{ ...btn(robotEnabled(i), busy === id), width: "100%", textAlign: "left" }} disabled={!robotEnabled(i) || busy} onClick={() => run(id)}>
                {busy === id ? "Running..." : `${i + 1}. ${label} ${tick(states[id])}`}
              </button>
              <Out id={id} />
            </div>
          ))}
        </div>
      )}

      {robotDone(3) && (
        <div style={card}>
          <div style={{ fontWeight: 700, color: "#1c1430" }}>Agentic Browsing {tick(states["set-agentic"])}</div>
          <div style={{ fontSize: 12, color: "#5a5470", margin: "6px 0" }}>From pagespeed.web.dev, the fraction after SEO, per device.</div>
          <div style={{ display: "flex", gap: 8 }}>
            <input style={inp} placeholder="mobile 2/3" value={agentic.m} onChange={(e) => setAgentic({ ...agentic, m: e.target.value })} />
            <input style={inp} placeholder="desktop 3/3" value={agentic.d} onChange={(e) => setAgentic({ ...agentic, d: e.target.value })} />
            <button style={btn(/^\d+\/\d+$/.test(agentic.m), busy === "set-agentic")} disabled={!/^\d+\/\d+$/.test(agentic.m) || busy}
              onClick={() => run("set-agentic", [agentic.m, agentic.d].filter(Boolean))}>Set</button>
          </div>
          <Out id="set-agentic" />
        </div>
      )}

      {crawled && (
        <div style={card}>
          <div style={{ fontWeight: 700, color: "#1c1430" }}>Competitors {tick(states["set-competitors"])}</div>
          <div style={{ fontSize: 12, color: "#5a5470", margin: "6px 0" }}>Comma-separated domains, then rerun Off-site authority for the comparison table.</div>
          <div style={{ display: "flex", gap: 8 }}>
            <input style={inp} placeholder="rival1.com, rival2.com" value={comps} onChange={(e) => setComps(e.target.value)} />
            <button style={btn(!!comps.trim(), busy === "set-competitors")} disabled={!comps.trim() || busy}
              onClick={() => run("set-competitors", comps.split(",").map((s) => s.trim()).filter(Boolean))}>Set</button>
          </div>
          <Out id="set-competitors" />
        </div>
      )}
    </div>
  );
}
