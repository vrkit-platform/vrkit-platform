
import type { BoxProps } from "@mui/material/Box"
import Fab from "@mui/material/Fab"
import ExpandIcon from "@mui/icons-material/ArrowRight"
import CollapseIcon from "@mui/icons-material/ArrowLeft"
import { styled } from "@mui/material/styles"
import clsx from "clsx"
import {
  createClassNames, dimensionConstraints,
  flex,
  flexAlign,
  FlexColumn,
  FlexProperties,
  FlexScaleZero,
  hasCls,
  OverflowAuto,
  OverflowHidden,
  PositionAbsolute,
  rem,
  Transparent
} from "@vrkit-platform/shared-ui"
import AppDrawerMenu from "../app-drawer-menu"
import Drawer, { DrawerProps } from "@mui/material/Drawer"
import { useState } from "react"

const appDrawerClassPrefix = "AppDrawer"
const appDrawerClasses = createClassNames(appDrawerClassPrefix, "root", "expanded")

const AppDrawerRoot = styled(Drawer)(({ theme }) => ({
  [hasCls(appDrawerClasses.root)]: {
    position: "relative",
    transition: theme.transitions.create([...FlexProperties]),
    ...flex(0, 1, `50px`),
    ...FlexColumn,
    ...OverflowHidden,
    ...flexAlign("stretch", "stretch"),
    filter: "drop-shadow(0px 2px 4px rgba(0,0,0, 0.25))",
    
    [`& .MuiDrawer-paper`]: {
      position: "relative"
    },
    
    [hasCls(appDrawerClasses.expanded)]: {
      ...flex(0, 1, "calc(min(300px,20vw))"),
    }
  }
}))

export interface AppDrawerProps extends DrawerProps {}

export function AppDrawer({ className, ...other }: AppDrawerProps) {
  const
    [isExpanded, setIsExpanded] = useState(false),
    [pinned, setPinned] = useState(false),
    toggleDrawer = (newOpen: boolean) => () => {
      setIsExpanded(newOpen)
    }
  return (
    <AppDrawerRoot
      variant="permanent"
      open
      onMouseOver={() => {
        setIsExpanded(true)
      }}
      onMouseLeave={() => {
        setIsExpanded(false)
      }}
      className={clsx(appDrawerClasses.root, {
        [appDrawerClasses.expanded]: isExpanded || pinned
      })}
      onClose={toggleDrawer(false)}
      
    >
      <AppDrawerMenu />
      <Fab
        onClick={() => setPinned(pinned => !pinned)}
        aria-label="Pin"
        color="primary"
        variant="soft"
        size="small"
        sx={{
          ...PositionAbsolute,
          background: Transparent,
          bottom: 5,
          left: 5,
          fontSize: rem(2),
          "& svg": {
            ...dimensionConstraints(20)
          }
        }}
      >
        {pinned ? <CollapseIcon/> : <ExpandIcon />}
      </Fab>
    </AppDrawerRoot>
  )
}

export default AppDrawer
