import { defineExtension } from 'reactive-vscode'

import { addLinksOpenCommand } from './commands/open'
import { setupLinkResourcesCacheAutoClear } from './helpers/config'
import { linksStore } from './store/links'
import { logger } from './utils'
import { setupViewsAndCommands } from './views-containers'

const { activate, deactivate } = defineExtension((context) => {
  logger.info('VS Code Links is running.')
  addLinksOpenCommand()

  setupViewsAndCommands(context)
  setupLinkResourcesCacheAutoClear(context.subscriptions, () => linksStore.refresh())
})

export { activate, deactivate }
