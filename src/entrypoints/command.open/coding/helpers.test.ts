import { describe, expect, it } from 'vitest'

import { parseCodingRepoUrl } from './helpers'

describe('parseCodingRepoUrl', () => {
  [
    {
      name: 'SSH repo url',
      input: 'git@e.coding.net:team/project/repo.git',
      output: {
        repo: 'repo',
        project: 'project',
        team: 'team',
      },
    },
    {
      name: 'HTTPS repo url',
      input: 'https://e.coding.net/team/project/repo.git',
      output: {
        repo: 'repo',
        project: 'project',
        team: 'team',
      },
    },
  ].forEach((item) => {
    it(item.name, () => {
      expect(parseCodingRepoUrl(item.input)).toEqual(item.output)
    })
  })
})
