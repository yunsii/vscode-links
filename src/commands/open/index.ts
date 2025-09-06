import { useCommand } from 'reactive-vscode'
import * as vscode from 'vscode'

import { getAllLinkResources } from '../../helpers/config'
import { getErrorMessage } from '../../helpers/errors'
import { getIconForType } from '../../helpers/icons'
import { withLoadingStatus } from '../../helpers/loading'
import { processLinkDisplay } from '../../helpers/url'
import { logger } from '../../utils'

export async function addLinksOpenCommand() {
  useCommand('links.open', async () => {
    try {
      const resources = await withLoadingStatus(getAllLinkResources(), { message: 'Link resources are loading...', delayMs: 1000 })

      const quickPickItems = resources.map((item) => {
        const { label, detail } = processLinkDisplay(item)

        return {
          label,
          detail,
          iconPath: getIconForType(item.type),
          item,
        }
      })

      const result = await vscode.window.showQuickPick(quickPickItems, {
        placeHolder: 'Pick a url to open',
      })

      if (!result) {
        return
      }

      const target = result.item

      vscode.env.openExternal(vscode.Uri.parse(target.url))
    } catch (err) {
      logger.error(err)
      vscode.window.showWarningMessage(getErrorMessage(err))
    }
  })
}
