# Filling In the Audit Data

This guide shows you how to create a report. You type a small set of numbers
into one file; everything else, the cover, the dates, the ratings, the
colours, the section layout, is generated automatically.

---

## 1. The one file you edit

```
src/data/audit-data.json
```

Open it in VS Code. Save it, and the PDF preview rebuilds itself.

The complete file looks like this. This is EVERYTHING a user types:

```json
{
  "site": "vlncy.com",
  "pagespeed": {
    "device": "mobile",

    "scores": {
      "performance": 79,
      "accessibility": 88,
      "bestPractices": 96,
      "seo": 92,
      "agenticBrowsing": "2/2"
    },

    "fieldData": {
      "lcp": 2.2,
      "inp": null,
      "cls": 0,
      "fcp": 2,
      "ttfb": 1
    },

    "labMetrics": {
      "fcp": 2.5,
      "lcp": 2.5,
      "tbt": 480,
      "cls": 0,
      "speedIndex": 4.6
    }
  },

  "technicalSeo": {
    "redirectChains": 0
  }
}
```

`redirectChains` is the ONLY field outside pagespeed you may type, and even
it is optional (no value = its row simply not shown; the number comes from
Screaming Frog's Reports menu, Redirect Chains). Everything else in
`technicalSeo`, `onPageSeo`, and `aiReadiness` is written by the two scripts
(section 5 below), you never type any of it.

**Golden rule: numbers only, no units.** Write `2.2`, never `"2.2 s"` or
`2.2s`. The system adds units, colours, and labels itself.

---

## 2. What you type vs what gets generated

You type 5 things. The system derives the rest:

| You type | The system generates from it |
|---|---|
| `site` | Cover title, brand name ("Prepared for: Vlncy"), reference number (AUD-VLNCY-2026-001), summary text |
| `device` | Type `"mobile"` or `"desktop"`, whichever tab you read the results from. Generates the Test Conditions box (device model, tool version, network throttling) |
| `scores` | The coloured score circles |
| `fieldData` | The Field Data rows, each colour-rated, plus the Passed/Failed assessment |
| `labMetrics` | The Lab Metrics rows, each colour-rated |
| `redirectChains` (optional) | The one non-pagespeed field you may type; its row appears only when set |
| (the crawl script) | `technicalSeo` crawl numbers, all `onPageSeo` counts, and `metaRobots`; chapters 02 and 03 |
| (the site checker) | sitemap, robots.txt, llms.txt, AI crawler access, Schema.org, no-JS readability; the rest of chapters 02 and 04 |
| (nothing) | Today's date, on the cover and in the header, automatically |

You never type: dates, names, ratings, labels, section headings, or the
Passed/Failed verdict. If you find yourself typing a colour word or a date,
stop, the system does that.

---

## 3. Where each value comes from

Run the test at https://pagespeed.web.dev, enter the site URL, wait for
results. Keep the results page open, every number below is on it.

### 3a. `site`

The website you audited, e.g. `"vlncy.com"`. With or without `https://` is
fine, the system cleans it. The brand name on the cover is taken from it
automatically (vlncy.com becomes Vlncy).

### 3b. `device`

On the PageSpeed results page there are two tabs at the top: **Mobile** and
**Desktop**. Type whichever one you selected before reading the numbers:

```json
"device": "mobile"
```

or `"desktop"`. Lowercase, in quotes. Mobile is PageSpeed's default tab and
usually what we report.

This must match the tab you copied the scores and metrics from, the numbers
differ between tabs, and this value also selects the correct Test Conditions
text (device model, network throttling) in the PDF. Exactly `"mobile"` or
`"desktop"`: any other spelling is silently treated as mobile.

### 3c. `scores`

The row of big circled numbers on the results page. Copy each number:

- Performance, Accessibility, Best Practices, SEO: plain numbers, `79` not `"79"`
- Agentic Browsing shows as a fraction like 2/2: type it as a string, `"2/2"`

If a category is missing from your results, delete that line entirely.

### 3d. `fieldData`

The top panel, "Discover what your real users are experiencing". Five
metrics. Type ONLY the number part of what Google shows:

| Google shows | You type |
|---|---|
| LCP 2.2 s | `"lcp": 2.2` |
| INP 180 ms | `"inp": 180` |
| CLS 0.05 | `"cls": 0.05` |
| FCP 2.0 s | `"fcp": 2` |
| TTFB 1.0 s | `"ttfb": 1` |

Units to know: lcp, fcp, ttfb are in **seconds**; inp is in
**milliseconds**; cls has **no unit**.

**If a metric shows no data** (grey, or "N/A", common for new sites): type
`null`, no quotes: `"inp": null`. It will show as N/A in the report and is
excluded from the Passed/Failed calculation.

**If the whole panel says there is not enough real-user data**: delete the
entire `fieldData` block. The Core Web Vitals section will simply not appear
in the PDF.

### 3e. `labMetrics`

The Metrics area under the Performance score. Same rule, numbers only:

| Google shows | You type |
|---|---|
| First Contentful Paint 2.5 s | `"fcp": 2.5` |
| Largest Contentful Paint 2.5 s | `"lcp": 2.5` |
| Total Blocking Time 480 ms | `"tbt": 480` |
| Cumulative Layout Shift 0 | `"cls": 0` |
| Speed Index 4.6 s | `"speedIndex": 4.6` |

Units: fcp, lcp, speedIndex in **seconds**; tbt in **milliseconds**; cls
**no unit**. Note speedIndex is one word with a capital I, exactly
`speedIndex`.

---

### 3f. `technicalSeo` (automatic; one optional field)

Everything here is written by the scripts: the crawl numbers by
`csv-to-data.js`, and `sitemap` / `robotsTxt` by `check-ai.js`, which
actually visits the site and records what it finds.

Two things a human can still add:

| Field | When |
|---|---|
| `redirectChains` | Optional. Screaming Frog: Reports menu, Redirect Chains; type the number it lists. Absent = row not shown |
| `sitemap: "stale"` | Override. The checker can prove a sitemap exists, not whether its URLs are current. If you know it lists old pages, change `"ok"` to `"stale"` by hand; the scripts will not overwrite a `"stale"` you typed |

### 3g. `aiReadiness` (automatic)

All five fields are filled by the scripts, none are typed:

| Field | Filled by | How it is measured |
|---|---|---|
| `llmsTxt` | site checker | requests `/llms.txt`; 404 = missing |
| `aiCrawlers` | site checker | downloads robots.txt and parses it for GPTBot, ClaudeBot, PerplexityBot, Google-Extended blocks |
| `structuredData` | site checker | scans the homepage HTML for Schema.org markup (JSON-LD or microdata) |
| `contentAccess` | site checker | fetches the homepage WITHOUT JavaScript (exactly what AI crawlers see) and counts readable words |
| `metaRobots` | crawl script | reads the crawl's "Meta Robots" column for accidental noindex on real pages |

If a check cannot run (site unreachable, blocked), the script writes
nothing for that field rather than guessing, and says so in its output.

**One typed extra: the three AI score rings.** Run the site through
Seomator's free audit (seomator.com/free-seo-audit-tool) and copy its
E-E-A-T, Social Signals, and Structured Data scores as plain numbers:

```json
"aiReadiness": {
  "scores": { "eeat": 65, "socials": 40, "structuredData": 25 }
}
```

(These sit inside the existing aiReadiness block, next to the automatic
fields.) Delete any score you did not collect; its ring simply will not
appear. Note `structuredData` appears twice by design: the automatic
ok/missing check, and this typed 0-100 score, they are different
measurements.

### 3h. `accessibility` (typed from the Skynet checker)

Run the site through
https://www.skynettechnologies.com/accessibility-checker and copy each
category's Passed and Failed counts:

```json
"accessibility": {
  "score": 44.61,
  "categories": {
    "titles": { "passed": 0, "failed": 11 },
    "graphics": { "passed": 3, "failed": 4 },
    "forms": { "passed": 0, "failed": 1 },
    "document": { "passed": 3, "failed": 0 },
    "readability": { "passed": 25, "failed": 88 },
    "general": { "passed": 6, "failed": 5 }
  }
}
```

Category keys (all lowercase): `clickables`, `titles`, `lists`,
`graphics`, `forms`, `document`, `readability`, `tables`, `general`,
`media`. `score` is the checker's own "Accessibility Score" percentage, copied as
a plain number (44.61, not "44.61%"); omit it if not shown. The other two
rings (checks passed, WCAG failed count) are computed from the category
counts, never typed. When the checker says "Not Applicable or It May
Require Manual Audit" for a category, leave that category out entirely,
only audited categories appear in the report. The overall ring and every card's
pass/fail wording are computed; you only copy the two counts per category.

### 3i. `onPageSeo` (never typed)

Do not fill this in and do not edit it by hand. The crawl script counts it
from the CSV (missing and duplicate titles, meta descriptions, H1 problems,
thin pages) and rewrites it on every run, hand edits would be overwritten
anyway. If the numbers look wrong, the fix is rerunning the script on the
right CSV, not editing the JSON.

---

## 4. How the automatic parts work (so you can trust them)

**Colours** follow Google's official thresholds. For example LCP: 2.5 or
under is green, up to 4.0 is amber, above is red. You cannot get a colour
wrong because you never choose one.

**Passed/Failed** follows Google's rule: the three Core Web Vitals (LCP,
INP, CLS) that have data must ALL be green. A `null` metric is skipped, not
failed.

