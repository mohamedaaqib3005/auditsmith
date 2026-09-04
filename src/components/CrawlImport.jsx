// src/components/CrawlImport.jsx
// The Screaming Frog drop zone. Drop (or pick) an "Internal All" CSV export;
// it is parsed in the browser, the section numbers are derived, and the
// report preview updates immediately. Nothing is uploaded anywhere: the file
// never leaves this machine.
//
// NOTE: the browser cannot write to src/data/audit-data.json on disk. A drop
// updates the PREVIEW for this session; the "Copy JSON" button puts the
// updated data on the clipboard so it can be pasted into audit-data.json to
// make it permanent (or keep using scripts/csv-to-data.js, same logic).

import { useState } from "react";
import Papa from "papaparse";
import { deriveFromCrawl, mergeCrawl } from "../lib/deriveFromCrawl";
import { applySiteCheck } from "../lib/checkSite";
import { colors } from "../pdf/tokens/colors";

const ui = {
  bar: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 16px",
    background: colors.primary,
    color: colors.onPrimary,
    fontFamily: "system-ui, sans-serif",
    fontSize: 13,
  },
  drop: (active) => ({
    border: `2px dashed ${active ? colors.onPrimary : colors.onPrimaryFaint}`,
    borderRadius: 6,
    padding: "8px 14px",
    cursor: "pointer",
    background: active ? colors.onPrimaryBorder : "transparent",
    color: active ? colors.onPrimary : colors.onPrimaryMuted,
  }),
  status: { flex: 1, color: colors.onPrimaryMuted },
  error: { flex: 1, color: colors.onPrimaryDanger },
  button: {
    border: `1px solid ${colors.onPrimaryFaint}`,
    borderRadius: 6,
    padding: "8px 14px",
    background: "transparent",
    color: colors.onPrimary,
    cursor: "pointer",
    fontSize: 13,
  },
};

const CrawlImport = ({ data, onData }) => {
  const [dragOver, setDragOver] = useState(false);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const [checking, setChecking] = useState(false);

  // "Check live site": ask the dev server to fetch the site's facts
  // (llms.txt, robots.txt, sitemap, homepage) and merge them into the preview.
  const checkLiveSite = async () => {
    if (!data.site) {
      setError("No site in the data to check.");
      return;
    }
    setError(null);
    setChecking(true);
    setStatus(`Checking ${data.site}...`);
    try {
      const res = await fetch(`/api/check-site?site=${encodeURIComponent(data.site)}`);
      if (!res.ok) throw new Error(`server said ${res.status}`);
      const result = await res.json();
      if (result.error) throw new Error(result.error);
      onData(applySiteCheck(data, result));
      const facts = [...Object.values(result.aiReadiness), ...Object.values(result.technicalSeo)];
      const written = facts.filter((f) => f.value).length;
      setStatus(`${result.origin}: ${written} of ${facts.length} checks written. Sections 02 and 04 updated.`);
    } catch (e) {
      setStatus(null);
      setError(`Live check failed: ${e.message}`);
    } finally {
      setChecking(false);
    }
  };

  const handleFile = (file) => {
    if (!file) return;
    if (!/\.csv$/i.test(file.name)) {
      setStatus(null);
      setError(`"${file.name}" is not a .csv file. Export "Internal All" from Screaming Frog as CSV.`);
      return;
    }
    setError(null);
    setStatus(`Reading ${file.name}...`);

    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        const derived = deriveFromCrawl(results.data);
        if (!derived.ok) {
          setStatus(null);
          setError(derived.error);
          return;
        }
        onData(mergeCrawl(data, derived));
        const t = derived.technicalSeo;
        setStatus(
          `${file.name}: ${derived.info.htmlPages} pages, ` +
            `${t.indexable ?? "?"} indexable, ${t.brokenLinks ?? 0} broken. ` +
            `Sections 02 and 03 updated.` +
            (derived.info.skippedCols.length
              ? ` (columns missing: ${derived.info.skippedCols.join(", ")})`
              : "")
        );
      },
      error: (err) => {
        setStatus(null);
        setError(`Could not parse CSV: ${err.message}`);
      },
    });
  };

  const copyJson = () => {
    navigator.clipboard
      .writeText(JSON.stringify(data, null, 2))
      .then(() => setStatus("Data copied. Paste into src/data/audit-data.json to keep it."))
      .catch(() => setError("Clipboard blocked by the browser."));
  };

  return (
    <div style={ui.bar}>
      <strong>Auditsmith</strong>

      <label
        style={ui.drop(dragOver)}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFile(e.dataTransfer.files[0]);
        }}
      >
        Drop Screaming Frog CSV here, or click to choose
        <input
          type="file"
          accept=".csv,text/csv"
          style={{ display: "none" }}
          onChange={(e) => {
            handleFile(e.target.files[0]);
            e.target.value = ""; // allow re-dropping the same file
          }}
        />
      </label>

      {error ? (
        <span style={ui.error}>{error}</span>
      ) : (
        <span style={ui.status}>
          {status || "Preview updates on drop. Nothing is uploaded."}
        </span>
      )}

      <button style={ui.button} onClick={checkLiveSite} disabled={checking}>
        {checking ? "Checking..." : "Check live site"}
      </button>

      <button style={ui.button} onClick={copyJson}>
        Copy JSON
      </button>
    </div>
  );
};

export default CrawlImport;
