import * as vscode from 'vscode'

/**
 * Show a transient status bar message if the provided promise takes longer
 * than `delayMs` to settle. The status message is disposed as soon as the
 * promise resolves or rejects.
 *
 * Usage: await withLoadingStatus(fetchSomething(), { message: 'Loading...', delayMs: 1000 })
 */
export async function withLoadingStatus<T>(promise: Promise<T>, options: { message: string, delayMs?: number }): Promise<T> {
  const delay: number = typeof options.delayMs === 'number' ? options.delayMs : 1000

  let statusDisposable: vscode.Disposable | undefined
  const timer: ReturnType<typeof setTimeout> = setTimeout(() => {
    statusDisposable = vscode.window.setStatusBarMessage(options.message)
  }, delay)

  try {
    const result: T = await promise
    return result
  } finally {
    try {
      clearTimeout(timer)
    } catch (e) {
      // noop
    }

    if (typeof statusDisposable !== 'undefined') {
      try {
        statusDisposable.dispose()
      } catch (e) {
        // noop
      }
    }
  }
}
