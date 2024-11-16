import * as React from "react"
import { useTheme, styled, darken, lighten } from "@mui/material/styles"
import Popper from "@mui/material/Popper"
import ClickAwayListener from "@mui/material/ClickAwayListener"
import Autocomplete, {
  AutocompleteCloseReason,
  autocompleteClasses
} from "@mui/material/Autocomplete"
import ButtonBase from "@mui/material/ButtonBase"
import InputBase from "@mui/material/InputBase"
import Box from "@mui/material/Box"
import type { Theme, BoxProps } from "@mui/material"
import clsx from "clsx"

// 3FV
import { getLogger } from "@3fv/logger-proxy"

// APP
import {
  child,
  ClassNamesKey,
  createClassNames,
  FillWidth,
  FlexDefaults,
  FlexRow,
  FlexRowCenter,
  FlexScale,
  FlexScaleZero,
  borderRadius,
  dimensionConstraints,
  padding,
  widthConstraint,
  OverflowVisible,
  PositionRelative,
  px,
  rem
} from "vrkit-shared-ui/styles"
import { isArray, isBoolean, isString } from "@3fv/guard"
import { arrayOf, notInList } from "vrkit-shared/utils"
import { identity, omit } from "lodash"
import { AppAutoComplete } from "../app-auto-complete"
import { SxProps } from "@mui/system"
import { useCallback, useEffect, useState } from "react"
import { FormControl, InputLabel, Typography } from "@mui/material"
import { AutocompleteRenderOptionState } from "@mui/material/Autocomplete/Autocomplete"
import ArrowDownwardIcon from "@mui/icons-material/ArrowDropDown"
import { asOption } from "@3fv/prelude-ts"
import type { ReactChildren } from "vrkit-shared-ui"
import { PopperProps } from "@mui/material/Popper/Popper"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const classPrefix = "appSelectField"
export const appSelectFieldClasses = createClassNames(
  classPrefix,
  "open",
  "button",
  "buttonIcon",
  "formControl"
)
export type AppSelectFieldClassKey = ClassNamesKey<typeof appSelectFieldClasses>

const AppSelectFieldRoot = styled(Box)(({ theme }) => ({
  ...FlexRow,
  ...FlexDefaults.stretch,
  display: "inline-flex",
  borderRadius: theme.shape.borderRadius,
  "&, &:hover": {
    backgroundColor: theme.palette.background.filledInput
  },
  [`&.${appSelectFieldClasses.open}`]: {
    ...borderRadius(
      theme.shape.borderRadius,
      theme.shape.borderRadius,
      0,
      0
    )
  },
  [child(appSelectFieldClasses.formControl)]: {
    ...FlexScaleZero,
    ...FlexRow,
    ...FlexDefaults.stretch,
    borderRadius: theme.shape.borderRadius
  },
  [child(appSelectFieldClasses.button)]: {
    ...padding(
      theme.spacing(1),
      theme.spacing(2),
      theme.spacing(1),
      theme.spacing(1)
    )
  },
  [child(appSelectFieldClasses.buttonIcon)]: {
    ...dimensionConstraints(rem(1.6)),
    marginLeft: theme.spacing(2)
  }
}))

const ignoredPopperProps = Array<PropertyKey>(
  "disablePortal",
  "anchorEl",
  "open"
)

/**
 * Popper root for select
 */
export const AppSelectPopperComponent = styled("div", {
  shouldForwardProp: notInList(ignoredPopperProps)
})(({ theme }) => ({
  [`& .${autocompleteClasses.paper}`]: {
    boxShadow: "none",
    margin: 0,
    color: "inherit"
  },
  [`& .${autocompleteClasses.listbox}`]: {
    backgroundColor: darken(theme.palette.background.paper, 0.05), // theme.palette.mode === "light" ? "#fff" : "#1c2128",
    padding: 0,
    [`& .${autocompleteClasses.option}`]: {
      minHeight: "auto",
      alignItems: "flex-start",
      padding: theme.spacing(2),
      '&[aria-selected="true"]': {
        backgroundColor: "transparent"
      },
      '&[data-focus="true"], &[data-focus="true"][aria-selected="true"]': {
        backgroundColor: theme.palette.action.hover
      }
    }
  },
  [`&.${autocompleteClasses.popperDisablePortal}`]: {
    position: "relative"
  }
}))

