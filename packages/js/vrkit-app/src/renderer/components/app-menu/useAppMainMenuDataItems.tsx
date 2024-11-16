import React, { useMemo } from "react"
// import { useAppDispatch } from "@taskx/lib-shared-web/services/store"
import { ActionRegistry, AppActionId, Menu } from "vrkit-shared"
import { useService } from "../service-container"
import { getValue } from "@3fv/guard"
import { useAppDispatch } from "../../services/store"
import { isElectron } from "../../renderer-constants"


export function useAppMainMenuDataItems(): Menu  {
	const dispatch = useAppDispatch()
	const actionRegistry = getValue(() => useService(ActionRegistry))

	const
			menu = useMemo(() => {
				const menu = new Menu()
				// .addLabel(`TaskX / Version ${ VERSION }`)
				// .addSeparator()
				.addAction(actionRegistry.get(AppActionId.gotoAppSettings))
				.addAction(actionRegistry.get(AppActionId.resetAll))
				.addSeparator()
			//
			// menu
			// 	.addAction(actionRegistry.get(GlobalActionIds.IssueCreate))
			// 	.addAction(actionRegistry.get(GlobalActionIds.IssueSearch))
			// 	.addSeparator()
			// 	// .addAction(this.uiCommands.WorkspaceCreate)
			// 	// .addAction(this.uiCommands.WorkspaceEdit)
			// 	.addAction(actionRegistry.get(GlobalActionIds.RepoAdd))
			// 	.addSeparator()

			const toolsMenu = menu.addSubmenu(`Tools`)

			if (isElectron) {
				const viewMenu = menu.addSubmenu(`View`)


				viewMenu
					.addAction(actionRegistry.get(AppActionId.zoomDefault))
					.addAction(actionRegistry.get(AppActionId.zoomIn))
					.addAction(actionRegistry.get(AppActionId.zoomOut))
			}
			// toolsMenu.addAction(this.uiCommands.ToggleNotifications)
			//       .addAction(this.uiCommands.ToggleWorkspaceSettings)
			//
			// ghMenu
			//
			// 	.addAction(actionRegistry.get(GlobalActionIds.SyncAllData))

			if (isElectron) {
				menu.addAction(actionRegistry.get(AppActionId.quit)).render()
			}
			menu.addSeparator()
			return menu
		},[actionRegistry])

	return menu
	
}
