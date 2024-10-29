import type { IPluginComponentProps, IPluginComponentFactory } from "vrkit-plugin-sdk"
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
  serviceContainer: Container
) {
  
    const { id } = componentDef,
      ComponentTypePromise: Promise<{ default: React.ComponentType<IPluginComponentProps> }> =
        (id === "vrkit::internal::track-map"
          ? import("./track-map/TrackMapOverlayPlugin.js")
          : id === "vrkit::internal::clock"
            ? import("./clock/ClockOverlayPlugin.js")
            : null) as any
    
    if (!ComponentTypePromise) {
      throw Error(`Unknown component overlay id (id=${id})`)
    }
    
    log.info(`Loading plugin component ${id}`)
    const componentType = await importDefault(ComponentTypePromise)
    log.info(`Loaded plugin component ${id}`, componentType)
    return componentType
  
}

export default PluginComponentFactory
