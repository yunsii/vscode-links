// Display formatter for picker / tree-view rows. Inlined from
// packages/core/src/url.ts because it's only used by the VSIX.

import type { BaseLinkResource } from '@/helpers/native-loader'

export interface ProcessedLinkDisplay {
  label: string
  detail: string
  shortUrl: string
}

export function processLinkDisplay(resource: BaseLinkResource): ProcessedLinkDisplay {
  // Store template variables before URL parsing to avoid encoding
  const templateVarRegex = /\{\{[^}]+\}\}/g
  const templateVars: string[] = []
  const placeholderUrl = resource.url.replace(templateVarRegex, (match) => {
    templateVars.push(match)
    return `__template_var_${templateVars.length - 1}__`
  })

  let shortUrl: string

  try {
    const url = new URL(placeholderUrl)
    shortUrl = `${url.hostname}${url.pathname !== '/' ? url.pathname : ''}${url.search || ''}${url.hash || ''}`
  } catch {
    // hostname-only fallback when the URL contains template variables
    const urlWithoutProtocol = placeholderUrl.replace(/^https?:\/\//, '')
    shortUrl = urlWithoutProtocol
  }

  templateVars.forEach((templateVar, index) => {
    const placeholder = `__template_var_${index}__`
    shortUrl = shortUrl.replace(new RegExp(placeholder, 'g'), templateVar)
  })

  const label = resource.title
  const detail = resource.description ? `${resource.description} • ${shortUrl}` : shortUrl

  return { label, detail, shortUrl }
}
