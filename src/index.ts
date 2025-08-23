import { defineExtension } from 'reactive-vscode'

import { addLinksOpenCommand } from './commands/open'
import { setupLinkResourcesCacheAutoClear } from './helpers/config'
import { logger } from './utils'

const { activate, deactivate } = defineExtension((context) => {
  logger.info('VS Code Links is running.')
  addLinksOpenCommand()
  // setup automatic cache invalidation for link resources
  setupLinkResourcesCacheAutoClear(context.subscriptions)
})

export { activate, deactivate }
