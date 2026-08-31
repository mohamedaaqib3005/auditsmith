// src/App.jsx
// The viewer. Data flows: raw data -> composeReport -> ReportDocument -> PDF.
// composeReport passes document-JSON (anything with "sections") straight
// through, so all three data sources below work with the same line:
//
//   import rawData from "./data/audit-data.json";      // raw data (composed)
//   import rawData from "./data/fullAuditData.json";   // document JSON (as-is)
//   import rawData from "./data/gallery.json";         // the design-system gallery

import { PDFViewer } from "@react-pdf/renderer";
import ReportDocument from "./pdf/ReportDocument";
import { composeReport } from "./lib/composeReport";
import rawData from "./data/audit-data.json";

function App() {
  const data = composeReport(rawData);

  return (
    <div style={{ width: "100vw", height: "100vh", margin: 0 }}>
      <PDFViewer width="100%" height="100%" showToolbar>
        <ReportDocument data={data} />
      </PDFViewer>
    </div>
  );
}

export default App;
