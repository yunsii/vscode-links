import { describe, expect, it } from 'vitest'

import { parseGitHubRepoUrl } from './helpers'

describe('parseGitHubRepoUrl', () => {
  [
    {
      name: 'SSH repo url',
      input: 'git@github.com:owner/repo.git',
      output: {
        repo: 'repo',
        owner: 'owner',
      },
    },
    {
      name: 'HTTPS repo url',
      input: 'https://github.com/owner/repo.git',
      output: {
        repo: 'repo',
        owner: 'owner',
      },
    },
  ].forEach((item) => {
    it(item.name, () => {
      expect(parseGitHubRepoUrl(item.input)).toEqual(item.output)
    })
  })
})
