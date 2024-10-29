import { PluginManifest, PluginInstall } from "vrkit-models"
import { createSimpleSchema, custom, list, map } from "serializr"

export interface PluginsState {
  plugins: Record<string, PluginInstall>
}

export const newPluginsState = (): PluginsState => ({
  plugins: {},
})

export const PluginsStateSchema = createSimpleSchema<PluginsState>({
  plugins: map(custom(v => PluginInstall.toJson(v), v => PluginInstall.fromJson(v)))
})