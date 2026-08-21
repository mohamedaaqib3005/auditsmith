# Adding PageSpeed Insights Data to the Report

This guide shows you how to take results from Google PageSpeed Insights and add them to the report JSON, step by step. No coding knowledge needed. If you can copy, paste, and edit text carefully, you can do this.

---

## 1. What you are editing

The report is generated from one file:

```
src/data/fullAuditData.json
```

Open it in any text editor (VS Code recommended). The PDF is built from this file from top to bottom. Whatever order things appear in the file is the order they appear in the PDF.

**Golden rule: this file is data only.** You never change colours, fonts, or layout here. You only add and edit content.

---

## 2. Run the PageSpeed test

1. Go to https://pagespeed.web.dev
2. Enter the website URL and click Analyse
3. Wait for results. Note that there are two tabs: **Mobile** and **Desktop**. Mobile is the default and usually the one we report
4. Keep this results page open. Every number you need comes from it

---

## 3. Understand the shape of the PageSpeed section

Inside the JSON there is a list called `"sections"`. The PageSpeed part of the report is a run of entries in that list, in this order:

| Order | Block type | What it shows in the PDF |
|-------|-----------------|--------------------------------------------|
| 1 | `sectionDivider` | The "01 PageSpeed Insights" chapter opener |
| 2 | `heading` | "Core Web Vitals Assessment" |
| 3 | `paragraph` | One line saying whether the site passed |
| 4 | `metrics` | Field data (real user) metric rows |
| 5 | `heading` | "Lighthouse Category Scores" |
| 6 | `scorecard` | The coloured score circles |
| 7 | `heading` | "Lab Metrics (Lighthouse)" |
| 8 | `metrics` | Lab test metric rows |
| 9 | `heading` | "Performance Findings" |
| 10 | `findings` | One card per issue found |
| 11 | `heading` | "Test Conditions" |
| 12 | `keyValue` | Tool, device, network details |

Every block is a chunk wrapped in curly braces `{ }`, separated from the next by a comma. To update the report you edit the values inside these blocks. To add a new issue you copy an existing block of the same type and change its text.

---

## 4. Where each number comes from

### 4a. Field data (the `metrics` block titled "Field Data (Real Users)")

On the PageSpeed results page, the top panel is called **"Discover what your real users are experiencing"**. It shows LCP, INP, CLS, and below them FCP and TTFB.

For each metric, copy the value shown and pick a rating based on the colour Google shows:

- Green circle = `"good"`
- Amber/orange square = `"needs-improvement"`
- Red triangle = `"poor"`
- Grey or no data = `"na"`

Example entry:

```json
{ "label": "Largest Contentful Paint (LCP)", "value": "2.2 s", "rating": "good" }
```

The rating word must be typed exactly as shown above, in lowercase, with the hyphen in `needs-improvement`. Anything else shows as grey.

If the site is new and Google says there is not enough real user data, delete this metrics block and its heading, or keep only the metrics that show values.

### 4b. Category scores (the `scorecard` block)

On the results page, the row of circled numbers: Performance, Accessibility, Best Practices, SEO. Copy each number:

```json
{ "label": "Performance", "score": 79, "max": 100 }
```

Note: `score` has no quotes around the number. The circle colour is automatic: 0 to 49 red, 50 to 89 amber, 90 to 100 green.

Special case: if a category shows something like "2/2" instead of a score out of 100, write it like this:

```json
{ "label": "Agentic Browsing", "score": 2, "max": 2, "display": "2/2" }
```

### 4c. Lab metrics (the `metrics` block titled "Single Page Session, Initial Load")

Scroll to the **Metrics** area under the Performance score: First Contentful Paint, Largest Contentful Paint, Total Blocking Time, Cumulative Layout Shift, Speed Index. Same format and same rating colours as field data.

### 4d. Findings (the `findings` block)

