import { defineExtension } from 'reactive-vscode'

import { addCommandOpen } from './entrypoints/command.open'
import { setupStatusBarItemOpen } from './entrypoints/status-bar-item.open'
import { setupViewLinks } from './entrypoints/view.links'
import { logger } from './utils'

const { activate, deactivate } = defineExtension(() => {
  logger.info('VS Code Links is running.')
  addCommandOpen()
  setupViewLinks()
  setupStatusBarItemOpen()
})

export { activate, deactivate }
