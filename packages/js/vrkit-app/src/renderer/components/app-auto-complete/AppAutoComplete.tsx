// REACT
import React, { useState } from "react"

// CLSX
import clsx from "clsx"

// 3FV
import { getLogger } from "@3fv/logger-proxy"

// MUI
import {
  Box,
  Autocomplete,
  formControlClasses, filledInputClasses
} from "@mui/material"
import type { Theme, BoxProps, AutocompleteProps } from "@mui/material"
import { lighten, styled } from "@mui/material/styles"

// APP
import {
  ClassNamesKey,
  createClassNames,
  createClasses,
  child,
  borderRadius,
  OverflowHidden,
  PositionRelative,
  FillWidth,
  OverflowVisible,
  FlexRow,
  flexAlign,
  FlexScaleZero, FillHeight
} from "vrkit-shared-ui/styles"
import type { ChipTypeMap } from "@mui/material/Chip"
import { isBoolean } from "@3fv/guard"
import { appTextFieldClasses } from "../app-text-field"
import Popper from "@mui/material/Popper"
import { autocompleteClasses } from "@mui/material/Autocomplete"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const classPrefix = "appAutoComplete"
export const appAutoCompleteClasses = createClassNames(
  classPrefix,
  "root",
  "open"
)
export type AppAutoCompleteClassKey = ClassNamesKey<
  typeof appAutoCompleteClasses
>

const AppAutoCompleteRoot = styled(Autocomplete)(({ theme }) => ({
  [`&, &.${autocompleteClasses.root}`]: {
    ...OverflowHidden,
    ...PositionRelative,
    ...FlexRow,
    //display: "block",

    ...flexAlign("stretch", "stretch"), // ...OverflowVisible,
    // ...FillWidth,
    // ...FillHeight,
    [`& .MuiFormControl-root`]: {
      ...OverflowHidden,
      ...PositionRelative,
      ...FlexRow,
      ...FlexScaleZero,
      ...flexAlign("center","stretch"),
      ...FillWidth,
      [`& > .${filledInputClasses.root}.MuiAutocomplete-inputRoot`]: {
        borderRadius: theme.shape.borderRadius

      }
    },
    [`&.${appAutoCompleteClasses.open} .MuiFormControl-root`]: {
      [`& > .${filledInputClasses.root}.MuiAutocomplete-inputRoot`]: {
        ...borderRadius(theme.shape.borderRadius,
          theme.shape.borderRadius,
          0,
          0
        )
      }

    },
    [child([
      formControlClasses.root,
      `MuiFilledInput-root.${appTextFieldClasses.input}`
    ])]: {
      ...OverflowHidden
    },
    [child(autocompleteClasses.clearIndicator)]: {
      color: theme.palette.text.primary
    },

    [child("MuiFilledInput-root")]: {
      // borderRadius: 0,
      paddingTop: theme.spacing(1),
      paddingBottom: theme.spacing(1)
    },
    [child(".MuiAutocomplete-listbox")]: {
      padding: 0
    }
  }
}))

export const AppAutoCompletePopper = styled<typeof Popper>(Popper, {
  name: "AppAutoCompletePopper"
})(({ theme }) => ({
  ...borderRadius(0, 0, theme.shape.borderRadius, theme.shape.borderRadius),
  border: `1px solid ${theme.palette.mode === "light" ? "#e1e4e8" : "#30363d"}`,
  backgroundColor: lighten(theme.palette.background.paper, 0.025),
  zIndex: theme.zIndex.modal + 1,
  [child(autocompleteClasses.root)]: {
    ...PositionRelative,
    ...FillWidth
  },
  [child(autocompleteClasses.paper)]: {
    ...borderRadius(
      0,
      0,
      theme.shape.borderRadius,
      theme.shape.borderRadius
    )
  },
  [child(autocompleteClasses.popper)]: {
    ...FillWidth
  }
}))

/**
 * AppAutoComplete Component Properties
 */
export interface AppAutoCompleteProps<
  T,
  Multiple extends boolean | undefined,
  DisableClearable extends boolean | undefined,
  FreeSolo extends boolean | undefined,
  ChipComponent extends React.ElementType = ChipTypeMap["defaultComponent"]
> extends AutocompleteProps<
    T,
    Multiple,
    DisableClearable,
    FreeSolo,
    ChipComponent
  > {}

/**
 * AppAutoComplete Component
 *
 * @param { AppAutoCompleteProps } props
 * @returns {JSX.Element}
 */
export function AppAutoComplete<
  T,
  Multiple extends boolean | undefined,
  DisableClearable extends boolean | undefined,
  FreeSolo extends boolean | undefined,
  ChipComponent extends React.ElementType = ChipTypeMap["defaultComponent"]
>(
  props: AppAutoCompleteProps<
    T,
    Multiple,
    DisableClearable,
    FreeSolo,
    ChipComponent
  >
) {
  const {
      open: propOpen,
      onOpen: propOnOpen,
      onClose: propOnClose,
      className,
      ...other
    } = props,
    [localOpen, setLocalOpen] = useState(false),
    open = isBoolean(propOpen) ? propOpen : localOpen

  return (
    <AppAutoCompleteRoot
      PopperComponent={AppAutoCompletePopper}
      open={open}
      onOpen={e => {
        setLocalOpen(true)
        propOnOpen?.(e)
      }}
      onClose={(e, r) => {
        setLocalOpen(false)
        propOnClose?.(e, r)
      }}
      className={clsx(
        className,
        appAutoCompleteClasses.root,
        open && appAutoCompleteClasses.open
      )}
      popupIcon={null}
      {...other}
    />
  )
}

export default AppAutoComplete
