#!/usr/bin/env node
// Single sanctioned way to bump a release train. Each train has its
// own version source(s); this script validates the requested version
// is a strict-semver string greater than the current value, then edits
// the right files in place. No git commit, no tag — that's the
// caller's job (typically: edit + review + commit + tag + push).
//
// Usage:
//   node scripts/bump.mjs --train cli    --to 0.2.0
//   node scripts/bump.mjs --train native --to 0.2.0
//   node scripts/bump.mjs --train vsix   --to 1.3.0
//
// `pnpm release:<train> <version>` is the same thing wrapped.

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, '..')

/** Each train describes the files it owns and how to find their version field. */
const TRAINS = {
  cli: [
    {
      path: 'crates/cli/Cargo.toml',
      kind: 'cargo',
      explanation: 'baked into vscode-links --version output',
    },
  ],
  native: [
    {
      path: 'crates/napi/Cargo.toml',
      kind: 'cargo',
      explanation: 'cdylib version metadata',
    },
    {
      path: 'crates/core/Cargo.toml',
      kind: 'cargo',
      explanation: 'core depends only via path:; bumped for consistency',
    },
    {
      path: 'packages/native/package.json',
      kind: 'json',
      explanation: '@vscode-links/native; the publish workflow also overwrites this from the tag',
    },
  ],
  vsix: [
    {
      path: 'packages/vsix/package.json',
      kind: 'json',
      explanation: 'vsce reads the bundled version straight from this file',
    },
  ],
}

const SEMVER_RE = /^\d+\.\d+\.\d+(?:-[0-9A-Z.-]+)?(?:\+[0-9A-Z.-]+)?$/i

function usage() {
  return `
    usage: bump.mjs --train <cli|native|vsix> --to <semver>

    Trains:
    ${Object.entries(TRAINS)
      .map(
        ([name, files]) =>
          `  ${name.padEnd(8)} -> ${files.map((f) => f.path).join(', ')}`,
      )
      .join('\n')}

    The script only edits files; commit + tag + push remain manual:
      git commit -am "chore(release): bump cli to 0.2.0"
      git tag cli-v0.2.0
      git push --follow-tags
  `
}

function parseArgs(argv) {
  const out = {}
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--train') {
      out.train = argv[++i]
    } else if (a === '--to') {
      out.to = argv[++i]
    } else if (a === '-h' || a === '--help') {
      process.stdout.write(`${usage()}\n`)
      process.exit(0)
    } else if (!out.to && SEMVER_RE.test(a)) {
      // shorthand: `pnpm release:cli 0.2.0`
      out.to = a
    } else {
      throw new Error(`unknown argument: ${a}`)
    }
  }
  return out
}

function readVersion({ path, kind }) {
  const full = join(repoRoot, path)
  const text = readFileSync(full, 'utf8')
  if (kind === 'json') {
    return { current: JSON.parse(text).version, text, full }
  }
  // cargo: first `version = "..."` line in the [package] section.
  const m = text.match(/^version\s*=\s*"([^"]+)"/m)
  if (!m) {
    throw new Error(`cannot find version in ${path}`)
  }
  return { current: m[1], text, full }
}

function writeVersion({ path, kind }, current, next) {
  const full = join(repoRoot, path)
  const text = readFileSync(full, 'utf8')
  let updated
  if (kind === 'json') {
    const pkg = JSON.parse(text)
    pkg.version = next
    // Preserve trailing newline.
    updated = `${JSON.stringify(pkg, null, 2)}\n`
  } else {
    updated = text.replace(
      /^version\s*=\s*"([^"]+)"/m,
      `version = "${next}"`,
    )
    if (updated === text) {
      throw new Error(`failed to substitute version in ${path}`)
    }
  }
  writeFileSync(full, updated)
  process.stdout.write(`  ${path}: ${current} -> ${next}\n`)
}

function semverCmp(a, b) {
  // Strict triple compare on the major.minor.patch core. Pre-release
  // tags push down (1.0.0-alpha < 1.0.0); we bias toward forbidding
  // the bump if the comparison is unclear so the human can override.
  const parse = (s) => {
    const [core, pre = ''] = s.split('-')
    const [maj, min, pat] = core.split('.').map(Number)
    return { maj, min, pat, pre }
  }
  const A = parse(a)
  const B = parse(b)
  if (A.maj !== B.maj) {
    return A.maj - B.maj
  }
  if (A.min !== B.min) {
    return A.min - B.min
  }
  if (A.pat !== B.pat) {
    return A.pat - B.pat
  }
  if (A.pre === B.pre) {
    return 0
  }
  if (A.pre === '') {
    return 1
  }
  if (B.pre === '') {
    return -1
  }
  return A.pre < B.pre ? -1 : 1
}

function main() {
  let opts
  try {
    opts = parseArgs(process.argv.slice(2))
  } catch (err) {
    process.stderr.write(`error: ${err.message}\n\n${usage()}`)
    process.exit(2)
  }
  if (!opts.train || !opts.to) {
    process.stderr.write(`error: --train and --to are required\n\n${usage()}`)
    process.exit(2)
  }
  if (!SEMVER_RE.test(opts.to)) {
    process.stderr.write(`error: --to must be a valid semver, got "${opts.to}"\n`)
    process.exit(2)
  }
  const files = TRAINS[opts.train]
  if (!files) {
    process.stderr.write(
      `error: unknown train "${opts.train}"; expected one of ${Object.keys(TRAINS).join(', ')}\n`,
    )
    process.exit(2)
  }

  // Read all current versions first so we can validate before editing.
  const reads = files.map((f) => ({ ...f, ...readVersion(f) }))
  const distinct = new Set(reads.map((r) => r.current))
  if (distinct.size > 1) {
    process.stderr.write(
      `error: train ${opts.train} versions are out of sync across files: `
      + `${reads.map((r) => `${r.path}=${r.current}`).join(', ')}\n`
      + `fix the in-tree versions to match before bumping.\n`,
    )
    process.exit(3)
  }
  const [current] = distinct
  if (semverCmp(opts.to, current) <= 0) {
    process.stderr.write(
      `error: --to ${opts.to} is not greater than current ${current}\n`,
    )
    process.exit(3)
  }

  process.stdout.write(`Bumping ${opts.train}: ${current} -> ${opts.to}\n`)
  for (const f of files) {
    writeVersion(f, current, opts.to)
  }
  process.stdout.write(
    `\nNext steps:\n`
    + `  git diff --stat\n`
    + `  git commit -am "chore(release): bump ${opts.train} to ${opts.to}"\n`
    + `  git tag ${opts.train === 'vsix' ? 'v' : `${opts.train}-v`}${opts.to}\n`
    + `  git push --follow-tags\n`,
  )
}

main()