**The date** is always the day you generate the PDF. There is no date field.

**The reference number** is AUD + the brand + the current year. It changes
automatically when you change `site`.

---

## 5. The two scripts: filling everything except PageSpeed

Once per audit, after crawling the site, two commands fill chapters 02, 03
and 04 completely:

1. Open Screaming Frog SEO Spider, enter the site URL, press Start, wait
   for the crawl to finish
2. Stay on the **Internal** tab with the filter set to **All**, click
   **Export**, and save the CSV. Prefer a simple path like
   `~/Downloads/vlncy_internal_all.csv`, avoid folders with spaces if you
   can (if the path has spaces, wrap it in quotes below)
3. In the project folder, run:

```
node scripts/csv-to-data.js ~/Downloads/vlncy_internal_all.csv
node scripts/check-ai.js
```

The first reads the crawl CSV: chapter 02's numbers, all of chapter 03,
and the metaRobots check. The second visits the live site: llms.txt,
robots.txt and AI crawler access, sitemap, Schema.org markup, and no-JS
readability. Both print what they found and write it into
`audit-data.json`; the preview updates by itself.

Rerun either any time. They only replace what they measure; a hand-typed
`redirectChains` or `"stale"` sitemap override is kept.

### No terminal? Use the buttons

The purple bar above the PDF preview does the same two jobs without
commands:

