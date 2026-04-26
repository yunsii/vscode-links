import type { ResolveResult } from '@vscode-links/core'

export type OutputFormat = 'json' | 'ndjson' | 'tsv'

/**
 * Render a ResolveResult to a string in one of the supported formats.
 *
 * - json:   pretty-printed object, one shot.
 * - ndjson: one JSON object per line, prefixed by kind:
 *           {"kind":"context",...}
 *           {"kind":"link","data":{...}}
 *           {"kind":"skipped","data":{...}}
 *           {"kind":"diagnostic","data":{...}}
 *   Easier for downstream pickers to ingest with minimal buffering.
 * - tsv:    tab-separated link rows for shell pipelines:
 *           type<TAB>source<TAB>url<TAB>title
 *           Skipped/diagnostic rows are NOT included; use ndjson for those.
 */
export function format(result: ResolveResult, mode: OutputFormat): string {
  switch (mode) {
    case 'json':
      return `${JSON.stringify(result, null, 2)}\n`
    case 'ndjson':
      return formatNdjson(result)
    case 'tsv':
      return formatTsv(result)
    default: {
      const exhaustive: never = mode
      throw new Error(`unknown format: ${exhaustive as string}`)
    }
  }
}

function formatNdjson(result: ResolveResult): string {
  const lines: string[] = []
  lines.push(JSON.stringify({ kind: 'context', data: result.context }))
  for (const link of result.links) {
    lines.push(JSON.stringify({ kind: 'link', data: link }))
  }
  for (const skipped of result.skipped) {
    lines.push(JSON.stringify({ kind: 'skipped', data: skipped }))
  }
  for (const diag of result.diagnostics) {
    lines.push(JSON.stringify({ kind: 'diagnostic', data: diag }))
  }
  return `${lines.join('\n')}\n`
}

function formatTsv(result: ResolveResult): string {
  const rows: string[] = []
  for (const link of result.links) {
    rows.push([
      link.type,
      link.source,
      link.url,
      link.title,
    ].map(escapeTsvField).join('\t'))
  }
  return rows.length === 0 ? '' : `${rows.join('\n')}\n`
}

// TSV cells must not contain tab or newline; replace defensively.
function escapeTsvField(s: string): string {
  return s.replace(/\t/g, ' ').replace(/\r?\n/g, ' ')
}
