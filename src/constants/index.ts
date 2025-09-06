import type { LinkResourceType } from '../helpers/schemas'

export const CATEGORY_LABELS: Record<LinkResourceType, string> = {
  'local': 'Local Links',
  'detected': 'Auto-detected Links',
  'remote-project': 'Remote Project Links',
  'remote-shared': 'Remote Shared Links',
}

export const CATEGORY_MESSAGES: Record<LinkResourceType, string> = {
  'local': 'No local links configured. Add links in settings.',
  'detected': 'No auto-detected links available.',
  'remote-project': 'No remote project links found.',
  'remote-shared': 'No remote shared links available.',
}
