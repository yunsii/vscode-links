import { getCurrentBranch } from '../../git'

import type { TemplateProvider } from './types'

export const gitProvider: TemplateProvider = {
  id: 'git',
  getContext: async (options) => {
    const branch = options.workspacePath ? await getCurrentBranch(options.workspacePath) : null

    return {
      repo: {
        url: options.repoUrl ?? null,
      },
      git: {
        branch,
      },
      workspace: {
        fileRelativePath: options.fileRelativePath ?? null,
      },
    }
  },
}
