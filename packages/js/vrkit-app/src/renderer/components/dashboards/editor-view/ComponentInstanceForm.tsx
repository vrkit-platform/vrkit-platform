// REACT
import React, { useCallback } from "react"

// CLSX
import clsx from "clsx"

// 3FV
import { getLogger } from "@3fv/logger-proxy"

// MUI
import Box, { BoxProps } from "@mui/material/Box"
import { styled, useTheme } from "@mui/material/styles"
import Switch from "@mui/material/Switch"
import Paper from "@mui/material/Paper"
import {formControlClasses} from "@mui/material/FormControl"
import {inputAdornmentClasses} from "@mui/material/InputAdornment"
import { matchIsValidColor, MuiColorInput } from "mui-color-input"

// APP
import {
  alpha,
  child,
  ClassNamesKey,
  createClassNames,
  Ellipsis,
  EllipsisBox,
  flex,
  flexAlign,
  FlexAuto,
  FlexColumn,
  FlexNowrap,
  FlexProperties,
  FlexRow,
  FlexScaleZero,
  hasCls, heightConstraint,
  HeightProperties,
  margin,
  OverflowHidden,
  padding,
  PositionRelative,
  widthConstraint
} from "@vrkit-platform/shared-ui"
import { PluginCompEntry } from "../../../services/store/slices/shared-app"

import { OverlayInfo, PluginUserSetting, PluginUserSettingType, PluginUserSettingValue } from "@vrkit-platform/models"
import { match } from "ts-pattern"

import { assign, assignDeep, defaults, isEmpty, isNotEmptyString } from "@vrkit-platform/shared"
import Alerts from "../../../services/alerts"
import { asOption } from "@3fv/prelude-ts"
import TextField from "@mui/material/TextField"

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
        "fieldLabelTop",
        "fieldLabelBottom",
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
    ...OverflowHidden,
    ...PositionRelative, // ...flex(0,
    transition: transitions.create(["max-height"]),
    height: "auto",
    maxHeight: 9999,
    [`&:not(.${classes.selected})`]: {
      maxHeight: 0,
    },
    
    [child(classes.form)]: {
      ...flex(0, 0, "auto"),
      ...FlexColumn,
      ...flexAlign("flex-start", "stretch"),
      ...padding(spacing(1)),
      ...PositionRelative,
      backgroundColor: palette.background.paper,
      borderRadius: shape.borderRadius,
      gap: spacing(1),

      zIndex: 3,
      [child(classes.field)]: {
        ...OverflowHidden,
        ...FlexAuto,
        ...FlexRow,
        ...FlexNowrap,
        ...flexAlign("stretch", "flex-start"),
        ...widthConstraint("100%"),
        gap: spacing(2),
        [child(classes.fieldLabel)]: {
          ...FlexScaleZero,
          ...FlexColumn,
          ...OverflowHidden,
          ...flexAlign("stretch", "flex-start"),
          [child(classes.fieldLabelTop)]: {
            ...typography.subtitle1,
            opacity: 0.9
          },
          [child(classes.fieldLabelBottom)]: {
            ...typography.subtitle2,
            ...Ellipsis,
            whitespace: "normal",
            "WebkitLineClamp": "2"
          }
        },
        [child(classes.fieldValue)]: {
          ...PositionRelative,
          ...FlexRow,
          ...FlexAuto,
          ...OverflowHidden,
          ...widthConstraint(200),
          ...flexAlign("center","flex-end"),
          [child(formControlClasses.root)]: {
            ...widthConstraint("100%"),
            [child(inputAdornmentClasses.root)]: {
              ...margin(0)
            },
            "& input": {
              ...padding(spacing(1),spacing(1))
            }
          }
        }
      }
     }
  }
}))

/**
 * ComponentInstanceForm Component Properties
 */
export interface ComponentInstanceFormProps extends Omit<BoxProps, "onChange"> {
  overlayInfo: OverlayInfo

  compEntry: PluginCompEntry

  onChange: (id: string, patch: Partial<OverlayInfo>) => void

