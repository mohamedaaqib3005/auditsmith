# PDF Architecture: Atomic Design

The PDF layer follows atomic design. Each layer only imports from the layers
below it. Content comes from JSON; visuals come from tokens.

```
tokens  →  atoms  →  molecules  →  organisms  →  templates
(values)   (primitives) (rows/cards)  (JSON blocks)  (pages)
```

## Layers

**tokens/** - raw design values, no components. `colors.js` (all hex codes),
`typography.js` (font registration + type scale), `spacing.js` (space, radii,
borders, page geometry). Rule: no hex code or magic number outside tokens.

**atoms/** - smallest visual primitives. `Heading` `Body` `Mono` `Label`
(Typography.jsx), `SeverityBadge`, `RatingDot` + `ScoreCircle`
(Indicators.jsx), `TintedBox` + `Card` (Surfaces.jsx). Atoms take props and
tokens; they know nothing about report data shapes.

**molecules/** - one repeatable unit built from atoms. `MetricRow`,
`KeyValueRow`, `ScoreItem`, `FindingCard`. A molecule renders ONE item.

**organisms/** - the JSON-facing blocks. Each maps a `"type"` string from the
report JSON to a rendered section: it loops over `items` and renders
molecules. The `blockMap` registry at the bottom of `organisms/index.jsx` is
the single place a new type gets registered.

**templates/** - full pages. `CoverPage` (the purple cover) and
`ReportDocument` (page shell, header, footer, section loop).

`src/pdf/ReportDocument.jsx` is a one-line shim re-exporting the template so
older imports keep working.

## How to make changes

| Change | Where |
|---|---|
| A colour, font, or spacing value everywhere | tokens/ |
| How a badge/dot/circle looks | atoms/ |
| Layout of one row or card | molecules/ |
| A whole section's structure, or a new JSON type | organisms/ (+ blockMap line) |
| Page frame, header, footer, cover | templates/ |
| The content of a report | src/data/*.json only |

## Adding a new block type, end to end

1. If it needs a new primitive (e.g. a ProgressBar), add the atom
2. If it repeats per item, build the molecule from atoms
3. Build the organism that maps JSON props to molecules
4. Register it: one line in `blockMap`
5. Use `"type": "yourNewType"` in the JSON

## Import rules (keep these or the architecture rots)

- tokens import nothing (except react-pdf's Font for registration)
- atoms import tokens only
- molecules import atoms + tokens
- organisms import molecules + atoms + tokens
- templates import organisms + atoms + tokens
- NOTHING imports from src/data; data arrives as props from the JSON
