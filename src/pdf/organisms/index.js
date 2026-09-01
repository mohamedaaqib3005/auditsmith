// organisms barrel + THE REGISTRY.
// To add a new section type: create the organism file, import it,
// add ONE line to blockMap. Nothing else in the app changes.

import { HeadingBlock } from "./HeadingBlock";
import { ParagraphBlock } from "./ParagraphBlock";
import { KeyValueBlock } from "./KeyValueBlock";
import { MetricsBlock } from "./MetricsBlock";
import { ScorecardBlock } from "./ScorecardBlock";
import { FindingsBlock } from "./FindingsBlock";
import { TableBlock } from "./TableBlock";
import { SectionDividerBlock } from "./SectionDividerBlock";
import { AuditResultsBlock } from "./AuditResultsBlock";

export {
  HeadingBlock,
  ParagraphBlock,
  KeyValueBlock,
  MetricsBlock,
  ScorecardBlock,
  FindingsBlock,
  TableBlock,
  SectionDividerBlock,
  AuditResultsBlock,
};

export const blockMap = {
  heading: HeadingBlock,
  paragraph: ParagraphBlock,
  keyValue: KeyValueBlock,
  metrics: MetricsBlock,
  scorecard: ScorecardBlock,
  findings: FindingsBlock,
  table: TableBlock,
  sectionDivider: SectionDividerBlock,
  auditResults: AuditResultsBlock,
};
