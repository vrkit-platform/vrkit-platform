import type { IPluginComponentProps, IPluginComponentManager, IPluginComponentFactory } from "vrkit-plugin-sdk"
import { Container } from "@3fv/ditsy"
import {
  PluginComponentDefinition,
  PluginComponentType,
  PluginManifest
} from "vrkit-models"
import { getLogger } from "@3fv/logger-proxy"
import { importDefault } from "vrkit-shared"
import React from "react"

const log = getLogger(__filename)

const PluginComponentFactory: IPluginComponentFactory = async function PluginComponentFactory(
  manifest: PluginManifest,
  componentDef: PluginComponentDefinition,
  componentManager: IPluginComponentManager,
  serviceContainer: Container
) {
  const componentsToLoad: Array<PluginComponentDefinition> = (!!componentDef ? [componentDef] :
      manifest.components).filter(({ type }) => type === PluginComponentType.OVERLAY)
  for (const comp of componentsToLoad) {
    const { id } = comp,
      ComponentTypePromise: Promise<{ default: React.ComponentType<IPluginComponentProps> }> =
        (id === "track-map"
          ? import("./track-map/TrackMapOverlayPlugin.js")
          : id === "clock"
            ? import("./clock/ClockOverlayPlugin.js")
            : null) as any

    if (!ComponentTypePromise) {
      throw Error(`Unknown component overlay id (id=${id})`)
    }

    const componentType = await importDefault(ComponentTypePromise)

    componentManager.setOverlayComponent(id, componentType)
  }
}

export default PluginComponentFactory
