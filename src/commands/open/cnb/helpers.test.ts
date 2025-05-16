import { describe, expect, it } from 'vitest'

import { parseCnbRepoUrl } from './helpers'

describe('parseCnbRepoUrl', () => {
  [
    {
      name: 'HTTPS repo url',
      input: 'https://cnb.cool/group/repo.git',
      output: {
        repo: 'repo',
        groups: ['group'],
      },
    },
    {
      name: 'HTTPS sub-group repo url',
      input: 'https://cnb.cool/group/sub-group/repo.git',
      output: {
        repo: 'repo',
        groups: ['group', 'sub-group'],
      },
    },
  ].forEach((item) => {
    it(item.name, () => {
      expect(parseCnbRepoUrl(item.input)).toEqual(item.output)
    })
  })
})
