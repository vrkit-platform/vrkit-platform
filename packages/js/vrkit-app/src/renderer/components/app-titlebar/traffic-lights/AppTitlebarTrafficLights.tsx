// REACT
import React, { useCallback } from "react"

// CLSX
import clsx from "clsx"

// 3FV
import { getLogger } from "@3fv/logger-proxy"

import type { BoxProps } from "@mui/material/Box"
// MUI
import Box from "@mui/material/Box"
import { styled } from "@mui/material/styles"

// APP
import {
  alpha,
  child,
  ClassNamesKey,
  createClassNames,
  CssSelectors,
  hasCls,
  Transparent
} from "@vrkit-platform/shared-ui"
import Tooltip from "@mui/material/Tooltip"
import { capitalize, uniq } from "lodash"
import { faWindowClose, faWindowMaximize, faWindowMinimize } from "@awesome.me/kit-79150a3eed/icons/sharp/light"
import CloseIcon from "@mui/icons-material/CloseSharp"
import MinimizeIcon from "@mui/icons-material/MinimizeSharp"
import MaximizeIcon from "@mui/icons-material/CropSquareSharp"
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core"
import { ipcRenderer } from "electron"
import { defaults, DesktopWindowTrafficLight, ElectronIPCChannel } from "@vrkit-platform/shared"
import { AppIconButton } from "../../app-icon-button"

const log = getLogger(__filename)
// @ts-ignore
const { info, debug, warn, error } = log

const classPrefix = "appTitlebarTrafficLights"
export const trafficLightsClasses = createClassNames(classPrefix, "root", "button", "minimize", "maximize", "close")
export type AppTitlebarTrafficLightsClassKey = ClassNamesKey<typeof trafficLightsClasses>

const AppTitlebarTrafficLightsRoot = styled(Box, {
  name: "AppTitlebarTrafficLightsRoot",
  label: "AppTitlebarTrafficLightsRoot"
})(({ theme: { spacing, transitions, typography, palette, shape, dimen } }) => ({
  // root styles here
  [hasCls(trafficLightsClasses.root)]: {
    // child styled here
    [child(trafficLightsClasses.button)]: {
      transition: transitions.create(["background", "background-color", "color"]),
      color: alpha(palette.text.primary, 0.8),
      backgroundColor: Transparent,
      borderRadius: shape.borderRadius,
      [CssSelectors.hover]: {
        backgroundColor: alpha("white", 0.1),
        color: palette.text.primary,
        [hasCls(trafficLightsClasses.minimize)]: {},
        [hasCls(trafficLightsClasses.maximize)]: {},
        [hasCls(trafficLightsClasses.close)]: {
          // color: palette.error.main,
        }
      }
    }
  }
}))

export type TrafficLightType = keyof typeof DesktopWindowTrafficLight

const TrafficLightsEnabledDefaults = uniq(Object.keys(DesktopWindowTrafficLight)).reduce(
  (map, light) => ({
    ...map,
    [light]: true
  }),
  {} as Partial<Record<TrafficLightType, boolean>>
)

export interface TrafficLightProps {
  variant: AppTitlebarTrafficLightsClassKey & `${DesktopWindowTrafficLight}`

  tooltip?: string

  icon: IconDefinition
}

const TrafficLight = ({ variant, tooltip = variant }: TrafficLightProps) => {
  log.assert(DesktopWindowTrafficLight[variant] === variant, `Unknown variant ${variant}`)
  const onClick = useCallback(
      (e: React.MouseEvent) => {
        ipcRenderer.send(ElectronIPCChannel.trafficLightTrigger, variant)
        e.preventDefault()
      },
      [variant]
    ),
    Icon = variant === "close" ? CloseIcon : variant === "minimize" ? MinimizeIcon : MaximizeIcon

  return (
    <Tooltip title={capitalize(tooltip)}>
      <AppIconButton
        className={clsx(trafficLightsClasses.button, trafficLightsClasses[variant], {
          [trafficLightsClasses.close]: variant === "close"
        })}
        onClick={onClick}
        size="medium"
      >
        <Icon fontSize={"small"} />
      </AppIconButton>
    </Tooltip>
  )
}

/**
 * AppTitlebarTrafficLights Component Properties
 */
export interface AppTitlebarTrafficLightsProps extends BoxProps {
  lightsEnabled?: Partial<Record<TrafficLightType, boolean>>
}

/**
 * AppTitlebarTrafficLights Component
 *
 * @param { AppTitlebarTrafficLightsProps } props
 */
export function AppTitlebarTrafficLights(props: AppTitlebarTrafficLightsProps) {
  const { className, lightsEnabled: lightsEnabledIn = {}, ...other } = props,
    lightsEnabled = defaults(
        { ...lightsEnabledIn },
        TrafficLightsEnabledDefaults
    )
  
  return (
    <AppTitlebarTrafficLightsRoot
      className={clsx(trafficLightsClasses.root, {}, className)}
      {...other}
    >
      <If condition={!VRKitWindowConfig.modal}>
        <If condition={lightsEnabled.minimize}>
          <TrafficLight
            variant={"minimize"}
            icon={faWindowMinimize}
          />
        </If>
        <If condition={lightsEnabled.maximize}>
          <TrafficLight
            variant={"maximize"}
            icon={faWindowMaximize}
          />
        </If>
      </If>
      <If condition={lightsEnabled.close}>
        <TrafficLight
          variant={"close"}
          icon={faWindowClose}
        />
      </If>
    </AppTitlebarTrafficLightsRoot>
  )
}

export default AppTitlebarTrafficLights
