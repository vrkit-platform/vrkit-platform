# Plugin System Design

## Overview

The plugin system's purpose is to allow for the addition of components
(for example an `Overlay`) without changing the main codebase.

The plugin will never be loaded in the `main` process (at least not at the
moment), however, the `main` process can determine what is provided by the
plugin via
it's `vrkit-plugin.json[5]` (regardless of extension, it will be parsed as
`JSON5`)

### Allowed Component Types

- `Overlay`
- More to come...

## Configuration & Usage

Creating a plugin is equivalent to creating NPM package/library (i.e.
`npm init`) with a `main` attribute in `package.json` pointing to a `.js`
file with a single `default` export must match the `IPluginComponentFactory` below.

> The package name must match `/^vrkit-plugin-{PLUGIN_NAME}$/` in order to be
> compatible with the `PluginLoader`

In the root of your package/library, create a file with the name
`vrkit-plugin.json[5]` (details here).

### Configuration `vrkit-plugin.(yaml|json|json5)`

#### Example (used to generate schema)

```json
{
  "id": "mycorp::myplugin",
  "author": {
    "company": "3FV",
    "name": "Jonathan Glanz",
    "email": "jonathan.glanz@gmail.com"
  },
  "name": "VRKitExternalPlugin",
  "components": [
    {
      "id": "leaderboard-overlay",
      "type": "PLUGIN_COMPONENT_TYPE_OVERLAY",
      "name": "Leaderboard",
      "description": "A configurable leaderboard overlay",
      "supportedGames": [
        "SUPPORTED_GAME_IRACING"
      ],
      "overlayCommonSettings": {
        "canResize": true,
        "forceAspectRatio": false,
        "fps": 0,
        "initialSize": {
          "height": 300,
          "width": 400
        }
      },
      "overlayIrSettings": {
        "dataVariablesUsed": [
          "PlayerCarIdx",
          "CarIdxLap",
          "CarIdxLapCompleted",
          "CarIdxPosition",
          "CarIdxClassPosition",
          "CarIdxEstTime",
          "CarIdxLapDistPct"
        ]
      }
    }
  ]
}
```

### `IPluginComponentFactory` Implementation

```tsx
import {
  PluginComponentDefinition,
  PluginComponentType,
  PluginManifest,
  OverlayInfo,
  OverlayInfo,
  LapTrajectory,
  TrackMap,
  SessionTiming,
  PluginComponentDefinition_OverlayCommonSettings
} from "vrkit-models"
import {
  SessionInfoMessage,
  SessionTiming,
  SessionDataVariableValueMap
} from "vrkit-plugin-sdk"


export enum PluginClientEventType {
  SESSION_ID_CHANGED = "SESSION_ID_CHANGED",
  SESSION_INFO_CHANGED = "SESSION_INFO_CHANGED",
  DATA_FRAME = "DATA_FRAME"
}

export interface IPluginClientEventArgs {
  [PluginClientEventType.DATA_FRAME]:(sessionId:string,
      timing:SessionTiming,
      dataVarValues:SessionDataVariableValueMap
  ) => void
  
  [PluginClientEventType.SESSION_ID_CHANGED]:(
      sessionId:string,
      info:SessionInfoMessage
  ) => void
  
  [PluginClientEventType.SESSION_INFO_CHANGED]:(
      sessionId:string,
      info:SessionInfoMessage
  ) => void
}

export interface IPluginClient {
  inActiveSession():boolean
  
  getOverlayInfo():OverlayInfo
  
  getSessionInfo():SessionInfoMessage
  
  getSessionTiming():SessionTiming
  
  getLapTrajectory(trackLayoutId:string):Promise<LapTrajectory>
  
  getTrackMap(trackLayoutId:string):Promise<TrackMap>
  
  on<
    T extends keyof IPluginClientEventArgs
  >(
      type:T,
      handler:IPluginClientEventArgs[T] 
  ):void
  
  off<T extends keyof IPluginClientEventArgs>(
    type:T,
    handler?:IPluginClientEventArgs[T]
  ):void
}

export interface IPluginComponentProps {
  client:IPluginClient
  
  width:number
  
  height:number
}


export interface IPluginComponentManager {
  getManifest():PluginManifest
  
  
  
  getOverlayCommonSettings(componentId: string)
      :PluginComponentDefinition_OverlayCommonSettings
  
  getOverlayIRacingSettings(componentId: string)
      :PluginComponentDefinition_OverlayIRSettings
  
  setOverlayComponent(
      id: string,
      ComponentType: React.ComponentType<IPluginComponentProps>
  ):void
  
  removeOverlayComponent( 
      id:string
  ):void
}

export type IPluginComponentFactory = (
    manifest:PluginManifest,
    componentManager:IPluginComponentManager,
    serviceContainer:Container
) => Promise<void>

const PluginInitFactory:IPluginComponentFactory = async function PluginInitFactory(
    manifest:PluginManifest,
    componentManager:IPluginComponentManager,
    serviceContainer:Container
) {
  // ... do all init & setup here, etc
  componentManager.setOverlayComponent(
      "leaderboard-overlay", 
      function(props: IPluginComponentProps) {
        return <>content goes here</>
      })
}



```

## Components

### Overlay (`PLUGIN_COMPONENT_TYPE_OVERLAY`)

An always on top, optional transparent window, which is available in both
`OpenXR` HMD(s) and/or your standard monitor.

More to come ...

