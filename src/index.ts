import { defineExtension } from 'reactive-vscode'

import { addLinksOpenCommand } from './commands/open'
import { setupLinkResourcesCacheAutoClear } from './helpers/config'
import { logger } from './utils'
import { setupViewsAndCommands } from './views-containers'

const { activate, deactivate } = defineExtension((context) => {
  logger.info('VS Code Links is running.')
  addLinksOpenCommand()
  setupLinkResourcesCacheAutoClear(context.subscriptions)

  setupViewsAndCommands()
})

export { activate, deactivate }
