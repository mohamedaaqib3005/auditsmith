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
    "sitemap": "ok",
    "robotsTxt": "ok",
    "redirectChains": 0
  }
}
```

You may also see `onPageSeo` and extra `technicalSeo` numbers
(`pagesCrawled`, `indexable`, `brokenLinks`, `https`) in the file. Those are
written by the crawl script (section 7 below), you never type them.

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
| `technicalSeo` (3 fields) | You type only `sitemap`, `robotsTxt`, `redirectChains`. The crawl numbers come from the script (section 7) and together they build the "02 Technical SEO" chapter |
| (the crawl script) | `onPageSeo` counts and the "03 On-Page SEO" chapter, entirely automatic |
| `aiReadiness` (5 fields) | The "04 AI Readiness" chapter, five one-word checks you verify in a browser |
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

### 3f. `technicalSeo` (three small fields, the rest is automatic)

Most of this chapter's numbers come from the crawl script (section 7). You
type only three things the crawl cannot know:

| Field | Allowed values | How to check |
|---|---|---|
| `sitemap` | `"ok"`, `"stale"`, `"missing"` | Open `https://the-site.com/sitemap.xml` in a browser. Loads with current URLs = ok. Loads but lists old/removed pages = stale. Error page = missing |
| `robotsTxt` | `"ok"`, `"missing"` | Open `https://the-site.com/robots.txt`. Loads = ok. Error = missing |
| `redirectChains` | a number | In Screaming Frog: Reports menu, Redirect Chains. The number of chains it lists, `0` if none |

Lowercase, in quotes (the number without quotes). A misspelled value shows
as "Unknown" in the report table, visibly, so you can catch it.

### 3g. `aiReadiness` (five one-word checks, about five minutes)

Whether AI systems (ChatGPT, Claude, Perplexity, Google AI) can read the
site. Each field takes `"ok"`, `"partial"`, or `"missing"` (lowercase, in
quotes; `llmsTxt` has no partial):

```json
"aiReadiness": {
  "llmsTxt": "missing",
  "aiCrawlers": "ok",
  "structuredData": "missing",
  "metaRobots": "ok",
  "contentAccess": "ok"
}
```

| Field | How to check |
|---|---|
| `llmsTxt` | Open `https://the-site.com/llms.txt`. A text file loads = ok. Error page = missing |
| `aiCrawlers` | Open `https://the-site.com/robots.txt`. Search for GPTBot, ClaudeBot, PerplexityBot, Google-Extended. None blocked = ok. Some blocked = partial. All or everything blocked = missing |
| `structuredData` | Paste the site URL into Google's Rich Results Test (search.google.com/test/rich-results). Markup detected = ok. Only on some pages = partial. None = missing |
| `metaRobots` | In the Screaming Frog crawl, check the "Meta Robots 1" column. No noindex on real pages = ok. A few accidental ones = partial. Key pages blocked = missing |
| `contentAccess` | In Chrome DevTools press Ctrl+Shift+P, type "Disable JavaScript", reload the site. Content still visible = ok. Some missing = partial. Blank page = missing |

Delete any field you did not check; its row simply will not appear.

### 3h. `onPageSeo` (never typed)

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

## 5. The crawl script: filling sections 02 and 03 automatically

Once per audit, after crawling the site:

1. Open Screaming Frog SEO Spider, enter the site URL, press Start, wait
   for the crawl to finish
2. Stay on the **Internal** tab with the filter set to **All**, click
   **Export**, and save the CSV. Prefer a simple path like
   `~/Downloads/vlncy_internal_all.csv`, avoid folders with spaces if you
   can (if the path has spaces, wrap it in quotes below)
3. In the project folder, run:

```
node scripts/csv-to-data.js ~/Downloads/vlncy_internal_all.csv
```

The script prints what it found and writes it into `audit-data.json`. The
preview updates by itself, chapters 02 and 03 now show the crawled truth.
It also reminds you which of the three hand-typed fields from 3f are still
empty.

Rerun it any time, after a fresh crawl for example. It only replaces the
numbers it derives; your three hand-typed fields are kept.

---

## 6. Checklist before you call it done

- [ ] Preview shows the cover with the right site name and brand
- [ ] The assessment (Passed/Failed) matches what Google's page says
- [ ] Every metric you typed appears with a colour dot; values match Google's
- [ ] The date on the cover is today
- [ ] No units, quotes, or colour words crept into the numbers
- [ ] The crawl script has been run against this site's own CSV (chapters 02
  and 03 show its numbers, not a previous site's)
- [ ] The three hand-typed technicalSeo fields are set and match reality

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
