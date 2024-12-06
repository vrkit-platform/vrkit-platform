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

export interface AppBarContentOverrides {
  left?: React.ReactNode

  center?: React.ReactNode

  right?: React.ReactNode
}

export interface MainAppBarProps extends AppBarProps {}

const MainToolbarRoot = styled(Toolbar)(({ theme }) => ({
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

const mainAppBarClassPrefix = "MainAppBar"
const mainAppBarClasses = createClassNames(mainAppBarClassPrefix, "root", "top", "bottom", "left", "center", "right")

const MainAppBarRoot = styled<typeof AppBar>(AppBar)(({ theme }) => ({
  [hasCls(mainAppBarClasses.root)]: {
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
    [child(mainAppBarClasses.top)]: {
      ...FlexRowCenter,
      ...FillWidth,
      ...OverflowHidden,
      backgroundColor: theme.palette.background.appBar,
      backgroundImage: theme.palette.background.appBarGradient,
      [child([mainAppBarClasses.left, mainAppBarClasses.right])]: {
        ...FillHeight,
        ...FlexAuto,
        ...FlexRow,
        ...OverflowHidden,
        ...PositionRelative,
        flex: "0 0 auto",
        minWidth: "15%",
        alignItems: "stretch",

        [hasCls(mainAppBarClasses.right)]: {
          ...flexAlign("center", "flex-end")
        },
        [hasCls(mainAppBarClasses.left)]: {
          ...flexAlign("center", "flex-start")
        }
      },
      [child([mainAppBarClasses.center])]: {
        ...FlexScaleZero, //...FlexAuto,
        ...FlexRow,
        ...OverflowHidden,
        ...PositionRelative,
        ...flexAlign("stretch", "stretch"),
        height: "auto"
      }
    },
    [child(mainAppBarClasses.bottom)]: {
      ...FillWidth, // ...PositionRelative,
      ...OverflowHidden
    }
  }
}))

function MainAppBar({ className, ...other }: MainAppBarProps) {
  const pageMetadata = usePageMetadata(),
    { SectionProps = {}, section, appBar } = pageMetadata,
    theme = useTheme(),
    appBarHeight = appBar?.height ?? theme.dimen.appBarHeight,
    activeDashboardConfig = useAppSelector(sharedAppSelectors.selectActiveDashboardConfig),
    isLiveAvailable = useAppSelector(sharedAppSelectors.isLiveSessionAvailable)

  return (
    <MainAppBarRoot
      className={clsx(mainAppBarClasses.root, className)}
      elevation={0}
      {...other}
    >
      <Box
        className={mainAppBarClasses.top}
        sx={{
          ...heightConstraint(appBarHeight)
        }}
      >
        <MainToolbarRoot>
          <Box className={clsx(mainAppBarClasses.left, GlobalCSSClassNames.electronWindowDraggable)}>
            <Logo />
          </Box>
          <Box className={clsx(mainAppBarClasses.center, GlobalCSSClassNames.electronWindowDraggable)}>
            {appBar?.content?.center}
          </Box>
          <Box className={clsx(mainAppBarClasses.right)}>
            <ActiveDashboardConfigWidget />
          </Box>
        </MainToolbarRoot>
      </Box>

      <SessionPlayerControlBar className={mainAppBarClasses.bottom} />
    </MainAppBarRoot>
  )
}

export default MainAppBar
