import type { JsonObject } from 'type-fest'

import { ensureCodingRepoUrl, parseCodingRepoUrl } from '@/entrypoints/command.open/coding/helpers'

import type { TemplateProvider } from './types'

export const codingProvider: TemplateProvider = {
  id: 'coding',
  match: (repoUrl) => {
    if (!repoUrl) {
      return false
    }
    return ensureCodingRepoUrl(repoUrl)
  },
  getContext: async (options) => {
    const { repoUrl } = options

    if (!repoUrl) {
      return {} as JsonObject
    }

    try {
      const { repo, project, team } = parseCodingRepoUrl(repoUrl)
      return {
        repoSpecific: {
          coding: {
            team,
            project,
            repo,
          },
        },
      } as JsonObject
    } catch (err) {
      return {} as JsonObject
    }
  },
}
