import { getCurrentBranch, getCurrentRepoUrl } from '@/helpers/git'
import { getCurrentFileRelativePath, getCurrentWorkspace } from '@/helpers/workspaces'

import type { TemplateProvider } from './types'

export const gitProvider: TemplateProvider = {
  id: 'git',
  getContext: async () => {
    const workspace = await getCurrentWorkspace()
    const repoUrl = await getCurrentRepoUrl(workspace)
    const branch = await getCurrentBranch(workspace)
    const filePath = await getCurrentFileRelativePath()

    return {
      repo: {
        url: repoUrl,
      },
      git: {
        branch,
      },
      workspace: {
        fileRelativePath: filePath,
      },
    }
  },
}
