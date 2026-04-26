export async function getCurrentRepoUrl(cwd: string) {
  const { default: simpleGit } = await import('simple-git')
  const git = simpleGit({ baseDir: cwd })
  const url = (await git.getConfig('remote.origin.url')).value
  return url
}

export async function getCurrentBranch(cwd: string) {
  const { default: simpleGit } = await import('simple-git')
  const git = simpleGit({ baseDir: cwd })
  const branchSummary = await git.branch()
  return branchSummary.current
}
