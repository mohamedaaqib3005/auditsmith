// scripts/check-tech.js
// Technology fetcher: detects the site's stack, server details, and email
// security records, writing them into audit-data.json's "technology" block.
// Fully automatic, nothing here is ever typed. Evidence only - failed
// lookups write nothing.
//
//   detected  - technologies recognised in the homepage HTML and headers
//   server    - the Server response header
//   ip        - resolved address
//   charset   - from Content-Type or the HTML meta
//   spf       - SPF TXT record present? (ok / missing)
//   dmarc     - DMARC record: ok (enforcing), partial (p=none), missing
//
// Usage:
//   node scripts/check-tech.js            (site read from audit-data.json)
//   node scripts/check-tech.js vlncy.com

import fs from "fs";
import dns from "dns/promises";

const DATA_PATH = "src/data/audit-data.json";
const TIMEOUT_MS = 10000;

const data = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
const site = process.argv[2] || data.site;
if (!site) {
  console.error("No site given and none in audit-data.json.");
  process.exit(1);
}
const host = String(site).replace(/^https?:\/\//, "").split("/")[0];
const origin = `https://${host}`;

// Homepage signatures -> technology names (first match per name wins)
const SIGNATURES = [
  ["Google Tag Manager", /googletagmanager\.com/i],
  ["Google Analytics", /gtag\(|google-analytics\.com|\bga\(/i],
  ["Next.js", /__NEXT_DATA__|\/_next\//i],
  ["Nuxt", /__NUXT__/i],
  ["React", /data-reactroot|react-dom/i],
  ["Vue.js", /\bdata-v-[0-9a-f]{8}\b|vue(?:\.min)?\.js/i],
  ["WordPress", /wp-content|wp-includes/i],
  ["Shopify", /cdn\.shopify\.com/i],
  ["Wix", /static\.wixstatic\.com|wix\.com/i],
  ["Squarespace", /squarespace\.com|sqsp\.net/i],
  ["Webflow", /assets\.website-files\.com|webflow/i],
  ["Framer", /framerusercontent\.com|framer\.com/i],
  ["jQuery", /jquery[.-]/i],
  ["Bootstrap", /bootstrap(?:\.min)?\.(?:css|js)/i],
  ["Tailwind CSS", /tailwindcss|(?:^|\s)class="[^"]*\bflex\b[^"]*\bjustify-/i],
  ["Cloudflare", /cdn-cgi\/|cloudflare/i],
  ["Font Awesome", /font-?awesome/i],
  ["Google Fonts", /fonts\.googleapis\.com/i],
];

const fetchHome = async () => {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${origin}/`, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: { "User-Agent": "AuditsmithCheck/1.0" },
    });
    return { status: res.status, text: await res.text(), headers: res.headers };
  } catch (e) {
    return { status: 0, text: "", headers: new Headers(), error: e.name === "AbortError" ? "timeout" : e.message };
  } finally {
    clearTimeout(timer);
  }
};

const home = await fetchHome();
const tech = {};
const report = [];

if (home.status === 200) {
  const hay = home.text;
  const detected = SIGNATURES.filter(([, re]) => re.test(hay)).map(([name]) => name);
  const serverHeader = home.headers.get("server");
  if (serverHeader && !detected.includes("Cloudflare") && /cloudflare/i.test(serverHeader)) detected.push("Cloudflare");
  tech.detected = detected;
  report.push(["detected", detected.length ? detected.join(", ") : "none recognised"]);

  if (serverHeader) {
    tech.server = serverHeader;
    report.push(["server", serverHeader]);
  } else report.push(["server", "not disclosed (no Server header)"]);

  const ct = home.headers.get("content-type") || "";
  const metaCharset = (hay.match(/<meta[^>]+charset=["']?([\w-]+)/i) || [])[1];
  const charset = (ct.match(/charset=([\w-]+)/i) || [])[1] || metaCharset;
  if (charset) {
    tech.charset = charset.toLowerCase();
    report.push(["charset", tech.charset]);
  }
} else {
  report.push(["homepage", `could not fetch (${home.error || `HTTP ${home.status}`}), stack not detected`]);
}

try {
  const { address } = await dns.lookup(host);
  tech.ip = address;
  report.push(["ip", address]);
} catch (e) {
  report.push(["ip", `could not resolve (${e.code})`]);
}

// SPF: any TXT record starting v=spf1
try {
  const txt = (await dns.resolveTxt(host)).map((parts) => parts.join(""));
  tech.spf = txt.some((t) => /^v=spf1/i.test(t));
  report.push(["spf", String(tech.spf)]);
} catch (e) {
  if (e.code === "ENODATA" || e.code === "ENOTFOUND") {
    tech.spf = false;
    report.push(["spf", "false (no TXT records)"]);
  } else report.push(["spf", `could not check (${e.code})`]);
}

// DMARC: _dmarc TXT; p=none is "present but not enforcing"
try {
  const txt = (await dns.resolveTxt(`_dmarc.${host}`)).map((p) => p.join(""));
  const rec = txt.find((t) => /^v=DMARC1/i.test(t));
  if (!rec) tech.dmarc = "missing";
  else tech.dmarc = ((rec.match(/p=(none|quarantine|reject)/i) || [])[1] || "none").toLowerCase();
  report.push(["dmarc", `${tech.dmarc}${rec ? ` (${rec})` : ""}`]);
} catch (e) {
  if (e.code === "ENOTFOUND" || e.code === "ENODATA") {
    tech.dmarc = "missing";
    report.push(["dmarc", "missing (no _dmarc record)"]);
  } else report.push(["dmarc", `could not check (${e.code})`]);
}

data.technology = { ...(data.technology || {}), ...tech };
fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2) + "\n");

console.log(`Checked ${host}:`);
for (const [k, v] of report) console.log(`  ${k.padEnd(9)}: ${v}`);
console.log(`\nWritten to ${DATA_PATH}.`);
