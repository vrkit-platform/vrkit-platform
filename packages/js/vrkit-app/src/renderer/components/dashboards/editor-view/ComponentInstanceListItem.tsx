// REACT
import React, { SyntheticEvent } from "react"

// CLSX
import clsx from "clsx"

// 3FV
import { getLogger } from "@3fv/logger-proxy"

// MUI
import Box, { BoxProps } from "@mui/material/Box"
import { darken, lighten, styled, useTheme } from "@mui/material/styles"

import { faEdit, faEllipsisVertical, faRocketLaunch, faTrash } from "@awesome.me/kit-79150a3eed/icons/sharp/solid"

// APP
import {
  alpha,
  child,
  ClassNamesKey,
  createClassNames,
  CursorPointer,
  dimensionConstraints,
  Ellipsis,
  Fill,
  FillBounds,
  FillWidth,
  flex,
  flexAlign,
  FlexAuto,
  FlexColumn,
  FlexColumnBox,
  FlexProperties,
  FlexRow,
  FlexRowBox,
  FlexRowCenter,
  FlexScaleZero,
  hasCls,
  heightConstraint,
  HeightProperties,
  linearGradient,
  notHasCls,
  OverflowHidden,
  OverflowVisible,
  padding,
  PositionAbsolute,
  PositionRelative,
  rem, transition
} from "@vrkit-platform/shared-ui"
import { PluginCompEntry } from "../../../services/store/slices/shared-app"
import Paper from "@mui/material/Paper"
import { AsyncImage } from "../../async-image"
import { OverlayInfo } from "@vrkit-platform/models"
import { createShadow } from "../../../theme/styles"
import ComponentInstanceForm from "./ComponentInstanceForm"
import { dashboardsListViewClasses } from "../list-view"
import { AppFAIcon } from "../../app-icon"
import AppIconButton from "../../app-icon-button"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const classPrefix = "componentInstanceListItem"
export const componentInstanceListItemClasses = createClassNames(
    classPrefix,
    "root",
    "selected",
    "itemPaper",
    "itemSelected",
    "header",
    "headerBox",
    "headerIcon",
    "headerTitle",
    "headerSubheader",
        "headerActions",
        "headerAction",
    "content"
  ),
  classes = componentInstanceListItemClasses
export type ComponentInstanceListItemClassKey = ClassNamesKey<typeof componentInstanceListItemClasses>

const ComponentInstanceListItemRoot = styled(Box, {
  name: "ComponentInstanceListItemRoot",
  label: "ComponentInstanceListItemRoot"
})(({ theme: { palette, spacing, shape, shadows, insetShadows, dimen, typography, transitions, customShadows } }) => ({
  // root styles here
  [hasCls(classes.root)]: {
    ...FlexRowCenter,
    ...OverflowHidden,
    ...PositionRelative,
    ...flexAlign("flex-start", "flex-start"),
    
    
    
    [`&:nth-of-type(odd) .${classes.itemPaper}::before`]: {
      backgroundImage: linearGradient(
          "to bottom",
          `${lighten(palette.background.paper, 0.03)} 0%`,
          `${lighten(palette.background.paper, 0.04)} 98%`,
          `${lighten(palette.background.paper, 0.1)} 100%`
      ),
    },
    [`&:nth-of-type(even) .${classes.itemPaper}::before`]: {
      backgroundImage: linearGradient(
          "to bottom",
          `${darken(palette.background.paper, 0.13)} 0%`,
          `${darken(palette.background.paper, 0.14)} 98%`,
          `${darken(palette.background.paper, 0.2)} 100%`
      ),
    },
    [child(classes.itemPaper)]: {
      ...FlexColumn,
      ...FillWidth,
      ...OverflowHidden,
      ...PositionRelative,
      ...flexAlign("stretch", "stretch"),
      transition: transitions.create(["max-height"], {duration: "500ms"}),
      height: "auto",
      maxHeight: 9999,
      borderRadius: 0,
      padding: 0,
      // gap: spacing(1),
      textDecoration: "none",
      // transition: transitions.create([...HeightProperties, ...FlexProperties]),
      "&::before": {
        transition: transitions.create(["background-image", "box-shadow"]),
        ...PositionAbsolute,
        ...FillBounds,
        content: "' '",
        boxShadow: "none",
      },
      "&.first, &.first::before": {
        borderTopLeftRadius: shape.borderRadius * 2,
        borderTopRightRadius: shape.borderRadius * 2
      },
      "&:not(.first)": {},
      "&:not(.last)": {
      
      },
      "&.last, &.last::before": {
        borderBottomLeftRadius: shape.borderRadius * 2,
        borderBottomRightRadius: shape.borderRadius * 2
      },

      
      [child(classes.header)]: {
        ...padding(spacing(1)),
        ...FlexRow,
        ...flexAlign("center", "stretch"),
        ...FlexAuto,
        overflowY: "visible",
        gap: spacing(1.5),
        
        zIndex: 3,
        [child(classes.headerIcon)]: {
          ...dimensionConstraints(rem(2)),
          "& img, & svg ": {
            color: palette.primary.contrastText,
            fill: palette.primary.contrastText
          },

          ...FlexRowCenter,
          ...FlexAuto
        },
        [child(classes.headerBox)]: {
          ...FlexColumn,
          ...FlexScaleZero,
          ...flexAlign("stretch", "flex-start"),

          [child(classes.headerTitle)]: {
            ...Ellipsis,
            ...FlexAuto,
            ...typography.h4
          },
          [child(classes.headerSubheader)]: {
            ...Ellipsis,
            ...FlexAuto,
            ...typography.subtitle1,
            fontWeight: 100,
            opacity: 0.25,
            letterSpacing: 0.9
          }
        },
        [child(classes.headerActions)]: {
          ...FlexRowCenter,
          [child(classes.headerAction)]: {
            ...transition(["opacity", "color"]),
            ...FlexAuto,
            color: palette.primary.contrastText,
            opacity: 0.5,
            transform: "scale(0.85) translateY(-4px)",
            alignSelf: "flex-start",
            "&:hover": {
              opacity: 1,
              "&.delete": {
                color: palette.error.main
              },
            }
          }
        }
      },
      [child(classes.content)]: {
        ...OverflowHidden
      },
      [notHasCls(classes.itemSelected)]: {
        maxHeight: 70
      },
      [hasCls(classes.itemSelected)]: {
        [child(classes.content)]: {
        },
        "&::before": {
          backgroundImage: linearGradient(
              "to bottom",
              `${alpha(palette.action.selected, 1)} 0%`,
              `${alpha(palette.action.selected, 0.85)} 98%`,
              `${alpha(palette.action.selected, 0.1)} 100%`
          ),
        }
        
      },
      
    },
    [notHasCls(classes.selected)]: {
    
    }
  }
}))

