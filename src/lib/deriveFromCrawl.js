// src/lib/deriveFromCrawl.js
// SHARED derive logic: Screaming Frog "Internal All" rows in, section data out.
// Used by BOTH scripts/csv-to-data.js (Node) and the in-app CSV drop zone
// (browser). Pure functions only: no fs, no DOM, so it runs anywhere.

const THIN_WORDS = 200;

// Column names, with fallbacks for export/version differences.
// If a column is absent, its derived fields are skipped (not zeroed).
export const COLS = {
  address: ["Address"],
  status: ["Status Code"],
  indexability: ["Indexability"],
  contentType: ["Content Type"],
  title: ["Title 1", "Title"],
  meta: ["Meta Description 1", "Meta Description"],
  h1: ["H1-1", "H1 1"],
  h1b: ["H1-2", "H1 2"],
  words: ["Word Count"],
};

const pickCol = (row, names) => names.find((n) => n in row) ?? null;
const empty = (v) => v == null || String(v).trim() === "";

const duplicateCount = (values) => {
  // pages sharing a non-empty value with at least one other page
  const tally = {};
  for (const v of values) if (!empty(v)) tally[v] = (tally[v] || 0) + 1;
  return values.filter((v) => !empty(v) && tally[v] > 1).length;
};

/**
 * Derive both sections' numbers from parsed CSV rows.
 *
 * @param {object[]} parsedRows - PapaParse output rows (header: true, dynamicTyping: true).
 * @returns {{ ok: boolean, error?: string, technicalSeo?: object, onPageSeo?: object,
 *             info?: { rows: number, htmlPages: number, okPages: number, skippedCols: string[] } }}
 *   ok: false with an error message when no Address column is found;
 *   otherwise the derived section objects plus counts for reporting.
 */
export function deriveFromCrawl(parsedRows) {
  const first = parsedRows[0] || {};
  const C = Object.fromEntries(
    Object.entries(COLS).map(([k, names]) => [k, pickCol(first, names)])
  );

  if (!C.address) {
    return {
      ok: false,
      error:
        `No Address column found. Header row has: ` +
        `${Object.keys(first).slice(0, 8).join(", ")}...`,
    };
  }

  const rows = parsedRows.filter((r) => r[C.address]);
  const statusOf = (r) => Number(r[C.status]) || 0;

  // HTML pages only for page-level checks (assets skew every count)
  const pages = C.contentType
    ? rows.filter((r) => String(r[C.contentType] || "").includes("text/html"))
    : rows;
  // On-page checks only make sense on OK pages (a 404 has no title by nature)
  const okPages = pages.filter((r) => statusOf(r) === 200);

  const technicalSeo = {
    pagesCrawled: pages.length,
    indexable: C.indexability
      ? pages.filter((r) => String(r[C.indexability] || "") === "Indexable").length
      : undefined,
    brokenLinks: C.status
      ? rows.filter((r) => statusOf(r) >= 400 && statusOf(r) < 500).length
      : undefined,
    https: rows.every((r) => String(r[C.address]).startsWith("https://"))
      ? "ok"
      : "partial",
  };

  const onPageSeo = {};
  if (C.title) {
    onPageSeo.missingTitles = okPages.filter((r) => empty(r[C.title])).length;
    onPageSeo.duplicateTitles = duplicateCount(okPages.map((r) => r[C.title]));
  }
  if (C.meta) {
    onPageSeo.missingMeta = okPages.filter((r) => empty(r[C.meta])).length;
    onPageSeo.duplicateMeta = duplicateCount(okPages.map((r) => r[C.meta]));
  }
  if (C.h1) onPageSeo.missingH1 = okPages.filter((r) => empty(r[C.h1])).length;
  if (C.h1b) onPageSeo.multipleH1 = okPages.filter((r) => !empty(r[C.h1b])).length;
  if (C.words)
    onPageSeo.thinPages = okPages.filter(
      (r) => Number(r[C.words]) > 0 && Number(r[C.words]) < THIN_WORDS
    ).length;

  const clean = (obj) =>
    Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));

  return {
    ok: true,
    technicalSeo: clean(technicalSeo),
    onPageSeo,
    info: {
      rows: rows.length,
      htmlPages: pages.length,
      okPages: okPages.length,
      skippedCols: Object.entries(C).filter(([, v]) => !v).map(([k]) => k),
    },
  };
}

/**
 * Merge derived crawl numbers into an audit-data object, immutably.
 * Hand-typed fields (sitemap, robotsTxt, redirectChains) are preserved.
 */
export function mergeCrawl(data, derived) {
  return {
    ...data,
    technicalSeo: { ...(data.technicalSeo || {}), ...derived.technicalSeo },
    onPageSeo: { ...(data.onPageSeo || {}), ...derived.onPageSeo },
  };
}
