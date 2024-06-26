import * as vscode from 'vscode'

import { addCommand } from '../helpers'
import { getAllLinkResources } from '../../helpers/config'

import type { ResourceItem } from '../../helpers/config'

export async function addLinksOpenCommand(context: vscode.ExtensionContext) {
  addCommand(context, {
    name: 'links.open',
    handler: async () => {
      const resources = await getAllLinkResources()
      if (!resources || resources.length === 0) {
        vscode.window.showWarningMessage('No links resources to open')
        return
      }

      const renderItem = (item: ResourceItem) => {
        return `${item.title} - ${item.url}`
      }

      const result = await vscode.window.showQuickPick(resources.map((item) => {
        return renderItem(item)
      }), {
        placeHolder: 'Pick a url to open',
      })
      const target = resources.find((item) => {
        return renderItem(item) === result
      })

      if (!target) {
        return
      }

      vscode.env.openExternal(vscode.Uri.parse(target.url))
    },
  })
}