/**
 * ComponentInstanceListItem Component Properties
 */
export interface ComponentInstanceListItemProps extends Omit<BoxProps, "onChange"> {
  overlayInfo: OverlayInfo

  compEntry: PluginCompEntry

  selected?: boolean

  actions?: React.ReactNode
  
  onDelete: (id: string) => void
  onChange: (id: string, patch: Partial<OverlayInfo>) => void
}

/**
 * ComponentInstanceListItem Component
 *
 * @param { ComponentInstanceListItemProps } props
 */
export function ComponentInstanceListItem(props: ComponentInstanceListItemProps) {
  const {
      className,
      compEntry,
      selected: isSelected = false,
      overlayInfo,
      onChange,
      onDelete,
      actions,
      onClick,
      sx = {},
      ...other
    } = props,
      [manifest, componentDef] = compEntry,
    theme = useTheme()

  return (
    <ComponentInstanceListItemRoot
      className={clsx(classes.root, {
        [classes.selected]: isSelected
      })}
      sx={{
        ...sx
      }}
      onClick={onClick}
      {...other}
    >
      <Paper
        className={clsx(
          classes.itemPaper,
          {
            [classes.itemSelected]: isSelected
          },
          className
        )}
      >
        <FlexRowBox
          className={classes.header}
          sx={{
            ...(onClick && CursorPointer)
          }}
        >
          <Box className={clsx(classes.headerIcon)}>
            <AsyncImage
              src={componentDef?.uiResource?.icon?.url}
              unpackIfPossible
            />
          </Box>
          <Box className={classes.headerBox}>
            <Box className={classes.headerTitle}>{overlayInfo.name}</Box>
            <Box className={classes.headerSubheader}>
              {componentDef.name} &bull; {manifest.name}
            </Box>
          </Box>
          <Box className={classes.headerActions}>
            <AppIconButton
              tooltip="Delete overlay configuration from this dashboard"
              className={clsx(classes.headerAction, "delete")}
              onClick={(ev: SyntheticEvent) => {
                ev.preventDefault()
                ev.stopPropagation()
                onDelete(overlayInfo.id)
                return false
              }}
            >
              <AppFAIcon
                size="2xs"
                icon={faTrash}
              />
            </AppIconButton>
          </Box>
        </FlexRowBox>

        <ComponentInstanceForm
          selected={isSelected}
          overlayInfo={overlayInfo}
          compEntry={compEntry}
          className={classes.content}
          onChange={onChange}
        />
      </Paper>
    </ComponentInstanceListItemRoot>
  )
}

export default ComponentInstanceListItem
