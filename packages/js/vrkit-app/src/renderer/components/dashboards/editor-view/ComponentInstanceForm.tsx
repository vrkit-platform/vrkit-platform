// REACT
import React from "react"

// CLSX
import clsx from "clsx"

// 3FV
import { getLogger } from "@3fv/logger-proxy"

// MUI
import Box, { BoxProps } from "@mui/material/Box"
import { styled, useTheme } from "@mui/material/styles"

// APP
import {
  child,
  ClassNamesKey,
  createClassNames,
  CursorPointer,
  flex,
  flexAlign,
  FlexColumn, FlexProperties,
  FlexRow,
  FlexRowBox,
  hasCls,
  OverflowHidden,
  padding,
  PositionRelative
} from "vrkit-shared-ui"
import { PluginCompEntry } from "../../../services/store/slices/shared-app"
import Paper from "@mui/material/Paper"
import { AsyncImage } from "../../async-image"
import { OverlayInfo } from "vrkit-models"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const classPrefix = "componentInstanceForm"
export const componentInstanceFormClasses = createClassNames(
    classPrefix,
    "root",
        "selected",
    "form",
    "formPaper",

    "field",
    "fieldLabel",
    "fieldValue"
  ),
  classes = componentInstanceFormClasses
export type ComponentInstanceFormClassKey = ClassNamesKey<typeof componentInstanceFormClasses>

const ComponentInstanceFormRoot = styled(Box, {
  name: "ComponentInstanceFormRoot",
  label: "ComponentInstanceFormRoot"
})(({ theme: { palette, spacing, shape, shadows, insetShadows, dimen, typography, transitions, customShadows } }) => ({
  // root styles here
  [hasCls(classes.root)]: {
    ...FlexColumn,
    ...OverflowHidden,
    ...PositionRelative, // ...flex(0,
    ...flexAlign("stretch", "stretch"), //filter: "drop-shadow(0px 2px 2px rgba(0,0,0, 0.25))",
    //filter: `drop-shadow(0 0 0.75rem ${palette.background.session})`,
    transition: transitions.create([...FlexProperties]),
    [`&:not(.${classes.selected})`]: {
      ...flex(0,0,0)
    },
    [`&.${classes.selected}`]: {
          ...flex(1,0,"100%"),
      boxShadow: shadows[4],
    },
    
    
    [child(classes.form)]: {
      [child(classes.formPaper)]: {
        ...flex(1, 0, "auto"),
        ...FlexColumn,
        ...flexAlign("flex-start", "stretch"),
        ...padding(spacing(1)),
        ...PositionRelative,
        overflowX: "hidden",
        overflowY: "auto",
        borderRadius: shape.borderRadius,
        gap: spacing(1),

        zIndex: 3,
        [child(classes.field)]: {
          ...FlexRow,
          [child(classes.fieldLabel)]: {},
          [child(classes.fieldValue)]: {}
        }
      }
    }
  }
}))

/**
 * ComponentInstanceForm Component Properties
 */
export interface ComponentInstanceFormProps extends BoxProps {
  overlayInfo: OverlayInfo

  compEntry: PluginCompEntry

  selected?: boolean

  actions?: React.ReactNode
}

/**
 * ComponentInstanceForm Component
 *
 * @param { ComponentInstanceFormProps } props
 */
export function ComponentInstanceForm(props: ComponentInstanceFormProps) {
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
    <ComponentInstanceFormRoot
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
          classes.formPaper,
          {
          
          },
          className
        )}
      >
        {Object.entries(componentDef.userSettings).map(([id, userSetting]) => <Box
            key={id}
            className={classes.field}
        >
          {/*{renderUserSetting(id, userSetting, overlayInfo.userSettingValues[id])}*/}
          {userSetting.id} - {userSetting.name}
        </Box>)}
      </Paper>
    </ComponentInstanceFormRoot>
  )
}

export default ComponentInstanceForm
