import { useCommand } from 'reactive-vscode'
import * as vscode from 'vscode'

import { getAllLinkResources } from '../../helpers/config'
import { getErrorMessage } from '../../helpers/errors'
import { logger } from '../../utils'

import type { ResourceItem } from '../../helpers/config'

export async function addLinksOpenCommand() {
  useCommand('links.open', async () => {
    try {
      const resources = await getAllLinkResources()

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
    } catch (err) {
      logger.error(err)
      vscode.window.showWarningMessage(getErrorMessage(err))
    }
  })
}
