// src/App.jsx
// Replaces the Vite demo. Hardcoded JSON + live PDFViewer.
// Edit src/data/sampleData.js, save, and watch the PDF update.

import { PDFViewer } from "@react-pdf/renderer";
import ReportDocument from "./pdf/ReportDocument";
// import { sampleData } from "./data/sampleData";


import sampleData from "./data/fullAuditData.json";

function App() {
  return (
    <div style={{ width: "100vw", height: "100vh", margin: 0 }}>
      <PDFViewer width="100%" height="100%" showToolbar>
        <ReportDocument data={sampleData} />
      </PDFViewer>
    </div>
  );
}

export default App;
