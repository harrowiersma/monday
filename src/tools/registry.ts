// Central catalogue of every tool. The sidebar and home page iterate this.
export interface ToolDef {
  id: string
  path: string
  name: string
  icon: string
  chapter: string
  summary: string
  group: string
}

export const TOOL_GROUPS = [
  'Diagnostics',
  'Assessments',
  'Templates',
  'Tracking',
  'Chapter Worksheets',
] as const

export const tools: ToolDef[] = [
  {
    id: 'heat-map',
    path: '/tools/heat-map',
    name: 'Fragmentation Heat Map',
    icon: '▦',
    chapter: 'Chapter 1',
    summary:
      'Map governance functions against data domains and score the coordination cost of your silos.',
    group: 'Diagnostics',
  },
  {
    id: 'context-audit',
    path: '/tools/context-audit',
    name: 'Governance Context Audit',
    icon: '◎',
    chapter: 'Chapter 4',
    summary:
      'Run each core business entity through the six GCF layers and surface your foundation gaps.',
    group: 'Diagnostics',
  },
  {
    id: 'maturity',
    path: '/tools/maturity',
    name: 'GCF Maturity Assessment',
    icon: '▲',
    chapter: 'Appendix B',
    summary:
      'Score the six layers 1–5 for a 6–30 maturity total, with a quarterly trend line.',
    group: 'Assessments',
  },
  {
    id: 'migration-readiness-scorecard',
    path: '/tools/scorecard/migration-readiness-scorecard',
    name: 'Migration Readiness Scorecard',
    icon: '⇄',
    chapter: 'Chapter 11',
    summary:
      'Score eight migration-readiness criteria before any RFP or cutover.',
    group: 'Assessments',
  },
  {
    id: 'ai-governance-readiness-scorecard',
    path: '/tools/scorecard/ai-governance-readiness-scorecard',
    name: 'AI Governance Readiness Scorecard',
    icon: '◇',
    chapter: 'Chapter 12',
    summary:
      'Score eight AI-governance criteria before deploying any model to production.',
    group: 'Assessments',
  },
  {
    id: 'ma-readiness-scorecard',
    path: '/tools/scorecard/ma-readiness-scorecard',
    name: 'M&A Readiness Scorecard',
    icon: '⊕',
    chapter: 'Chapter 13',
    summary:
      'Score eight M&A data-governance criteria before signing a deal or announcing a restructure.',
    group: 'Assessments',
  },
  {
    id: 'entity-definition-card',
    path: '/tools/template/entity-definition-card',
    name: 'Entity Definition Card',
    icon: '▢',
    chapter: 'Appendix A',
    summary:
      'The minimum unit of explicit context — one definition card per core business entity.',
    group: 'Templates',
  },
  {
    id: 'context-aware-decision-template',
    path: '/tools/template/context-aware-decision-template',
    name: 'Context-Aware Decision Template',
    icon: '◔',
    chapter: 'Appendix F',
    summary:
      'Structure a governance decision against the six layers, with visible and missing context.',
    group: 'Templates',
  },
  {
    id: 'decision-velocity-baseline',
    path: '/tools/template/decision-velocity-baseline',
    name: 'Decision Velocity Baseline',
    icon: '◷',
    chapter: 'Appendix F',
    summary:
      'Track ten recent governance decisions and calculate your baseline decision speed.',
    group: 'Templates',
  },
  {
    id: 'phases',
    path: '/tools/phases',
    name: 'Five-Phase Progress Tracker',
    icon: '⛢',
    chapter: 'Chapter 15',
    summary:
      'Work the five-phase implementation roadmap; each completed phase unlocks the next.',
    group: 'Tracking',
  },
  {
    id: 'ch2-map-context-sources',
    path: '/tools/worksheet/ch2-map-context-sources',
    name: 'Map Your Current Context Sources',
    icon: '✎',
    chapter: 'Chapter 2',
    summary:
      'For one critical dataset, locate where each kind of context lives — and how disconnected it is.',
    group: 'Chapter Worksheets',
  },
  {
    id: 'ch3-readiness-for-integration',
    path: '/tools/worksheet/ch3-readiness-for-integration',
    name: 'Assess Your Readiness for Integration',
    icon: '✎',
    chapter: 'Chapter 3',
    summary:
      'Answer the readiness questions — the more fragmentation you see, the more you have to gain.',
    group: 'Chapter Worksheets',
  },
  {
    id: 'ch5-design-governance-interfaces',
    path: '/tools/worksheet/ch5-design-governance-interfaces',
    name: 'Designing Your Governance Interfaces',
    icon: '✎',
    chapter: 'Chapter 5',
    summary:
      'Audit how people and systems actually reach governance answers today.',
    group: 'Chapter Worksheets',
  },
  {
    id: 'ch6-design-feedback-loops',
    path: '/tools/worksheet/ch6-design-feedback-loops',
    name: 'Design Your Feedback Loops',
    icon: '✎',
    chapter: 'Chapter 6',
    summary:
      'Assess the four sources of intelligence that keep a foundation alive.',
    group: 'Chapter Worksheets',
  },
  {
    id: 'ch7-integration-checklist',
    path: '/tools/worksheet/ch7-integration-checklist',
    name: 'The Integration Checklist',
    icon: '✎',
    chapter: 'Chapter 7',
    summary:
      'Six questions on the path to a unified ISO 38505 / DAMA / GCF operating model.',
    group: 'Chapter Worksheets',
  },
  {
    id: 'ch8-quality-context-mapping',
    path: '/tools/worksheet/ch8-quality-context-mapping',
    name: 'Quality Context Mapping',
    icon: '✎',
    chapter: 'Chapter 8',
    summary:
      'The immediate actions that shift data quality from technical correctness to business relevance.',
    group: 'Chapter Worksheets',
  },
  {
    id: 'ch9-master-data-integration-roadmap',
    path: '/tools/worksheet/ch9-master-data-integration-roadmap',
    name: 'Master Data Integration Roadmap',
    icon: '✎',
    chapter: 'Chapter 9',
    summary:
      'The immediate actions that move MDM from isolation to integration.',
    group: 'Chapter Worksheets',
  },
  {
    id: 'ch10-regulation-to-data-impact-map',
    path: '/tools/worksheet/ch10-regulation-to-data-impact-map',
    name: 'Regulation-to-Data Impact Map',
    icon: '✎',
    chapter: 'Chapter 10',
    summary:
      'The immediate actions that shift compliance from reactive control to proactive governance.',
    group: 'Chapter Worksheets',
  },
]

export function toolById(id: string): ToolDef | undefined {
  return tools.find((t) => t.id === id)
}
