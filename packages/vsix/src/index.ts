import { defineExtension } from 'reactive-vscode'

import { addCommandOpen } from './entrypoints/command.open'
import { addCommandRefresh } from './entrypoints/command.refresh'
import { setupStatusBarItemOpen } from './entrypoints/status-bar-item.open'
import { setupViewLinks } from './entrypoints/view.links'
import { extensionId, version } from './generated/meta'
import { bootstrapLinksStore } from './store/links'
import { logger } from './utils'

const { activate, deactivate } = defineExtension(() => {
  logger.info(`${extensionId} v${version} is running.`)
  addCommandOpen()
  addCommandRefresh()
  setupViewLinks()
  setupStatusBarItemOpen()
  bootstrapLinksStore()
})

export { activate, deactivate }
