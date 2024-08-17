import { defineExtension } from 'reactive-vscode'

import { addLinksOpenCommand } from './commands/open'
import { logger } from './utils'

const { activate, deactivate } = defineExtension(() => {
  logger.info('VS Code Links is running.')
  addLinksOpenCommand()
})

export { activate, deactivate }
