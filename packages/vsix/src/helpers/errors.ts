// Inlined from packages/core/src/errors.ts so the VSIX no longer
// needs to depend on @vscode-links/core for a 30-line helper.

interface ErrorWithMessage {
  message: string
}

function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object'
    && error !== null
    && 'message' in error
    && typeof (error as Record<string, unknown>).message === 'string'
  )
}

function toErrorWithMessage(maybeError: unknown): ErrorWithMessage {
  if (isErrorWithMessage(maybeError)) {
    return maybeError
  }
  try {
    return new Error(JSON.stringify(maybeError))
  } catch {
    return new Error(String(maybeError))
  }
}

// ref: https://kentcdodds.com/blog/get-a-catch-block-error-message-with-typescript
export function getErrorMessage(error: unknown): string {
  return toErrorWithMessage(error).message
}
