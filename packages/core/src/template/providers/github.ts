import type { JsonObject } from 'type-fest'

import { ensureGitHubRepoUrl, parseGitHubRepoUrl } from '../../providers/github'

import type { TemplateProvider } from './types'

export const githubProvider: TemplateProvider = {
  id: 'github',
  match: (repoUrl) => {
    if (!repoUrl) {
      return false
    }
    return ensureGitHubRepoUrl(repoUrl)
  },
  getContext: async (options) => {
    const { repoUrl } = options

    if (!repoUrl) {
      return {} as JsonObject
    }

    try {
      const { repo, owner } = parseGitHubRepoUrl(repoUrl)
      return {
        repoSpecific: {
          github: {
            owner,
            repo,
          },
        },
      }
    } catch (err) {
      return {}
    }
  },
}
