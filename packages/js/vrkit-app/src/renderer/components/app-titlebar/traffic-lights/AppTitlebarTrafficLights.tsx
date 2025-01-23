// REACT
import React, { useCallback } from "react"

// CLSX
import clsx from "clsx"

// 3FV
import { getLogger } from "@3fv/logger-proxy"

// MUI
import Box from "@mui/material/Box"
import type {BoxProps} from "@mui/material/Box"
import { styled } from "@mui/material/styles"

// APP
import {
  ClassNamesKey,
  createClassNames,
  dimensionConstraints,
  child,
  hasCls,
  CssSelectors,
  Transparent, alpha
} from "@vrkit-platform/shared-ui"
import Button from "@mui/material/Button"
import Tooltip from "@mui/material/Tooltip"
import { capitalize } from "lodash"
import { faWindowMaximize, faWindowMinimize, faWindowClose } from "@awesome.me/kit-79150a3eed/icons/sharp/light"
import CloseIcon from "@mui/icons-material/CloseSharp"
import MinimizeIcon from "@mui/icons-material/MinimizeSharp"
import MaximizeIcon from "@mui/icons-material/CropSquareSharp"
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core"
import { ipcRenderer } from "electron"
import { DesktopWindowTrafficLight, ElectronIPCChannel } from "@vrkit-platform/shared"
import { AppIconButton } from "../../app-icon-button"
import { AppFAIcon } from "../../app-icon"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const classPrefix = "appTitlebarTrafficLights"
export const trafficLightsClasses = createClassNames(classPrefix, "root", "button", "minimize", "maximize", "close")
export type AppTitlebarTrafficLightsClassKey = ClassNamesKey<typeof trafficLightsClasses>


const AppTitlebarTrafficLightsRoot = styled(Box, {
  name: "AppTitlebarTrafficLightsRoot",
  label: "AppTitlebarTrafficLightsRoot"
})(({theme:{spacing,transitions,typography, palette,shape,dimen}}) => ({
  // root styles here
  [hasCls(trafficLightsClasses.root)]: {
    // child styled here
    [child(trafficLightsClasses.button)]: {
      transition: transitions.create(["background","background-color","color"]),
      color: alpha(palette.text.primary,0.8),
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

interface TrafficLightProps {
  variant: AppTitlebarTrafficLightsClassKey & ("minimize" | "maximize" | "close") & `${DesktopWindowTrafficLight}`
  
  tooltip?: string
  icon: IconDefinition
}

const TrafficLight = ({variant, tooltip = variant}: TrafficLightProps) => {
  log.assert(DesktopWindowTrafficLight[variant] === variant, `Unknown variant ${variant}`)
  const onClick = useCallback((e: React.MouseEvent) => {
    ipcRenderer.send(ElectronIPCChannel.trafficLightTrigger, variant)
    e.preventDefault()
  }, [variant]),
      Icon = variant === "close" ? CloseIcon :
          variant === "minimize" ? MinimizeIcon :
              MaximizeIcon
  
  return (
    <Tooltip title={capitalize(tooltip)}>
      <AppIconButton
        className={clsx(trafficLightsClasses.button, trafficLightsClasses[variant], {
          [trafficLightsClasses.close]: variant === "close"
        })}
        onClick={onClick}
        size="medium"
        
      >
        <Icon
          fontSize={"small"}
        />
      </AppIconButton>
    </Tooltip>
  )
}

/**
 * AppTitlebarTrafficLights Component Properties
 */
export interface AppTitlebarTrafficLightsProps extends BoxProps {

}


/**
 * AppTitlebarTrafficLights Component
 *
 * @param { AppTitlebarTrafficLightsProps } props
 */
export function AppTitlebarTrafficLights(props:AppTitlebarTrafficLightsProps) {
  const { className, ...other } = props
  
  return <AppTitlebarTrafficLightsRoot
    className={clsx(trafficLightsClasses.root, {}, className)}
    {...other}
  >
    <If condition={!VRKitWindowConfig.modal}>
      <TrafficLight variant={"minimize"} icon={faWindowMinimize}/>
      <TrafficLight variant={"maximize"} icon={faWindowMaximize}/>
    </If>
    <TrafficLight variant={"close"} icon={faWindowClose}/>
  </AppTitlebarTrafficLightsRoot>
}

export default AppTitlebarTrafficLights
