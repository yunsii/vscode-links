import { describe, expect, it } from 'vitest'

import { cnbProvider } from './cnb'

describe('cnbProvider', () => {
  it('parses cnb repo url into repoSpecific.cnb', async () => {
    const repoUrl = 'https://cnb.cool/group/subgroup/repo.git'
    const ctx = await cnbProvider.getContext({ repoUrl })
    expect(ctx).toHaveProperty('repoSpecific')
    expect(ctx.repoSpecific).toHaveProperty('cnb')
    // eslint-disable-next-line ts/ban-ts-comment
    // @ts-expect-error
    expect(ctx.repoSpecific.cnb).toEqual({ repo: 'repo', groups: 'group/subgroup' })
  })
})
