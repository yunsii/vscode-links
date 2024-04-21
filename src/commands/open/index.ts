import * as vscode from 'vscode'

import { addCommand } from '../helpers'
import { getExtensionResources } from '../../helpers/config'

export function addLinksOpenCommand(context: vscode.ExtensionContext) {
  addCommand(context, {
    name: 'links.open',
    handler: async () => {
      const resources = getExtensionResources()
      if (!resources || resources.length === 0) {
        vscode.window.showWarningMessage('No links resources to open')
        return
      }

      const result = await vscode.window.showQuickPick(resources.map((item) => {
        return `${item.title} - ${item.url}`
      }), {
        placeHolder: 'Pick a url to open',
      })
      const target = resources.find((item) => {
        return `${item.title} | ${item.url}` === result
      })

      if (!target) {
        return
      }

      vscode.env.openExternal(vscode.Uri.parse(target.url))
    },
  })
}
