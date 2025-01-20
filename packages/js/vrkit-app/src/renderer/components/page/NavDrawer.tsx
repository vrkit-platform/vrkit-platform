import Fab from "@mui/material/Fab"
import ExpandIcon from "@mui/icons-material/ArrowRight"
import CollapseIcon from "@mui/icons-material/ArrowLeft"
import { styled, useTheme } from "@mui/material/styles"
import clsx from "clsx"
import {
  alpha, child,
  createClassNames,
  CssSelectors,
  dimensionConstraints,
  flex,
  flexAlign,
  FlexColumn,
  FlexProperties,
  hasCls,
  OverflowHidden,
  PositionAbsolute,
  Transparent
} from "@vrkit-platform/shared-ui"
import AppDrawerMenu from "../app-drawer-menu"
import Drawer, { DrawerProps } from "@mui/material/Drawer"
import { useState } from "react"
import Tooltip from "@mui/material/Tooltip"

const navDrawerClassPrefix = "NavDrawer"
const navDrawerClasses = createClassNames(navDrawerClassPrefix, "root", "expanded", "pinButton")

const NavDrawerRoot = styled(Drawer)(({ theme }) => ({
  [hasCls(navDrawerClasses.root)]: {
    ...flex(0, 1, `50px`),
    ...FlexColumn,
    ...OverflowHidden,
    ...flexAlign("stretch", "stretch"),
    position: "relative",
    transition: theme.transitions.create([...FlexProperties]),
    filter: "drop-shadow(0px 2px 4px rgba(0,0,0, 0.25))",

    [`& .MuiDrawer-paper`]: {
      position: "relative"
    },

    [hasCls(navDrawerClasses.expanded)]: {
      ...flex(0, 1, "calc(min(300px,20vw))")
    },
    
    [child(navDrawerClasses.pinButton)]: {
      ...PositionAbsolute,
      ...dimensionConstraints(26),
      background: Transparent,
      bottom: 12,
      left: 12,
      //fontSize: rem(2),
      borderRadius: "50%",
      border: `1.5px solid transparent`,
      transition: theme.transitions.create(["border", "color"]),
      "& svg": {
        ...dimensionConstraints(20),
        transition: theme.transitions.create(["border", "color"]),
        color: alpha(theme.palette.text.primary, 0.25)
      },
      [CssSelectors.hover]: {
        border: `1.5px solid ${alpha(theme.palette.text.primary, 0.25)}`,
        background: Transparent,
        "& svg": {
          color: alpha(theme.palette.text.primary, 0.25)
        }
      }
    }
  }
}))

export interface NavDrawerProps extends DrawerProps {}

export function NavDrawer({ className, ...other }: NavDrawerProps) {
  const theme = useTheme(),
    [isExpanded, setIsExpanded] = useState(false),
    [pinned, setPinned] = useState(false),
    toggleDrawer = (newOpen: boolean) => () => {
      setIsExpanded(newOpen)
    }
  return (
    <NavDrawerRoot
      variant="permanent"
      open
      onMouseOver={() => {
        setIsExpanded(true)
      }}
      onMouseLeave={() => {
        setIsExpanded(false)
      }}
      className={clsx(navDrawerClasses.root, {
        [navDrawerClasses.expanded]: isExpanded || pinned
      })}
      onClose={toggleDrawer(false)}
      {...other}
    >
      <AppDrawerMenu />
      <Tooltip title={pinned ? "Unpin drawer" : "Pin drawer"}>
        <Fab
          onClick={() => setPinned(pinned => !pinned)}
          aria-label={pinned ? "Unpin drawer" : "Pin drawer"}
          color="primary"
          variant="soft"
          size="small"
          className={clsx(navDrawerClasses.pinButton)}

        >
          {pinned ? <CollapseIcon /> : <ExpandIcon />}
        </Fab>
      </Tooltip>
    </NavDrawerRoot>
  )
}

export default NavDrawer
