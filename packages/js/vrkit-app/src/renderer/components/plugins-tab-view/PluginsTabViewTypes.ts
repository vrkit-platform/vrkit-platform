import { PluginsState } from "@vrkit-platform/shared"


export type PluginViewModeKind = keyof Pick<PluginsState, "plugins" | "availablePlugins">

export const PluginViewMode: {[K in PluginViewModeKind]: K} = {
  plugins: "plugins",
  availablePlugins: "availablePlugins",
}
