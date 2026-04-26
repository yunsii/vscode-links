import { useLogger } from 'reactive-vscode'

// ref: https://github.com/kermanx/reactive-vscode/blob/main/packages/core/src/composables/useLogger.ts
export function getDefaultLoggerPrefix(type: string) {
  const date = new Date()
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  const second = String(date.getSeconds()).padStart(2, '0')
  return `[${type}  - ${hour}:${minute}:${second}] `
}

export const logger = useLogger('Links', {
  getPrefix: getDefaultLoggerPrefix,
})
