import type { JsonObject } from 'type-fest'

import { ensureCnbRepoUrl, parseCnbRepoUrl } from '../../entrypoints/command.open/cnb/helpers'

import type { TemplateProvider } from './types'

export const cnbProvider: TemplateProvider = {
  id: 'cnb',
  match: (repoUrl) => {
    if (!repoUrl) {
      return false
    }
    return ensureCnbRepoUrl(repoUrl)
  },
  getContext: async ({ repoUrl }) => {
    if (!repoUrl) {
      return {} as JsonObject
    }
    try {
      const parsed = parseCnbRepoUrl(repoUrl)
      const groupsJoined = Array.isArray(parsed.groups) ? parsed.groups.join('/') : ''
      return {
        repoSpecific: {
          cnb: {
            repo: parsed.repo,
            groups: groupsJoined,
          },
        },
      }
    } catch (err) {
      return {}
    }
  },
}
