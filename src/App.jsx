// src/App.jsx
// The viewer, now stateful. Data flow:
//   audit-data.json -> useState -> (CSV drop merges into state) ->
//   composeReport(state) -> ReportDocument -> PDF preview.
//
// The JSON file on disk stays the source of truth for commits; a CSV drop
// updates this session's preview, and "Copy JSON" bridges back to the file.

import { useState } from "react";
import { PDFViewer } from "@react-pdf/renderer";
import ReportDocument from "./pdf/ReportDocument";
import { composeReport } from "./lib/composeReport";
import CrawlImport from "./components/CrawlImport";
import rawData from "./data/audit-data.json";

function App() {
  const [data, setData] = useState(rawData);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", margin: 0 }}>
      <CrawlImport data={data} onData={setData} />
      <div style={{ flex: 1 }}>
        <PDFViewer width="100%" height="100%" showToolbar>
          <ReportDocument data={composeReport(data)} />
        </PDFViewer>
      </div>
    </div>
  );
}

export default App;
