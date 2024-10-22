import { propEqualTo } from "../../utils"
import type {
  ActionMenuItemDesktopRoleId,
  ActionMenuItemDesktopRoleKind,
  ActionOptions
} from "./ActionTypes"


export const isAppCommand = propEqualTo<ActionOptions>("type", "App")

export function electronRoleToId<Role extends ActionMenuItemDesktopRoleKind>(
  role: Role
): ActionMenuItemDesktopRoleId {
  return role // `electron${capitalize(role)}` as ActionMenuItemDesktopRoleId
}
