import { useCommand } from 'reactive-vscode'
import * as vscode from 'vscode'

import type { BaseLinkResource } from '@/helpers/schemas'

import { getAllLinkResources } from '../../helpers/config'
import { getErrorMessage } from '../../helpers/errors'
import { logger } from '../../utils'

export async function addLinksOpenCommand() {
  useCommand('links.open', async () => {
    try {
      const resources = await getAllLinkResources()

      const renderItem = (item: BaseLinkResource) => {
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
