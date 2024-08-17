import { defineExtension } from 'reactive-vscode'

import { addLinksOpenCommand } from './commands/open'

const { activate, deactivate } = defineExtension(() => {
  addLinksOpenCommand()
})

export { activate, deactivate }
