import { PluginManifest, PluginInstall } from "@vrkit-platform/models"
import { createSimpleSchema, custom, list, map } from "serializr"


export interface PluginsState {
  plugins: Record<string, PluginInstall>
  availablePlugins: Record<string, PluginManifest>
}

export const newPluginsState = (): PluginsState => ({
  plugins: {},
  availablePlugins: {}
})

export const PluginsStateSchema = createSimpleSchema<PluginsState>({
  plugins: map(custom(v => PluginInstall.toJson(v), v => PluginInstall.fromJson(v))),
  availablePlugins: map(custom(v => PluginManifest.toJson(v), v => PluginManifest.fromJson(v)))
})

// export enum PluginManagerEventType {
//
// }
//
// export type PluginManagerEventIPCName =
//     `PLUGIN_MANAGER_EVENT_${PluginManagerEventType}`
//
// export function PluginManagerEventTypeToIPCName(
//     type: PluginManagerEventType
// ): PluginManagerEventIPCName {
//   return `PLUGIN_MANAGER_EVENT_${type.toUpperCase()}` as PluginManagerEventIPCName
// }

export enum PluginManagerFnType {
  INSTALL_PLUGIN = "INSTALL_PLUGIN",
  UNINSTALL_PLUGIN = "UNINSTALL_PLUGIN",
  REFRESH_AVAILABLE_PLUGINS = "REFRESH_AVAILABLE_PLUGINS"
}

export type PluginManagerFnIPCName =
    `PLUGIN_MANAGER_FN_${PluginManagerFnType}`

export function PluginManagerFnTypeToIPCName(
    type: PluginManagerFnType
): PluginManagerFnIPCName {
  return `PLUGIN_MANAGER_FN_${type}`
}

