import type { BaseLinkResource } from './schemas'

export interface ProcessedLinkDisplay {
  label: string
  detail: string
  shortUrl: string
}

export function processLinkDisplay(resource: BaseLinkResource): ProcessedLinkDisplay {
  const url = new URL(resource.url)
  const shortUrl = `${url.hostname}${url.pathname !== '/' ? url.pathname : ''}${url.search || ''}${url.hash || ''}`

  const label = resource.title
  const detail = resource.description ? `${resource.description} • ${shortUrl}` : shortUrl

  return {
    label,
    detail,
    shortUrl,
  }
}
