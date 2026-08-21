// src/pdf/blocks/index.js
// THE registry. To add a new section type:
// 1. Create the block component in this folder
// 2. Import it here and add one line to blockMap

import {
  HeadingBlock,
  ParagraphBlock,
  KeyValueBlock,
  TableBlock,
} from "./BasicBlocks";
import FindingsBlock from "./FindingsBlock";
import MetricsBlock from "./MetricsBlock";
import ScorecardBlock from "./ScorecardBlock";
import SectionDividerBlock from "./SectionDividerBlock";

export const blockMap = {
  heading: HeadingBlock,
  paragraph: ParagraphBlock,
  keyValue: KeyValueBlock,
  table: TableBlock,
  findings: FindingsBlock,
  metrics: MetricsBlock,
  scorecard: ScorecardBlock,
  sectionDivider: SectionDividerBlock,
};
