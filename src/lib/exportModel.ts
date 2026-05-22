// A renderer-agnostic document model. Each tool turns its saved state into
// an ExportDocument; the backend renders that to a PDF with one code path.

export type ExportBlock =
  | { type: 'heading'; text: string }
  | { type: 'subheading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'keyvalue'; items: { label: string; value: string }[] }
  | {
      type: 'score'
      label: string
      value: number
      max: number
      band?: string
      detail?: string
    }
  | {
      type: 'grid'
      caption?: string
      columns: string[]
      rows: {
        label: string
        cells: { label: string; color: string; text?: string }[]
      }[]
    }
  | { type: 'list'; ordered?: boolean; items: string[] }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'spacer' }

export interface ExportDocument {
  toolId: string
  toolName: string
  title: string
  blocks: ExportBlock[]
}