export const AppSelectPopper = styled(Popper)(({ theme }) => ({
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
    ...FillWidth,
    [child(autocompleteClasses.noOptions)]: {
      fontSize: "0.8rem",
      padding: theme.spacing(2)
    }
  }
}))

const AppSelectFieldTextInput = styled(InputBase)(({ theme }) => ({
  ...FillWidth,
  padding: theme.spacing(1),

  borderBottom: `1px solid ${
    theme.palette.mode === "light" ? "#e1e4e8" : "#30363d"
  }`,
  "& input": {
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(1),
    transition: theme.transitions.create(["border-color", "box-shadow"]),
    "&:focus": {}
  }
}))

const AppSelectButton = styled(ButtonBase)(({ theme }) => ({
  ...FlexRowCenter,
  ...FlexScale,
  textAlign: "left",
  "& > span": {
    ...FlexScale
  }
}))

export type AppSelectValue<T, Multiple extends boolean> = Multiple extends true
  ? T[]
  : T

/**
 * Render current value
 */
export type AppSelectRenderValue<T> = (
  value: T,
  props: { multiple: boolean; index: number }
) => React.ReactNode | ReactChildren | JSX.Element[]

/**
 * Select option renderer
 */
export type AppSelectRenderOption<T> = (
  props: React.HTMLAttributes<HTMLLIElement>,
  option: T,
  state: AutocompleteRenderOptionState
) => React.ReactNode

export type AppSelectFieldChangeTrigger = "select" | "close"

/**
 * AppSelectField Component Properties
 */
export interface AppSelectFieldProps<T, Multiple extends boolean> {
  id: string
  className?: string
  sx?: SxProps<Theme>
  noOptionsText?: string
  label?: string | React.ReactElement
  trigger?: AppSelectFieldChangeTrigger
  placeholder?: string
  multiple?: Multiple
  disableCloseOnSelect?: boolean
  getOptionLabel?: (option: T) => string
  renderOption: AppSelectRenderOption<T>
  options: T[]
  enableSelectedOptions?: boolean
  renderValue: AppSelectRenderValue<T>
  value: AppSelectValue<T, Multiple>
  // PopperComponent?: React.ComponentType<React.ComponentProps<typeof AppSelectPopperComponent>>
  PopperComponent?: React.ComponentType<PopperProps>
  onClose?: () => any
  onChange: (newValue: AppSelectValue<T, Multiple>) => any
}

/**
 * AppSelectField Component
 *
 * @param { AppSelectFieldProps } props
 * @returns {JSX.Element}
 */
