import { describe, expect, it } from 'vitest'

import { processLinkDisplay } from './url'

import type { BaseLinkResource } from './schemas'

describe('processLinkDisplay', () => {
  it('should handle normal URLs without template variables', () => {
    const resource: BaseLinkResource = {
      url: 'https://github.com/owner/repo',
      title: 'GitHub Repo',
      type: 'detected',
    }

    const result = processLinkDisplay(resource)

    expect(result).toEqual({
      label: 'GitHub Repo',
      detail: 'github.com/owner/repo',
      shortUrl: 'github.com/owner/repo',
    })
  })

  it('should preserve template variables in URLs without encoding them', () => {
    const resource: BaseLinkResource = {
      url: 'https://github.com/owner/repo/blob/{{git.branch}}/{{workspace.fileRelativePath}}',
      title: 'GitHub Repo Current File',
      type: 'detected',
    }

    const result = processLinkDisplay(resource)

    expect(result.shortUrl).toBe('github.com/owner/repo/blob/{{git.branch}}/{{workspace.fileRelativePath}}')
    expect(result.label).toBe('GitHub Repo Current File')
    expect(result.detail).toBe('github.com/owner/repo/blob/{{git.branch}}/{{workspace.fileRelativePath}}')
  })

  it('should handle URLs with description and template variables', () => {
    const resource: BaseLinkResource = {
      url: 'https://cnb.cool/group/repo/-/blob/{{git.branch}}/{{workspace.fileRelativePath}}',
      title: 'CNB Repo Current File',
      description: 'Current file in CNB repository',
      type: 'detected',
    }

    const result = processLinkDisplay(resource)

    expect(result.shortUrl).toBe('cnb.cool/group/repo/-/blob/{{git.branch}}/{{workspace.fileRelativePath}}')
    expect(result.label).toBe('CNB Repo Current File')
    expect(result.detail).toBe('Current file in CNB repository • cnb.cool/group/repo/-/blob/{{git.branch}}/{{workspace.fileRelativePath}}')
  })

  it('should handle URLs with query parameters and template variables', () => {
    const resource: BaseLinkResource = {
      url: 'https://example.com/path/{{workspace.fileRelativePath}}?tab=preview&line={{line.number}}',
      title: 'Example File',
      type: 'detected',
    }

    const result = processLinkDisplay(resource)

    expect(result.shortUrl).toBe('example.com/path/{{workspace.fileRelativePath}}?tab=preview&line={{line.number}}')
  })

  it('should handle URLs with multiple template variables', () => {
    const resource: BaseLinkResource = {
      url: 'https://github.com/{{repo.owner}}/{{repo.name}}/blob/{{git.branch}}/{{workspace.fileRelativePath}}',
      title: 'Dynamic Repo File',
      type: 'detected',
    }

    const result = processLinkDisplay(resource)

    expect(result.shortUrl).toBe('github.com/{{repo.owner}}/{{repo.name}}/blob/{{git.branch}}/{{workspace.fileRelativePath}}')
  })

  it('should handle URLs with template variables in hostname', () => {
    const resource: BaseLinkResource = {
      url: 'https://{{repo.host}}/{{repo.owner}}/{{repo.name}}/blob/{{git.branch}}/{{workspace.fileRelativePath}}',
      title: 'Dynamic Host Repo File',
      type: 'detected',
    }

    const result = processLinkDisplay(resource)

    expect(result.shortUrl).toBe('{{repo.host}}/{{repo.owner}}/{{repo.name}}/blob/{{git.branch}}/{{workspace.fileRelativePath}}')
  })
})
