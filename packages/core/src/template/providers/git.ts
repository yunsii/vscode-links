import { getCurrentBranch } from '../../git'

import type { TemplateProvider } from './types'

export const gitProvider: TemplateProvider = {
  id: 'git',
  getContext: async (options) => {
    const branch = options.workspacePath ? await tryGetBranch(options.workspacePath) : null

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

async function tryGetBranch(cwd: string): Promise<string | null> {
  try {
    return (await getCurrentBranch(cwd)) ?? null
  } catch {
    return null
  }
}
