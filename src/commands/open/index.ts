import { useCommand } from 'reactive-vscode'
import * as vscode from 'vscode'

import { getErrorMessage } from '../../helpers/errors'
import { getIconForType } from '../../helpers/icons'
import { withLoadingStatus } from '../../helpers/loading'
import { openLinkResource } from '../../helpers/open'
import { processLinkDisplay } from '../../helpers/url'
import { linksStore } from '../../store/links'
import { logger } from '../../utils'

export async function addLinksOpenCommand() {
  useCommand('links.open', async () => {
    try {
      const resources = await withLoadingStatus(linksStore.loadResources(), { message: 'Link resources are loading...', delayMs: 1000 })

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
        matchOnDetail: true,
      })

      if (!result) {
        return
      }

      const target = result.item

      // Use unified function to open the link with real-time rendering
      await openLinkResource(target)
    } catch (err) {
      logger.error(err)
      vscode.window.showWarningMessage(getErrorMessage(err))
    }
  })
}
