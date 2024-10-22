import type { IPluginClientComponentProps, IPluginComponentManager, IPluginInitFactory } from "vrkit-plugin-sdk"
import { Container } from "@3fv/ditsy"
import { PluginComponentType, PluginManifest } from "vrkit-models"
import { getLogger } from "@3fv/logger-proxy"
import { importDefault } from "vrkit-shared"
import React from "react"

const log = getLogger(__filename)

const PluginInitFactory: IPluginInitFactory = async function PluginInitFactory(
  manifest: PluginManifest,
  componentManager: IPluginComponentManager,
  serviceContainer: Container
) {
  for (const comp of manifest.components.filter(({ type }) => type === PluginComponentType.OVERLAY)) {
    const { id } = comp,
      ComponentTypePromise: Promise<{
        default: React.ComponentType<IPluginClientComponentProps>
      }> =
        id === "track-map"
          ? importDefault(import("./track-map/TrackMapOverlayPlugin.js"))
          : id === "clock"
            ? importDefault(import("./clock/ClockOverlayPlugin.js"))
            : null

    if (!ComponentTypePromise) {
      throw Error(`Unknown component overlay id (id=${id})`)
    }

    const componentType = await importDefault(ComponentTypePromise)

    componentManager.setOverlayComponent(id, componentType)
  }
}

export default PluginInitFactory
