// scripts/render-pdf.jsx
// Server-side PDF render: reads the CURRENT audit-data.json at run time,
// composes, renders, writes the PDF to the path given as the argument.
// Bundled once by the server (esbuild), then spawned per job.
import React from "react";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { pdf } from "@react-pdf/renderer";
import { composeReport } from "../src/lib/composeReport.js";
import ReportDocument from "../src/pdf/templates/ReportDocument.jsx";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const out = process.argv[2] || path.join(root, "report.pdf");

const data = JSON.parse(fs.readFileSync(path.join(root, "src/data/audit-data.json"), "utf8"));
const doc = composeReport(data);
const buf = await pdf(<ReportDocument data={doc} />).toBuffer();
const chunks = [];
for await (const c of buf) chunks.push(c);
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, Buffer.concat(chunks));
console.log(`PDF written: ${out} (${Buffer.concat(chunks).length} bytes)`);
