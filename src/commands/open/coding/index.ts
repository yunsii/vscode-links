import { getCurrentRepoUrl } from '../../../helpers/git'

import { getCodingRepoLinks } from './helpers'

export async function getCodingRepoResources() {
  // git@e.coding.net:org/project/repoName.git
  // https://e.coding.net/org/project/repoName.git
  const repoUrl = await getCurrentRepoUrl()

  if (!repoUrl) {
    return []
  }

  if (!['git@e.coding.net:', 'https://e.coding.net/'].some((item) => repoUrl.startsWith(item))) {
    return []
  }

  const [repoName, project] = repoUrl.replace('.git', '').split('/').reverse()

  return getCodingRepoLinks(project, repoName)
}
