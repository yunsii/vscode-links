import { describe, expect, it } from 'vitest'

import { githubProvider } from './github'

describe('githubProvider', () => {
  it('parses github ssh url into repoSpecific.github', async () => {
    const repoUrl = 'git@github.com:owner/repo.git'
    const ctx = await githubProvider.getContext({ repoUrl })
    expect(ctx).toHaveProperty('repoSpecific')
    // eslint-disable-next-line ts/ban-ts-comment
    // @ts-expect-error
    expect(ctx.repoSpecific.github).toEqual({ owner: 'owner', repo: 'repo' })
  })
})
