import React from "react"
import {
  AppBar,
  Box,
  styled,
  Toolbar,
  toolbarClasses,
  useTheme
} from "@mui/material"
import clsx from "clsx"
import {
  child,
  createClassNames,
  Ellipsis,
  Fill,
  FillHeight,
  FillWidth, flex,
  flexAlign,
  FlexAuto,
  FlexDefaults,
  FlexRow,
  FlexScaleZero,
  getContrastText,
  hasCls,
  heightConstraint,
  OverflowHidden,
  PositionAbsolute,
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
    // backgroundColor: theme.palette.background.appBar,
    // backgroundImage: theme.palette.background.appBarGradient,
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
  backgroundColor: "transparent !important",
  backgroundImage: "none",
  boxShadow: "none",
  color: "inherit",
  ...flex(1, 1, 0),
  ...FlexRow,
  ...FlexDefaults.stretch,
  ...FillWidth, // ...PositionRelative,
  ...OverflowHidden,
  ...PositionAbsolute,
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
    ...flexAlign("stretch", "stretch"),
    height: "auto"
  }
}))

function MainAppBar(props: MainAppBarProps) {
  const pageMetadata = usePageMetadata(),
    { SectionProps = {}, section, appBar } = pageMetadata,
    theme = useTheme(),
    appBarHeight = appBar?.height ?? theme.dimen.appBarHeight,
    isLiveAvailable = useAppSelector(sessionManagerSelectors.isLiveSessionAvailable)
    
  return (
    <MainAppBarRoot
      sx={{
        ...heightConstraint(appBarHeight)
      }}
      className={clsx(
        GlobalCSSClassNames.electronWindowDraggable)}
      elevation={0}
    >
      <MainToolbarRoot>
        <Box
          className={clsx(
            mainAppBarClasses.left,
            GlobalCSSClassNames.electronWindowDraggable,
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
          {appBar?.content?.center}
        </Box>
        <Box
          className={clsx(
            mainAppBarClasses.right,
          )}
        >
          {appBar?.content?.right}
         
        </Box>
      </MainToolbarRoot>
    </MainAppBarRoot>
  )
}

export default MainAppBar
