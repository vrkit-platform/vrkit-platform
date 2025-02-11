import React from "react"
import { AppBar, AppBarProps, Box, styled, Toolbar, toolbarClasses, useTheme } from "@mui/material"
import clsx from "clsx"
import {
  alpha,
  child,
  createClassNames,
  Ellipsis,
  Fill,
  FillHeight,
  FillWidth,
  flex,
  flexAlign,
  FlexAuto,
  FlexColumn,
  FlexDefaults,
  FlexRow,
  FlexRowCenter,
  FlexScaleZero,
  getContrastText,
  hasCls,
  heightConstraint,
  OverflowHidden,
  padding,
  PositionRelative
} from "@vrkit-platform/shared-ui"
import { GlobalCSSClassNames, isNotEmptyString } from "../../renderer-constants"
import { usePageMetadata } from "../page"
import { Logo } from "../../components/logo"
import AppTitlebarTrafficLights, { TrafficLightType } from "./traffic-lights"
import { useLocation } from "react-router-dom"
import { asOption } from "@3fv/prelude-ts"
import { WebRootPath } from "../../routes/WebPaths"
import { capitalize } from "lodash"
import { isDefined, isString } from "@3fv/guard"
import ElectronDraggableSpacer from "./ElectronDraggableSpacer"

export interface AppTitlebarOverrides {
  left?: React.ReactNode

  center?: React.ReactNode

  right?: React.ReactNode
  
  lightsEnabled?: Partial<Record<TrafficLightType, boolean>>
}

export interface AppTitlebarProps extends AppBarProps {
  transparent?: boolean
}

const AppToolbarRoot = styled(Toolbar)(({ theme }) => ({
  [`&.${toolbarClasses.root}`]: {
    ...Fill,
    ...PositionRelative,
    ...FlexRow,
    ...flexAlign("stretch", "stretch"),
    paddingRight: theme.spacing(1),
    paddingLeft: theme.spacing(1),
    color: getContrastText(theme.palette.background.appBar)
  }
}))

const appTitlebarClassPrefix = "AppTitlebar"
const appTitlebarClasses = createClassNames(
  appTitlebarClassPrefix,
  "root",
  "transparent",
  "top",
  "bottom",
  "left",
  "center",
  "right",
  "title"
)

const AppTitlebarRoot = styled<typeof AppBar>(AppBar)(({ theme }) => ({
  [hasCls(appTitlebarClasses.root)]: {
    color: "inherit",
    zIndex: theme.zIndex.drawer + 1,
    ...FlexAuto,
    ...FlexColumn,
    ...FlexDefaults.stretch,
    ...FillWidth,
    ...OverflowHidden,
    ...PositionRelative,
    [hasCls(appTitlebarClasses.transparent)]: {
      backgroundColor: "transparent",
      [child(appTitlebarClasses.top)]: {
        backgroundColor: "transparent",
        backgroundImage: "none",
        [child([appTitlebarClasses.left, appTitlebarClasses.right])]: {
          flex: "1 1 auto",
        }
      }
    },
    [`&:not(.${appTitlebarClasses.transparent})`]: {
      filter: `drop-shadow(0 0 0.25rem ${theme.palette.background.session})`,
      backgroundColor: theme.palette.background.appBar,
      [child(appTitlebarClasses.top)]: {
        backgroundColor: theme.palette.background.appBar,
        backgroundImage: theme.palette.background.appBarGradient,
        
        [child([appTitlebarClasses.left, appTitlebarClasses.right])]: {
          flex: "0 0 340px",
          
        }
      }
    },
    
    [child(appTitlebarClasses.top)]: {
      ...heightConstraint(theme.dimen.appBarHeight),
      ...FlexRowCenter,
      ...FillWidth,
      ...OverflowHidden,
      [child([appTitlebarClasses.left, appTitlebarClasses.right])]: {
        ...FillHeight,
        ...FlexAuto,
        ...FlexRow,
        ...OverflowHidden,
        ...PositionRelative,
        alignItems: "stretch",

        [hasCls(appTitlebarClasses.right)]: {
          ...flexAlign("center", "flex-end")
        },
        [hasCls(appTitlebarClasses.left)]: {
          ...flexAlign("center", "flex-start"),
          // overflowX: "visible"
        },

        [child(appTitlebarClasses.title)]: {
          // overflowY:"hidden",
          // overflowX: "visible",
          ...OverflowHidden,
          ...flex(0, 0, "auto"),
          ...Ellipsis,
          ...padding(0, theme.spacing(1)),
          ...theme.typography.titleBar,
          color: alpha(theme.palette.text.primary, 0.5),
          alignSelf: "center"
        }
      },
      [child([appTitlebarClasses.center])]: {
        ...FlexScaleZero, //...FlexAuto,
        ...FlexRow,
        ...OverflowHidden,
        ...PositionRelative,
        ...flexAlign("stretch", "stretch"),
        height: "auto"
      }
    },
    [child(appTitlebarClasses.bottom)]: {
      ...FillWidth, // ...PositionRelative,
      ...OverflowHidden
    }
  }
}))

export function AppTitlebar({ className, transparent = false, ...other }: AppTitlebarProps) {
  const pageMetadata = usePageMetadata(),
    { appTitlebar } = pageMetadata,
    loc = useLocation(),
    title = asOption(pageMetadata.title)
        .filter(isDefined)
        .orCall(() => asOption(loc.pathname.split("/").filter(x => isNotEmptyString(x)))
      .mapIf(
        parts => parts[0] === WebRootPath.main,
        (parts: string[]) => parts.slice(1)
      )
      .map(parts => capitalize(parts[0])))
      .getOrElse(null),
      
    theme = useTheme()

  return (
    <AppTitlebarRoot
      className={clsx(appTitlebarClasses.root, {
        [appTitlebarClasses.transparent]: transparent
      },className)}
      elevation={0}
      {...other}
    >
      <Box className={appTitlebarClasses.top}>
        <AppToolbarRoot>
          <Box className={clsx(appTitlebarClasses.left, GlobalCSSClassNames.electronWindowDraggable)}>
            <Logo />
            <If condition={isDefined(title)}>
              {!isString(title) ? title : <Box className={clsx(appTitlebarClasses.title, GlobalCSSClassNames.electronWindowDraggable)}>
                {title}
              </Box>}
            </If>
            <ElectronDraggableSpacer />
          </Box>
          <Box className={clsx(appTitlebarClasses.center)}>
            <ElectronDraggableSpacer />
            <If condition={!!appTitlebar?.center}>{appTitlebar?.center}</If>
            
            <ElectronDraggableSpacer />
          </Box>
          <Box className={clsx(appTitlebarClasses.right)}>
            <ElectronDraggableSpacer />
            <AppTitlebarTrafficLights lightsEnabled={appTitlebar?.lightsEnabled ?? {}}/>
          </Box>
        </AppToolbarRoot>
      </Box>

      {/*<AppSessionPlayerControlPanel className={appTitlebarClasses.bottom} />*/}
    </AppTitlebarRoot>
  )
}

export default AppTitlebar
