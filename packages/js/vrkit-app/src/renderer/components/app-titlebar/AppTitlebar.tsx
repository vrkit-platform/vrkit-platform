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
  FillWidth, flex,
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
import AppTitlebarTrafficLights from "./traffic-lights"
import { useLocation } from "react-router-dom"
import { asOption } from "@3fv/prelude-ts"
import { WebRootPath } from "../../routes/WebPaths"
import { capitalize } from "lodash"

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
const appTitlebarClasses = createClassNames(
  appTitlebarClassPrefix,
  "root",
  "top",
  "bottom",
  "left",
  "center",
  "right",
  "title"
)

const AppTitlebarRoot = styled<typeof AppBar>(AppBar)(({ theme }) => ({
  [hasCls(appTitlebarClasses.root)]: {
    backgroundColor: theme.palette.background.appBar, // boxShadow:
    // theme.shadows[1],
    color: "inherit",
    zIndex: theme.zIndex.drawer + 1,
    filter: `drop-shadow(0 0 0.25rem ${theme.palette.background.session})`,
    ...FlexAuto,
    ...FlexColumn,
    ...FlexDefaults.stretch,
    ...FillWidth,
    ...OverflowHidden,
    ...PositionRelative,
    [child(appTitlebarClasses.top)]: {
      ...heightConstraint(theme.dimen.appBarHeight),
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
        flex: "0 0 auto", // minWidth: "15%",
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
        height: "auto",
        [child(appTitlebarClasses.title)]: {
          ...OverflowHidden,
          ...flex(0,1,"auto"),
          ...Ellipsis,
          ...padding(0, theme.spacing(1)),
          ...theme.typography.titleBar,
          color: alpha(theme.palette.text.primary, 0.5),
          alignSelf: "center"
        }
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
    { appTitlebar, title } = pageMetadata,
    loc = useLocation(),
    defaultTitle = asOption(loc.pathname.split("/").filter(x => isNotEmptyString(x)))
      .mapIf(
        parts => parts[0] === WebRootPath.main,
        (parts: string[]) => parts.slice(1)
      )
      .map(parts => capitalize(parts[0]))
      .getOrElse(""),
    theme = useTheme()

  return (
    <AppTitlebarRoot
      className={clsx(appTitlebarClasses.root, className)}
      elevation={0}
      {...other}
    >
      <Box className={appTitlebarClasses.top}>
        <AppToolbarRoot>
          <Box className={clsx(appTitlebarClasses.left, GlobalCSSClassNames.electronWindowDraggable)}>
            <Logo />
          </Box>
          <Box
            className={clsx(appTitlebarClasses.center)}
          >
            <Box className={appTitlebarClasses.title}>{defaultTitle}</Box>
            <Box className={GlobalCSSClassNames.electronWindowDraggable}
              sx={{
                ...flex(1,5,0)
              }}
            />
            <If condition={!!appTitlebar?.center}>{appTitlebar?.center}</If>
            <If condition={!!title}>{title}</If>
            
            <Box className={GlobalCSSClassNames.electronWindowDraggable}
                 sx={{
                   ...flex(1,5,0)
                 }}
            />
          </Box>
          <Box className={clsx(appTitlebarClasses.right)}>
            <AppTitlebarTrafficLights />
          </Box>
        </AppToolbarRoot>
      </Box>

      {/*<AppSessionPlayerControlPanel className={appTitlebarClasses.bottom} />*/}
    </AppTitlebarRoot>
  )
}

export default AppTitlebar
