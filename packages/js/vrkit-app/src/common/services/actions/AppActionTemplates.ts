import { Action, ActionOptions } from "./ActionTypes"
import { cloneDeep, defaults, generateShortId } from "vrkit-app-common/utils"

export const AppActionTemplates = {
  save: {
    name: "Save",
    defaultAccelerators: [ "CommandOrControl+s", "CommandOrControl+Enter" ]
  } as ActionOptions
}
export type AppActionTemplatesType = typeof AppActionTemplates
export type AppActionTemplateId = keyof AppActionTemplatesType

export function actionFromTemplate(templateId:AppActionTemplateId,
  execute:() => any,
  extraOptions:Partial<ActionOptions> = {}
) {
  const actionOptions = defaults(cloneDeep(AppActionTemplates[templateId], {
    execute, ...extraOptions
  }), {
    id: generateShortId()
  }) as ActionOptions, action = new Action(actionOptions)
  
  return action
}