import { strict as assert } from 'node:assert'
import { mkdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import process from 'node:process'

import { it } from 'vitest'

import { renderTemplate, resolve } from '../index.js'

it('resolve returns empty links for an empty cwd', () => {
  const dir = join(tmpdir(), `vscl-native-empty-${process.pid}-${Date.now()}`)
  mkdirSync(dir, { recursive: true })
  try {
    const r = resolve({ cwd: dir })
    assert.deepEqual(r.links, [])
    assert.deepEqual(r.skipped, [])
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

it('resolve renders a static local link from config', () => {
  const dir = join(tmpdir(), `vscl-native-local-${process.pid}-${Date.now()}`)
  mkdirSync(dir, { recursive: true })
  try {
    const r = resolve({
      cwd: dir,
      config: {
        resources: [{ url: 'https://example.com/wiki', title: 'Team wiki' }],
      },
    })
    assert.equal(r.links.length, 1)
    assert.equal(r.links[0].type, 'local')
    assert.equal(r.links[0].source, 'settings:links.resources')
    assert.equal(r.links[0].url, 'https://example.com/wiki')
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

it('resolve picks up GitHub detected links inside this repo', () => {
  const r = resolve({ cwd: process.cwd() })
  const detected = r.links.filter((l) => l.source === 'detected:github')
  assert.ok(detected.length > 0)
  assert.ok(detected.some((l) => l.title === 'GitHub Repo'))
})

it('renderTemplate substitutes whitelisted variables', () => {
  const out = renderTemplate('{{repo.url}}@{{git.branch}}', {
    repo: { url: 'https://x/' },
    git: { branch: 'main' },
  })
  assert.equal(out, 'https://x/@main')
})

it('renderTemplate throws on unknown variables', () => {
  assert.throws(
    () => renderTemplate('{{custom.var}}', { custom: { var: 'x' } }),
    /Unknown template variable/,
  )
})
