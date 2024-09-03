import React from "react"
import {
  AppBar,
  Box,
  styled,
  Toolbar,
  toolbarClasses,
  useTheme
} from "@mui/material"
// import {
//   child,
//   createClassNames,
//   Ellipsis, Fill,
//   FillHeight,
//   FillWidth,
//   FlexAuto,
//   FlexDefaults,
//   FlexRow,
//   FlexRowCenter,
//   FlexScaleZero,
//   getContrastText,
//   hasCls,
//   flexAlign,
//   heightConstraint,
//   OverflowHidden,
//   PositionRelative
// } from "@taskx/lib-styles"
// import { usePageMetadata } from "../../page/metadata"
// import { AppMainMenu } from "../../app-menu"
// import { ReactChildren } from "../../../types"
import clsx from "clsx"
import {
  child,
  createClassNames,
  Ellipsis,
  Fill,
  FillHeight,
  FillWidth,
  flexAlign,
  FlexAuto,
  FlexDefaults,
  FlexRow,
  FlexScaleZero,
  getContrastText,
  hasCls,
  heightConstraint,
  OverflowHidden, PositionAbsolute,
  PositionRelative
} from "../../styles"
import { GlobalCSSClassNames } from "vrkit-app-renderer/constants"
import { usePageMetadata } from "../../components/page-metadata"
import {
  sessionManagerSelectors
} from "../../services/store/slices/session-manager"
import { useAppSelector } from "vrkit-app-renderer/services/store"
import { Logo } from "../../components/logo"
// import { useIsFullScreen } from "../../../hooks"


export interface AppBarContentOverrides {
  left?: React.ReactNode

  center?: React.ReactNode

  right?: React.ReactNode
}

export interface MainAppBarProps {}
//
// /**
//  * Title component for adding text/title to appBar
//  */
// const AppBarTitle = styled<typeof Box>(Box)(({ theme }) => ({
//   ...FlexScaleZero,
//   ...Ellipsis,
//   alignSelf: "center",
//   justifySelf: "center",
//   paddingLeft: 0, // lineHeight: 1,
//   // fontSize: rem(0.8),
//   ...theme.typography.h4, // typography: "h3",
//   fontWeight: 100,
//   opacity: 0.7
// }))

const MainToolbarRoot = styled(Toolbar)(({ theme }) => ({
  [`&.${toolbarClasses.root}`]: {
    // ...makeHeightConstraint(theme.dimen.appBarHeight),
    ...Fill,
    ...PositionRelative,
    ...FlexRow,
    ...flexAlign("stretch", "stretch"),
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(2),
    paddingRight: theme.spacing(1),
    paddingLeft: theme.spacing(1),
    backgroundColor: theme.palette.background.appBar,
    backgroundImage: theme.palette.background.appBarGradient,
    color: getContrastText(theme.palette.background.appBar)
  }
}))

const mainAppBarClassPrefix = "MainAppBar"
const mainAppBarClasses = createClassNames(
  mainAppBarClassPrefix,
  "isFullscreen",
  "left",
  "center",
  "right"
)

const MainAppBarRoot = styled<typeof AppBar>(AppBar)(({ theme }) => ({
  backgroundColor: "transparent",
  color: "inherit",
  flex: "1 1 0",
  ...FlexRow,
  ...FlexDefaults.stretch,
  ...FillWidth, // ...PositionRelative,
  ...OverflowHidden,
  ...PositionAbsolute,
  borderTopLeftRadius: "1rem",
  borderTopRightRadius: "1rem",
  // borderRadius: "3rem",
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
      ...flexAlign("center", "flex-start"),
    }
  },
  [child([mainAppBarClasses.center])]: {
    ...FlexScaleZero, //...FlexAuto,
    ...FlexRow,
    ...OverflowHidden,
    ...PositionRelative,
    ...flexAlign("stretch", "stretch"), // maxWidth: "50%",
    // ...makeWidthConstraint("50%"),
    height: "auto"
  }
}))

function MainAppBar(props: MainAppBarProps) {
  const pageMetadata = usePageMetadata(),
    { SectionProps = {}, section, appBar } = pageMetadata,
    theme = useTheme(),
    appBarHeight = appBar?.height ?? theme.dimen.appBarHeight,
    isLiveAvailable = useAppSelector(sessionManagerSelectors.isLiveSessionConnected)
    
  return (
    <MainAppBarRoot
      style={{
        ...heightConstraint(appBarHeight)
      }}
      className={clsx(
        GlobalCSSClassNames.electronWindowDraggable)}
      elevation={4}
    >
      <MainToolbarRoot>
        <Box
          className={clsx(
            mainAppBarClasses.left,
            GlobalCSSClassNames.electronWindowDraggable,
            // {
            //   // [mainAppBarClasses.isFullscreen]: isFullScreen
            // }
          )}
        >
          <Logo />
        </Box>
        <Box
          className={clsx(
            mainAppBarClasses.center,
            // GlobalCSSClassNames.electronWindowDraggable
          )}
        >
          {/*Platform: {process.env.TARGET_PLATFORM}*/}
          {appBar?.content?.center}
        </Box>
        <Box
          className={clsx(
            mainAppBarClasses.right,
            // GlobalCSSClassNames.electronWindowDraggable
          )}
        >
          {appBar?.content?.right}
          {isLiveAvailable ? "LIVE" : "NOT LIVE"}
          {/*{isElectron && <AppMainMenu />}*/}
        </Box>
      </MainToolbarRoot>
    </MainAppBarRoot>
  )
}

export default MainAppBar