This is the main work. On the results page, findings live in two lists: **Insights** and **Diagnostics**. Also check the Accessibility, Best Practices, and SEO sections lower down for their flagged items.

Each issue becomes one card in this format:

```json
{
  "id": "PSI-014",
  "title": "Short name of the problem",
  "severity": "medium",
  "category": "Performance",
  "impact": "Est savings of 1,200 ms",
  "recommendation": "One or two sentences on how to fix it."
}
```

Field by field:

- **id**: continue the numbering from the last card in the file. If the last one is PSI-013, yours is PSI-014. Never repeat an id
- **title**: the issue name as PageSpeed shows it, shortened if long
- **severity**: pick from `"critical"`, `"high"`, `"medium"`, `"low"`, `"info"` (lowercase, in quotes). Guide: red triangle in PageSpeed = high, orange square = medium, grey circle = low
- **category**: which part of the audit it belongs to, e.g. `"Performance"`, `"Accessibility"`, `"SEO"`, `"Best Practices"`
- **impact**: the savings estimate PageSpeed shows ("Est savings of 3,097 KiB") or a one-line consequence
- **recommendation**: how to fix it, in plain language. PageSpeed often explains this when you expand the row with the arrow on the right

To add a new finding: copy an entire existing card from `{` to `}`, paste it after the last card, add a comma between them, then edit every field.

### 4e. Test conditions (the `keyValue` block)

At the bottom of the PageSpeed metrics panel there is small text like "Emulated Moto G Power with Lighthouse 13.4.1, Slow 4G throttling". Update the values to match your run, and update the date.

---

## 5. Worked example: adding one new finding

Say the new report shows "Reduce third-party code, Est savings of 800 ms" with an orange square.

1. Open `src/data/fullAuditData.json`
2. Find the `"findings"` block and scroll to its last card
3. Put your cursor after that card's closing `}` and type a comma
4. Paste a copy of any card and edit it to:

```json
{
  "id": "PSI-014",
  "title": "Reduce third-party code",
  "severity": "medium",
  "category": "Performance",
  "impact": "Est savings of 800 ms",
  "recommendation": "Load third-party scripts after the page becomes interactive, or remove unused ones."
}
```

5. Save the file. The PDF preview updates by itself

---

## 6. The three mistakes that break everything

JSON is strict. Nearly every "the page went blank" moment is one of these:

**1. A missing or extra comma.** Every block and every field is separated by a comma, except the last one in a list. Wrong: a comma after the final card before `]`. Also wrong: no comma between two cards.

**2. Missing quotes.** All text values need double quotes on both sides: `"severity": "high"`. Numbers do not: `"score": 79`.

**3. Curly quotes.** If you paste text from Word or WhatsApp you can get “smart quotes” instead of straight ones `"`. JSON only accepts straight quotes. Type them in the editor, do not paste them from chat apps.

If the preview goes blank after a save, the error message on screen usually names the line number. Go there and check for these three things. VS Code also underlines JSON errors in red before you even save.

---

## 7. Checklist before you call it done

- [ ] Preview shows all sections with no blank page
- [ ] Every metric has a rating word and the dots show green, amber, or red (grey means the rating word is mistyped)
- [ ] Every finding has a coloured severity badge (grey badge means the severity word is mistyped)
- [ ] Finding ids are unique and sequential
- [ ] Date and test conditions match the actual test run
- [ ] The scorecard numbers match the PageSpeed circles exactly

---

## 8. Quick reference: allowed values

| Field | Allowed values |
|-------------|------------------------------------------------------------|
| `rating` | `good`, `needs-improvement`, `poor`, `na` |
| `severity` | `critical`, `high`, `medium`, `low`, `info` |
| `type` | `sectionDivider`, `heading`, `paragraph`, `metrics`, `scorecard`, `findings`, `table`, `keyValue` |

All lowercase, all in double quotes, hyphen only in `needs-improvement` and capital letters only in `sectionDivider` and `keyValue`.
