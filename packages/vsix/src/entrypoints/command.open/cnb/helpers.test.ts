import { describe, expect, it } from 'vitest'

import { getCnbRepoLinks, parseCnbRepoUrl } from './helpers'

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

describe('getCnbRepoLinks', () => {
  [
    {
      name: 'HTTPS repo url',
      input: {
        repo: 'repo',
        groups: ['group'],
      },
      outputIncludes: ['https://cnb.cool/group/repo'],
    },
    {
      name: 'HTTPS sub-group repo url',
      input: {
        repo: 'repo',
        groups: ['group', 'sub-group'],
      },
      outputIncludes: [
        'https://cnb.cool/group/sub-group/repo',
      ],
    },
  ].forEach((item) => {
    it(item.name, async () => {
      const result = await getCnbRepoLinks(item.input.groups, item.input.repo)
      expect(item.outputIncludes.every((item) => {
        return result.some((res) => res.url.includes(item))
      })).toBeTruthy()
    })
  })
})
