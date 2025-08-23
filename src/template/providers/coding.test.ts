import { describe, expect, it } from 'vitest'

import { codingProvider } from './coding'

describe('codingProvider', () => {
  it('parses coding https url into repoSpecific.coding', async () => {
    const repoUrl = 'https://e.coding.net/team/project/repo.git'
    const ctx = await codingProvider.getContext({ repoUrl })
    expect(ctx).toHaveProperty('repoSpecific')
    // eslint-disable-next-line ts/ban-ts-comment
    // @ts-expect-error
    expect(ctx.repoSpecific.coding).toEqual({ team: 'team', project: 'project', repo: 'repo' })
  })
})
