import { expect, it } from 'vitest'

import { getCurrentBranch, getCurrentRepoUrl } from './git'

it('getCurrentRepoUrl', async () => {
  const url = await getCurrentRepoUrl(process.cwd())
  expect(url).toBeDefined()
})

it('getCurrentBranch', async () => {
  const branch = await getCurrentBranch(process.cwd())
  expect(branch).toBeDefined()
})