- **Drop the crawl CSV** onto the dashed box (or click it to pick the
  file) = the first command
- **Check live site** = the second command; it checks whatever `site` the
  data currently names

One difference matters: the buttons update the PREVIEW for this browser
session only, a refresh loses it. To keep the results, either run the
terminal commands (they write the file directly) or press **Copy JSON**
and paste over the contents of `src/data/audit-data.json`.

---

## 6. Checklist before you call it done

- [ ] Preview shows the cover with the right site name and brand
- [ ] The assessment (Passed/Failed) matches what Google's page says
- [ ] Every metric you typed appears with a colour dot; values match Google's
- [ ] The date on the cover is today
- [ ] No units, quotes, or colour words crept into the numbers
- [ ] Both scripts have been run for THIS site (its own crawl CSV, and
  check-ai against its own domain, not a previous client's)
- [ ] If the buttons were used instead of the terminal, the results were
  saved (Copy JSON pasted into the file), a refresh must not lose them
- [ ] The sitemap value reflects reality (add the "stale" override if you
  know the sitemap lists outdated pages)

---

## 7. The mistakes that break everything

JSON is strict. If the preview goes blank, it is almost always one of these:

**1. Units or text in a number field.** `"lcp": "2.2 s"` breaks the colour
logic; `"lcp": 2.2s` breaks the whole file. Numbers are bare: `2.2`.

**2. A missing or extra comma.** Every line ends with a comma EXCEPT the
last one inside each `{ }` block.

**3. Comments.** JSON does not allow `//` notes anywhere. If you need a
reminder, add it as a fake field instead: `"_note": "rerun after fixes"`,
the system ignores keys it does not know.

**4. Curly quotes from Word or WhatsApp.** Only straight quotes `"` work.
Type them in the editor, do not paste them from chat apps.

**5. Misspelled keys and values.** A typo like `"speedindex"` does not
error, the metric just silently disappears from the PDF. If a row is
missing, check the key's spelling against this guide first. Same for
`device`: anything other than exactly `"mobile"` or `"desktop"` is silently
treated as mobile.

VS Code underlines most of these in red before you even save. The preview's
error message names a line number; go there and check this list.
