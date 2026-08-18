// src/data/sampleData.js
// Hardcoded JSON. The whole PDF is generated from this object.
// Edit anything here, save, and the PDFViewer updates live.

export const sampleData = {
  meta: {
    title: "Technical Audit Report",
    subtitle: "eventsfirstgroup.com",
    date: "18 August 2026",
    reference: "AUD-2026-001",
  },
  sections: [
    {
      type: "heading",
      text: "Executive Summary",
    },
    {
      type: "paragraph",
      text: "This report presents the results of a technical audit conducted across the site's infrastructure, performance and security posture. Findings are prioritised by severity, with recommendations for remediation.",
    },
    {
      type: "keyValue",
      items: [
        { label: "Audit Date", value: "12 to 16 August 2026" },
        { label: "Scope", value: "Public website, DNS, TLS configuration" },
        { label: "Method", value: "Automated crawl + manual verification" },
        { label: "Auditor", value: "Founder's Office, EFG" },
      ],
    },
    {
      type: "heading",
      text: "Summary of Findings",
    },
    {
      type: "table",
      columns: ["ID", "Finding", "Severity", "Status"],
      rows: [
        ["F-001", "Missing HTTPS redirect on legacy subdomain", "High", "Open"],
        ["F-002", "Images served without compression", "Medium", "Open"],
        ["F-003", "Sitemap contains 404 URLs", "Medium", "Open"],
        ["F-004", "Missing alt text on 34 images", "Low", "Open"],
      ],
    },
    {
      type: "heading",
      text: "Next Steps",
    },
    {
      type: "paragraph",
      text: "Findings F-001 should be remediated within 7 days. Medium severity items are recommended within 30 days. A follow-up verification audit is proposed after remediation.",
    },
  ],
};