export function AppSelectField<T, Multiple extends boolean>(
  props: AppSelectFieldProps<T, Multiple>
) {
  const {
      id,
      noOptionsText = "No options",
      options,
      multiple = false,
      trigger = "select",
      className,
      onChange: propOnChange,
      onClose: propOnClose,
      value,
      label,
      placeholder = "Filter...",
      renderOption,
      enableSelectedOptions = false,
      PopperComponent = AppSelectPopperComponent,
      disableCloseOnSelect = false,
      getOptionLabel = identity,
      renderValue,
      ...other
    } = props,
    theme = useTheme(),
    triggersOnClose = trigger === "close",
    [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null),
    [pendingValue, setPendingValue] = useState<AppSelectValue<T, Multiple>>(
      () =>
        asOption(value).getOrCall(
          () => (multiple ? [] : null) as AppSelectValue<T, Multiple>
        )
    ),
    onChange = useCallback(
      (event, newValue, reason) => {
        if (
          event.type === "keydown" &&
          (event as React.KeyboardEvent).key === "Backspace" &&
          reason === "removeOption"
        ) {
          return
        }
        if (triggersOnClose) {
          setPendingValue(newValue as AppSelectValue<T, Multiple>)
        } else {
          propOnChange(newValue)
        }

        if (!disableCloseOnSelect) {
          setAnchorEl(null)
        }
      },
      [propOnChange, trigger, triggersOnClose, disableCloseOnSelect]
    )

  useEffect(() => {
    setPendingValue(value)
  }, [value])
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    // If the select trigger is "close", then use a pending value
    //setPendingValue(value)
    // if (triggersOnClose) {
    //
    // }

    //console.debug(`using parent anchor`, event.currentTarget?.parentElement)
    setAnchorEl(event.currentTarget?.parentElement)
  }

  const handleClose = useCallback(() => {
    if (trigger === "close") {
      propOnChange(pendingValue)
    }

    if (anchorEl) {
      anchorEl.focus()
    }
    setAnchorEl(null)
    propOnClose?.()
  }, [propOnClose, anchorEl, pendingValue])

  const open = Boolean(anchorEl)
  // const id = open ? "github-label" : undefined

  return (
    <>
      <AppSelectFieldRoot
        className={clsx(className, open && appSelectFieldClasses.open)}
        {...other}
      >
        <FormControl className={appSelectFieldClasses.formControl}>
          {isString(label) ? (
            <InputLabel id={`${id}-label`}>{label}</InputLabel>
          ) : React.isValidElement(label) ? (
            label
          ) : null}
          <AppSelectButton
            className={appSelectFieldClasses.button}
            aria-describedby={id}
            onClick={handleClick}
          >
            {pendingValue &&
            (!isArray(pendingValue) || pendingValue.length > 0) ? (
              isArray(pendingValue) ? (
                pendingValue.map((value, index) =>
                  renderValue(value, { multiple, index })
                )
              ) : (
                renderValue(pendingValue as any, { multiple, index: 0 })
              )
            ) : (
              <Typography variant="body1" component={"span"}>
                {label}
              </Typography>
            )}
            <Box sx={FlexScaleZero} />
            <ArrowDownwardIcon className={appSelectFieldClasses.buttonIcon} />
          </AppSelectButton>
        </FormControl>
        {/* Body */}
      </AppSelectFieldRoot>

      <AppSelectPopper
        id={id}
        open={open}
        anchorEl={anchorEl}
        placement="bottom-start"

      >
        <ClickAwayListener
          onClickAway={handleClose}
        >
          <Box
            sx={{
              ...OverflowVisible,
              boxShadow: `0 0 1px 0 rgb(0 0 0 / 31%), 3px 7px 6px -2px rgb(0 0 0 / 25%)`
              // theme.shadows[6]
            }}
          >
            <AppAutoComplete<T, Multiple, false, false>
              open
              style={{
                ...PositionRelative,
                width: "auto",
                maxWidth: "80%",
                minWidth: asOption(anchorEl?.clientWidth) // ?? null
                  .map(w => w - 2) // `calc(${w}px - (${px(theme.shape.borderRadius)} * 2))`)
                  .getOrNull()
              }}
              //fullWidth
              multiple={multiple as Multiple}
              onClose={(
                event: React.ChangeEvent<{}>,
                reason: AutocompleteCloseReason
              ) => {
                if (reason === "escape") {
                  handleClose()
                }
              }}
              value={multiple ? (pendingValue as any) : pendingValue}
              onChange={onChange}
              disableCloseOnSelect
              filterSelectedOptions={!enableSelectedOptions}
              PopperComponent={PopperComponent as any}
              renderTags={() => null}
              noOptionsText={noOptionsText}
              renderOption={renderOption}
              options={options}
              getOptionLabel={getOptionLabel}
              renderInput={params => (
                <AppSelectFieldTextInput
                  ref={params.InputProps.ref}
                  inputProps={params.inputProps}
                  autoFocus
                  placeholder={placeholder}
                />
              )}
            />
          </Box>
        </ClickAwayListener>
      </AppSelectPopper>
    </>
  )
}

export default AppSelectField
