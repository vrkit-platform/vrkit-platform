// REACT
import React from "react"

// CLSX
import clsx from "clsx"

// 3FV
import { getLogger } from "@3fv/logger-proxy"

import type { BoxProps } from "@mui/material/Box"
// MUI
import Box from "@mui/material/Box"
import { darken, styled, useTheme } from "@mui/material/styles"

// APP
import {
  child,
  ClassNamesKey,
  createClassNames,
  dimensionConstraints,
  Ellipsis,
  Fill,
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
  PositionRelative,
  rem
} from "vrkit-shared-ui"
import { PluginCompEntry } from "../../../services/store/slices/shared-app"
import Paper from "@mui/material/Paper"
import { AsyncImage } from "../../async-image"
import { OverlayInfo } from "vrkit-models"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const classPrefix = "dashboardEditorOverlayListItem"
export const dashboardEditorOverlayListItemClasses = createClassNames(classPrefix, "root", "itemPaper", "itemSelected", "header", "headerBox", "headerIcon","headerTitle",
        "headerSubheader",
        "content",
        "footer",
        "footerActions"),
  classes = dashboardEditorOverlayListItemClasses
export type DashboardEditorOverlayListItemClassKey = ClassNamesKey<typeof dashboardEditorOverlayListItemClasses>

const DashboardEditorOverlayListItemRoot = styled(Box, {
  name: "DashboardEditorOverlayListItemRoot",
  label: "DashboardEditorOverlayListItemRoot"
})(({ theme: { palette, spacing, shape, shadows, dimen, typography, transitions, customShadows } }) => ({
  // root styles here
  [hasCls(classes.root)]: {
    ...FlexRowCenter,
    ...OverflowHidden,
    ...PositionRelative, // ...flex(0,
    // 0,
    // "min(33%,
    // 25vw)"),
    // ...padding(0, "1rem"),
    filter: "drop-shadow(0px 2px 2px rgba(0,0,0, 0.25))", // ...heightConstraint("8.5rem"),
    ...flex(1, 0, "min(35%, 30vw)"), // ...widthConstraint("min(35%,
    // 30vw)"),
    ...flexAlign("stretch", "flex-start"),
    [child(classes.itemPaper)]: {
      ...FlexColumn,
      ...Fill,
      ...OverflowHidden,
      borderRadius: 0, // ...borderRadius(theme.shape.borderRadius / 4),
      // ...padding(spacing(1), spacing(1), spacing(1), spacing(1)),
      padding: 0,
      gap: spacing(1),
      textDecoration: "none",

      "&.first": {
        borderTopLeftRadius: shape.borderRadius,
        borderTopRightRadius: shape.borderRadius
      },
      "&:not(.first)": {},
      "&:not(.last)": {
        backgroundImage: linearGradient(
          "to bottom",
          `${darken(palette.background.paper, 0.03)} 0%`,
          `${darken(palette.background.paper, 0.04)} 95%`,
          `${darken(palette.background.paper, 0.1)} 100%`
        ),

        ...OverflowVisible
      },
      "&.last": {
        borderBottomLeftRadius: shape.borderRadius,
        borderBottomRightRadius: shape.borderRadius
      }, // boxShadow: customShadows.raisedCard,

      //[notHasCls(dashboardsListViewClasses.itemCreateButton)]: {
      ...flexAlign("stretch", "stretch"), //},
      [child(classes.header)]: {
        ...padding(spacing(1)),
        ...FlexRow,
        ...flexAlign("center", "stretch"),
        ...FlexAuto,
        overflowY: "visible",
        gap: spacing(1.5),
        boxShadow: shadows[2],
        zIndex: 3,
        [child(classes.headerIcon)]: {
          ...dimensionConstraints(rem(2)), "& img, & svg ": {
            color: palette.primary.contrastText,
            fill: palette.primary.contrastText
          },
          
          ...FlexRowCenter, ...FlexAuto
        }, [child(classes.headerBox)]: {
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
      }
      
    }
  }
}))

/**
 * DashboardEditorOverlayListItem Component Properties
 */
export interface DashboardEditorOverlayListItemProps extends BoxProps {
  overlayInfo: OverlayInfo
  compEntry: PluginCompEntry

  selected?: boolean

  actions?: React.ReactNode
}

/**
 * DashboardEditorOverlayListItem Component
 *
 * @param { DashboardEditorOverlayListItemProps } props
 */
export function DashboardEditorOverlayListItem(props: DashboardEditorOverlayListItemProps) {
  const {
      className,
      compEntry: [manifest, componentDef],
      selected: isSelected = false,
        overlayInfo,
      actions,
      ...other
    } = props,
    theme = useTheme()

  return (
    <DashboardEditorOverlayListItemRoot
      className={clsx(classes.root, {})}
      {...other}
    >
      <Paper
        className={clsx(classes.itemPaper, {
          [classes.itemSelected]: isSelected
        }, className)}
      >
        <FlexRowBox
          className={classes.header}
            sx={{
            // ...FlexAuto,
            // ...OverflowHidden,
            // ...flexAlign("stretch", "stretch"),
            // ...padding(theme.spacing(1), theme.spacing(1), theme.spacing(0.25), theme.spacing(1)),
            // gap: theme.spacing(1)
          }}
        >
          <Box className={clsx(classes.headerIcon)}>
          <AsyncImage
              src={componentDef?.uiResource?.icon?.url}
          />
          </Box>
          <Box className={classes.headerBox}>
            <Box className={classes.headerTitle}>{overlayInfo.name}</Box>
            <Box className={classes.headerSubheader}>{componentDef.name} &bull; {manifest.name}</Box>
          </Box>
        </FlexRowBox>
      </Paper>
    </DashboardEditorOverlayListItemRoot>
  )
}

export default DashboardEditorOverlayListItem
