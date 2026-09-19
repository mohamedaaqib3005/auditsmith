# Auditsmith: Data Sources Map

Every fact in the report, cut by mechanism. Each mechanism has its own
cost, speed, and failure mode, which is the cost model of the product.

## 1. Free APIs with keys (~30% of the report's facts)

| Source | Key | Feeds | Limits |
|---|---|---|---|
| Google PageSpeed Insights | PSI_KEY | All of chapter 01 (scores, lab metrics, field data, both devices) plus half of chapter 07 (page weight, unsized images, console errors, viewport, font sizes, tap targets) | ~25k requests/day, generous |
| OpenPageRank | OPR_KEY | Chapter 06 authority: score, global rank, referring domains, competitor comparison table | 1k requests/day free |
| Brand-data API (prefetch) | PREFETCH_KEY | Theme colour, accent, fonts | Paid credits per call. The one source needing a budget gate on a public server |

## 2. Plain fetch, no keys, no browser (~35%)

The cheapest mechanism: HTTP requests reading public files. Scales free.

| Script | Reads | Feeds |
|---|---|---|
| check-ai | llms.txt, robots.txt, sitemap, homepage HTML | Chapter 04 checks (llms.txt, AI crawler rules, schema, no-JS words), the keyword focus table in 03 |
| check-tech | Response headers, DNS TXT records, page markup | Chapter 06 stack, server, IP, charset, SPF/DMARC |
| check-freshness | sitemap.xml lastmod dates | Content freshness card (03), sitemap coverage card (02) |
| check-domain | RDAP registry, Wayback Machine, crt.sh | Chapter 06 Domain & History: registration, expiry, archive months, certificates, subdomains |
| check-brand (primary paths) | theme-color meta, manifest, Google Fonts declarations | Report theming when the brand API is skipped |

## 3. Playwright automation (~20%)

The expensive mechanism: real Chromium, 1-3 minutes per script. Dictates
the server size and the ~4-6 minute per-audit runtime. Law: automates
the client's own site and single-purpose free checkers used as intended;
never logged-in services, paid products, or judgment calls.

| Script | Drives | Feeds |
|---|---|---|
| check-access | The client's site + axe-core | All of chapter 05: rules, categories, WCAG AA, named issues, weighted score |
| check-seo-scores | Seomator's free checker | The three rings in 04 (E-E-A-T, Social, Structured Data) |
| check-render | The client's page, fully rendered | JavaScript dependence card (04) |
| check-usability (browser half) | The client's site at 390px + a deliberate 404 visit | Search, nav links, form labelling, mobile overflow, contact, 404 quality (07) |

## 4. Screaming Frog CSV exports (~15% today)

Human-clicked exports fed through file doors. This is the slice
crawl-lite replaces with mechanism 2, after which the public flow is
100% API + fetch + Playwright. SF remains the advanced door: bigger
sites, Link Score, the deeper exports.

| Export | Door | Feeds |
|---|---|---|
| Internal tab, All | csv-to-data.js | Chapters 02 and 03 crawl facts: counts, indexability, broken links, titles, metas, H1s, truncation pixel widths, readability, canonicals, parameters, depth, weak pages |
| Images (optional) | images-to-data.js | Image alt-text card (02) |
| All Inlinks (optional) | inlinks-to-data.js | Anchor-text quality card (02) |

## 5. Typed human values (~1%)

| Value | How | Why human |
|---|---|---|
| Agentic Browsing fraction | set-agentic.js or the panel card | Shown only on Google's webpage, not its API; an automatic reader was tried and retired |
| Competitors list | set-competitors.js or the panel card | Business judgment; wrong rivals in a deliverable cost more than the two-minute ask saves |
| Protocols (AI visibility, heuristics, first impression, task walks) | Typed blocks per the guide | Expert judgment is the product's premium; the report labels it as human evaluation |

## Zero-source (computed)

Grades, rings, radar, the severity digest, and the Priority Action Plan
derive entirely from the sections above. Nothing external, nothing typed.

## Product implications

- Fetch scales free; PSI and OPR quotas cover early traffic
- The brand API needs a per-day credit cap or detector-only default
- Playwright dictates server size and the per-audit runtime
- crawl-lite converts the only human-dependent slice into fetch
- Absent sources leave absent cards, never guesses; that contract holds on the public site too