  selected?: boolean
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
      onChange,
      sx = {},
      ...other
    } = props,
    theme = useTheme(),
    renderUserSetting = useCallback(
      (settingId: string, setting: PluginUserSetting) => {
        if (!overlayInfo) {
          Alerts.error(`Invalid overlay info, can not render settings`)
          return null
        }
        const values = asOption(overlayInfo.userSettingValues).getOrCall(
            () => (overlayInfo.userSettingValues = {}) as Record<string, PluginUserSettingValue>
          ),
          currentValue = asOption(values[settingId])
            .orCall(() => asOption(PluginUserSettingValue.create()))
            .map(value =>
              defaults(value, {
                id: settingId,
                type: setting.type,
                stringValue: "",
                intValue: 0,
                doubleValue: 0,
                colorValue: "rgb(255,255,255)",
                ...(setting.defaultValue ?? {})
              })
            )
            .tap(
              value =>
                isEmpty(value.colorValue) &&
                assign(value, {
                  colorValue: isNotEmptyString(setting.defaultValue) ? setting.defaultValue : "rgb(255,255,255)"
                })
            )
            .get(),
          onSettingChange = (value: Partial<PluginUserSettingValue>) => {
            values[settingId] = assignDeep({ ...currentValue }, value)
            onChange(overlayInfo.id, { ...overlayInfo, userSettingValues: values })
          }
        if (!PluginUserSettingType[setting.type]) {
          Alerts.error(`Invalid setting type (${setting.type}`)
          return null
        }

        return match<PluginUserSettingType, React.ReactNode>(setting.type)
          .with(PluginUserSettingType.BOOLEAN, () => (
            <Switch
              checked={currentValue?.booleanValue === true}
              onChange={ev => {
                onSettingChange({ booleanValue: ev.target.checked })
              }}
            />
          ))
          .with(PluginUserSettingType.INT, () => (
            <TextField
              hiddenLabel
              type="number"
              variant="filled"
              value={currentValue.intValue.toString()}
              onChange={ev => {
                onSettingChange({ intValue: parseInt(ev.target.value) })
              }}
            />
          ))
          .with(PluginUserSettingType.DOUBLE, () => (
            <TextField
              hiddenLabel
              type="number"
              variant="filled"
              value={currentValue.doubleValue.toString()}
              onChange={ev => {
                onSettingChange({ doubleValue: parseFloat(ev.target.value) })
              }}
            />
          ))
          .with(PluginUserSettingType.COLOR, () => (
            <MuiColorInput
              value={currentValue.colorValue}
              variant="filled"
              onChange={value => {
                if (!matchIsValidColor(value)) {
                  Alerts.error(`Invalid color selected (${value})`)
                  return
                }
                onSettingChange({ colorValue: value })
              }}
            />
          ))
          .otherwise(() => (
            <TextField
              hiddenLabel
              variant={"filled"}
              value={currentValue.stringValue}
              onChange={ev => {
                onSettingChange({ stringValue: ev.target.value })
              }}
            />
          ))
      },
      [onChange, overlayInfo]
    )

  return (
    <ComponentInstanceFormRoot
      className={clsx(classes.root, {
        [classes.selected]: isSelected
      },className)}
      sx={{
        ...sx
      }}
      {...other}
    >
      <Box className={classes.form}>
        <Box className={classes.field}>
          <Box className={classes.fieldLabel}>
            <EllipsisBox className={classes.fieldLabelTop} sx={{ ...FlexAuto }}>Name</EllipsisBox>
            <EllipsisBox className={classes.fieldLabelBottom} sx={{ ...FlexAuto }}>A unique name for this overlay.</EllipsisBox>
          </Box>
          <Box className={classes.fieldValue}>
            <TextField
              hiddenLabel
              variant={"filled"}
              value={overlayInfo.name}
              onChange={ev => {
                onChange(overlayInfo.id, { name: ev.target.value })
              }}
            />
          </Box>
        </Box>

        {Object.entries(componentDef.userSettings).map(([id, userSetting]) => (
          <Box
            key={id}
            className={classes.field}
          >
            <Box className={classes.fieldLabel}>
              <EllipsisBox className={classes.fieldLabelTop} sx={{ ...FlexAuto }}>{userSetting.name}</EllipsisBox>
              <Box  className={classes.fieldLabelBottom} sx={{ ...FlexAuto }}>{userSetting.description}</Box>
            </Box>
            <Box className={classes.fieldValue}>{renderUserSetting(id, userSetting)}</Box>
          </Box>
        ))}
      </Box>
      
    </ComponentInstanceFormRoot>
  )
}

export default ComponentInstanceForm
