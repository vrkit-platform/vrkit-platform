import React from "react"
import { AppBar, AppBarProps, Box, styled, Toolbar, toolbarClasses, useTheme } from "@mui/material"
import clsx from "clsx"
import {
  child,
  createClassNames,
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
  PositionRelative
} from "vrkit-shared-ui"
import { GlobalCSSClassNames } from "../../renderer-constants"
import { usePageMetadata } from "../../components/page-metadata"

import { useAppSelector } from "vrkit-app-renderer/services/store"
import { Logo } from "../../components/logo"
import { sharedAppSelectors } from "vrkit-app-renderer/services/store/slices/shared-app"
import ActiveDashboardConfigWidget from "vrkit-app-renderer/components/active-dashboard-config-widget"
import { SessionPlayerControlBar } from "../../components/session-player-controls"

// import { useIsFullScreen } from "../../../hooks"

export interface AppTitlebarOverrides {
  left?: React.ReactNode
  
  center?: React.ReactNode
  
  right?: React.ReactNode
}

export interface AppTitlebarProps extends AppBarProps {}

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
const appTitlebarClasses = createClassNames(appTitlebarClassPrefix, "root", "top", "bottom", "left", "center", "right")

const AppTitlebarRoot = styled<typeof AppBar>(AppBar)(({ theme }) => ({
  [hasCls(appTitlebarClasses.root)]: {
    backgroundColor: theme.palette.background.appBar,
    
    // backgroundColor: "transparent !important",
    // backgroundImage: "none",
    // boxShadow: "0px 3px 5px -1px rgba(0, 0, 0, 0.2), " +
    //     "0px 5px 8px 0px rgba(0, 0, 0, 0.14), " +
    //     "0px 3px 14px 2px rgba(0,0, 0, 0.22)",
    boxShadow: theme.shadows[4],
    color: "inherit",
    zIndex: theme.zIndex.drawer + 1,
    filter: `drop-shadow(0 0 0.75rem ${theme.palette.background.session})`,
    ...FlexAuto,
    ...FlexColumn,
    ...FlexDefaults.stretch,
    ...FillWidth,
    ...OverflowHidden,
    ...PositionRelative,
    [child(appTitlebarClasses.top)]: {
      ...FlexRowCenter,
      ...FillWidth,
      ...OverflowHidden,
      backgroundColor: theme.palette.background.appBar,
      backgroundImage: theme.palette.background.appBarGradient,
      [child([appTitlebarClasses.left, appTitlebarClasses.right])]: {
        ...FillHeight,
        ...FlexAuto,
        ...FlexRow,
        ...OverflowHidden,
        ...PositionRelative,
        flex: "0 0 auto",
        minWidth: "15%",
        alignItems: "stretch",
        
        [hasCls(appTitlebarClasses.right)]: {
          ...flexAlign("center", "flex-end")
        },
        [hasCls(appTitlebarClasses.left)]: {
          ...flexAlign("center", "flex-start")
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

export function AppTitlebar({ className, ...other }: AppTitlebarProps) {
  const pageMetadata = usePageMetadata(),
      { appTitlebar } = pageMetadata,
      theme = useTheme(),
      appBarHeight = theme.dimen.appBarHeight,
      activeDashboardConfig = useAppSelector(sharedAppSelectors.selectActiveDashboardConfig),
      isLiveAvailable = useAppSelector(sharedAppSelectors.isLiveSessionAvailable)
  
  return (
      <AppTitlebarRoot
          className={clsx(appTitlebarClasses.root, className)}
          elevation={0}
          {...other}
      >
        <Box
            className={appTitlebarClasses.top}
            sx={{
              ...heightConstraint(appBarHeight)
            }}
        >
          <AppToolbarRoot>
            <Box className={clsx(appTitlebarClasses.left, GlobalCSSClassNames.electronWindowDraggable)}>
              <Logo />
            </Box>
            <Box className={clsx(appTitlebarClasses.center, GlobalCSSClassNames.electronWindowDraggable)}>
              {appTitlebar?.center}
            </Box>
            <Box className={clsx(appTitlebarClasses.right)}>
              {/*<ActiveDashboardConfigWidget />*/}
            </Box>
          </AppToolbarRoot>
        </Box>
        
        <SessionPlayerControlBar className={appTitlebarClasses.bottom} />
      </AppTitlebarRoot>
  )
}

export default AppTitlebar
