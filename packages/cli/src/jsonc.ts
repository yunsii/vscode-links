import { parse, printParseErrorCode } from 'jsonc-parser'

import type { ParseError } from 'jsonc-parser'

export class JsoncParseError extends Error {
  constructor(public readonly errors: ParseError[], message: string) {
    super(message)
    this.name = 'JsoncParseError'
  }
}

/**
 * Parse a JSONC string (the dialect VS Code uses for settings.json:
 * `// line` and `/* block *\/` comments + trailing commas).
 *
 * Throws JsoncParseError if the document does not parse, with all
 * errors attached. Returns `null` for an empty document.
 */
export function parseJsonc<T = unknown>(input: string): T {
  const errors: ParseError[] = []
  const value = parse(input, errors, { allowTrailingComma: true, disallowComments: false })
  if (errors.length > 0) {
    const summary = errors
      .map((e) => `${printParseErrorCode(e.error)} at offset ${e.offset}`)
      .join('; ')
    throw new JsoncParseError(errors, `JSONC parse failed: ${summary}`)
  }
  return value as T
}
