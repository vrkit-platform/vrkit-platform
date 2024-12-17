// REACT
import React from "react"

// CLSX
import clsx from "clsx"

// 3FV
import { getLogger } from "@3fv/logger-proxy"

// MUI
import Box, { BoxProps } from "@mui/material/Box"
import { darken, lighten, styled, useTheme } from "@mui/material/styles"

// APP
import {
  alpha, child,
  ClassNamesKey,
  createClassNames,
  CursorPointer,
  dimensionConstraints,
  Ellipsis,
  Fill,
  FillBounds,
  flex,
  flexAlign,
  FlexAuto,
  FlexColumn,
  FlexRow,
  FlexRowBox,
  FlexRowCenter,
  FlexScaleZero,
  hasCls,
  linearGradient,
  OverflowHidden,
  OverflowVisible,
  padding,
  PositionAbsolute,
  PositionRelative,
  rem
} from "vrkit-shared-ui"
import { PluginCompEntry } from "../../../services/store/slices/shared-app"
import Paper from "@mui/material/Paper"
import { AsyncImage } from "../../async-image"
import { OverlayInfo } from "vrkit-models"
import { createShadow } from "../../../theme/styles"

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
    "content",
    "footer",
    "footerActions"
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
    ...PositionRelative, // ...flex(0,
    ...flexAlign("stretch", "flex-start"),
    //filter: "drop-shadow(0px 2px 2px rgba(0,0,0, 0.25))",
    [`&:nth-child(odd) .${classes.itemPaper}::before`]: {
      backgroundImage: linearGradient(
          "to bottom",
          `${lighten(palette.background.paper, 0.03)} 0%`,
          `${lighten(palette.background.paper, 0.04)} 98%`,
          `${lighten(palette.background.paper, 0.1)} 100%`
      ),
    },
    [`&:nth-child(even) .${classes.itemPaper}::before`]: {
      backgroundImage: linearGradient(
          "to bottom",
          `${darken(palette.background.paper, 0.13)} 0%`,
          `${darken(palette.background.paper, 0.14)} 98%`,
          `${darken(palette.background.paper, 0.2)} 100%`
      ),
    },
    [child(classes.itemPaper)]: {
      ...FlexColumn,
      ...Fill,
      ...OverflowHidden,
      ...PositionRelative,
      borderRadius: 0,
      padding: 0,
      gap: spacing(1),
      textDecoration: "none",
      "&::before": {
        transition: transitions.create(["background-image", "box-shadow"]),
        ...PositionAbsolute,
        ...FillBounds,
        content: "' '",
        boxShadow: "none",
      },
      "&.first, &.first::before": {
        borderTopLeftRadius: shape.borderRadius,
        borderTopRightRadius: shape.borderRadius
      },
      "&:not(.first)": {},
      "&:not(.last)": {
        ...OverflowVisible
      },
      "&.last, &.last::before": {
        borderBottomLeftRadius: shape.borderRadius,
        borderBottomRightRadius: shape.borderRadius
      },

      ...flexAlign("stretch", "stretch"),
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
        }
      },
      [hasCls(classes.itemSelected)]: {
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
    
  }
}))

/**
 * ComponentInstanceListItem Component Properties
 */
export interface ComponentInstanceListItemProps extends BoxProps {
  overlayInfo: OverlayInfo

  compEntry: PluginCompEntry

  selected?: boolean

  actions?: React.ReactNode
}

/**
 * ComponentInstanceListItem Component
 *
 * @param { ComponentInstanceListItemProps } props
 */
export function ComponentInstanceListItem(props: ComponentInstanceListItemProps) {
  const {
      className,
      compEntry: [manifest, componentDef],
      selected: isSelected = false,
      overlayInfo,
      actions,
      onClick,
      sx = {},
      ...other
    } = props,
    theme = useTheme()

  return (
    <ComponentInstanceListItemRoot
      className={clsx(classes.root, {
        [classes.selected]: isSelected
      })}
      sx={{
        ...(onClick && CursorPointer),
        ...sx
      }}
      onClick={onClick}
      {...other}
    >
      <Paper
        className={clsx(
          classes.itemPaper,
          {
            [classes.itemSelected]: isSelected,
          },
          className
        )}
      >
        <FlexRowBox className={classes.header}>
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
        </FlexRowBox>
      </Paper>
    </ComponentInstanceListItemRoot>
  )
}

export default ComponentInstanceListItem
