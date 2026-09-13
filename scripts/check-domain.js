// scripts/check-domain.js
// Domain fetcher: registration facts (RDAP, straight from the registry),
// site history (Wayback Machine), and certificate/subdomain footprint
// (crt.sh). All free, keyless, official APIs; works for any domain.
// Facts only; failed lookups write nothing (crt.sh is slow and treated
// as best-effort).
//
// Usage: node scripts/check-domain.js            (site from audit-data.json)
//        node scripts/check-domain.js example.com

import fs from "fs";

const DATA_PATH = "src/data/audit-data.json";
const data = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
const site = process.argv[2] || data.site;
if (!site) { console.error("No site given and none in audit-data.json."); process.exit(1); }
const host = String(site).replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
const tld = host.split(".").pop();

const get = (url, ms, headers = {}) =>
  fetch(url, { signal: AbortSignal.timeout(ms), headers: { "User-Agent": "AuditsmithCheck/1.0", ...headers } });

const dom = {};
const report = [];

// ---- RDAP: registry-of-record facts ----
try {
  const url =
    tld === "com" || tld === "net"
      ? `https://rdap.verisign.com/${tld}/v1/domain/${host}`
      : `https://rdap.org/domain/${host}`;
  const r = await get(url, 15000, { Accept: "application/rdap+json" });
  if (r.ok) {
    const j = await r.json();
    const ev = (a) => (j.events || []).find((e) => e.eventAction === a)?.eventDate;
    const reg = ev("registration");
    const exp = ev("expiration");
    if (reg) { dom.registered = reg.slice(0, 10); report.push(["registered", dom.registered]); }
    if (exp) { dom.expires = exp.slice(0, 10); report.push(["expires", dom.expires]); }
    const status = j.status || [];
    if (status.length) {
      dom.transferLock = status.some((s) => /transfer prohibited/i.test(s));
      report.push(["transferLock", String(dom.transferLock)]);
    }
  } else report.push(["rdap", `could not check (HTTP ${r.status})`]);
} catch (e) { report.push(["rdap", `could not check (${e.message})`]); }

// ---- Wayback: first snapshot + activity months ----
try {
  const r = await get(`https://archive.org/wayback/available?url=${host}&timestamp=1996`, 15000);
  const j = await r.json();
  const ts = j?.archived_snapshots?.closest?.timestamp;
  if (ts) { dom.firstArchived = `${ts.slice(0,4)}-${ts.slice(4,6)}-${ts.slice(6,8)}`; report.push(["firstArchived", dom.firstArchived]); }
} catch (e) { report.push(["wayback", `could not check (${e.message})`]); }
try {
  const r = await get(`https://web.archive.org/cdx/search/cdx?url=${host}&output=json&fl=timestamp&collapse=timestamp:6`, 25000);
  if (r.ok) {
    const j = JSON.parse(await r.text());
    if (Array.isArray(j) && j.length > 1) { dom.archiveMonths = j.length - 1; report.push(["archiveMonths", String(dom.archiveMonths)]); }
  }
} catch { report.push(["archiveMonths", "could not check (endpoint unreachable)"]); }

// ---- crt.sh: certificate transparency, best-effort ----
try {
  const r = await get(`https://crt.sh/?q=${host}&output=json`, 30000);
  if (r.ok) {
    const certs = await r.json();
    if (Array.isArray(certs) && certs.length) {
      const names = new Set(
        certs.flatMap((c) => String(c.name_value).split("\n"))
          .map((n) => n.trim().toLowerCase())
          .filter((n) => n && !n.startsWith("*") && n.endsWith(host) && n !== host && n !== `www.${host}`)
      );
      dom.certCount = certs.length;
      dom.subdomains = [...names].sort().slice(0, 20);
      report.push(["certCount", String(certs.length)]);
      report.push(["subdomains", dom.subdomains.length ? dom.subdomains.join(", ") : "none beyond www"]);
    }
  } else report.push(["crt.sh", `could not check (HTTP ${r.status})`]);
} catch (e) { report.push(["crt.sh", `could not check (slow or unreachable), rerun later if wanted`]); }

if (!Object.keys(dom).length) {
  console.error(`No domain facts could be fetched for ${host}. Nothing written.`);
  process.exit(1);
}
data.domain = { ...(data.domain || {}), ...dom };
fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2) + "\n");

console.log(`Checked ${host}:`);
for (const [k, v] of report) console.log(`  ${k.padEnd(14)}: ${v}`);
console.log(`\nWritten to ${DATA_PATH}.`);
