#!/usr/bin/env node
// Process entry: stdio + exit code only. All logic lives in run().

import process from 'node:process'

import { run } from './run'

async function main() {
  const result = await run({ argv: process.argv.slice(2), cwd: process.cwd() })
  if (result.stdout) {
    process.stdout.write(result.stdout)
  }
  if (result.stderr) {
    process.stderr.write(result.stderr)
  }
  process.exit(result.exitCode)
}

main().catch((err) => {
  process.stderr.write(`unexpected error: ${(err as Error)?.message ?? String(err)}\n`)
  process.exit(1)
})
