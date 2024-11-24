// REACT
import React, { useCallback } from "react"

// CLSX
import clsx from "clsx"

// 3FV
import { getLogger } from "@3fv/logger-proxy"

// MUI
import { filledInputClasses as muiFilledInputClasses } from "@mui/material/FilledInput"
import MuiTextField, {
  BaseTextFieldProps as MuiBaseTextFieldProps,
  FilledTextFieldProps as MuiFilledTextFieldProps
} from "@mui/material/TextField"
import { inputBaseClasses as muiInputBaseClasses } from "@mui/material/InputBase"
import { styled } from "@mui/material/styles"

// APP
import {
  borderRadius,
  child,
  ClassNamesKey,
  createClassNames,
  FlexColumn,
  FlexDefaults,
  FlexScaleZero,
  hasCls,
  margin,
  rem
} from "vrkit-shared-ui/styles"
import { FormikContextType, useFormikContext } from "formik"
import { capitalize } from "lodash"
import { interceptEvent } from "../../utils/dom"
import { isDefined, isFunction, isString } from "@3fv/guard"
import { match } from "ts-pattern"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const classPrefix = "AppTextField"

/**
 * New class key for overrides
 */
export const appTextFieldClasses = createClassNames(classPrefix, "root", "input", "hasLabel", "flex")

export type AppTextFieldClassKey = ClassNamesKey<typeof appTextFieldClasses>

/**
 * MuiTextfield customized
 */
const AppTextFieldRoot = styled(MuiTextField)(({ theme }) => ({
  [hasCls(appTextFieldClasses.root)]: {
    ...FlexColumn,
    ...FlexDefaults.stretch,
    ...FlexDefaults.stretchSelf,

    [`& input.${muiInputBaseClasses.input}, & input.${muiFilledInputClasses.input}`]: {
      paddingLeft: rem(0.5),
      paddingRight: rem(0.5)
    },

    [`& div.${muiInputBaseClasses.root}.${muiFilledInputClasses.root}`]: {
      paddingLeft: rem(0.5),
      paddingRight: rem(0.5),
      [`& textarea.${muiInputBaseClasses.input}, & textarea.${muiFilledInputClasses.input}`]: {
        paddingLeft: rem(0),
        paddingRight: rem(0)
      }
    },
    [hasCls(appTextFieldClasses.flex)]: {
      ...FlexScaleZero
    },

    [hasCls(appTextFieldClasses.hasLabel)]: {
      marginTop: rem(0.5),
      "& .MuiInputLabel-root.MuiInputLabel-formControl.MuiInputLabel-shrink": {
        transform: `translate(${rem(0.5)},${rem(0.15)})`, // "&.MuiInputLabel-filled":
        // {
        //   transform: `translate(${rem(0.5)},${rem(0.15)})`
        // },
        "&:not(.MuiInputLabel-filled)": {
          transform: `translate(${rem(0.5)},${rem(-0.5)})`
        }
      }
    },
    "& .MuiFormHelperText-root": {
      ...margin(theme.spacing(1), theme.spacing(0), 0, 0)
    },
    [child(appTextFieldClasses.input)]: {
      ...borderRadius(theme.shape.borderRadius),
      fontSize: rem(1.4)
    }
  }
}))

/**
 * TextField Component Properties
 */
export interface AppTextFieldProps
  extends MuiBaseTextFieldProps,
    Pick<MuiFilledTextFieldProps, "InputProps" | "onChange"> {
  onEnterKeyDown?: React.KeyboardEventHandler<any>

  selectOnFocus?: boolean

  flex?: boolean
}

/**
 * TextField Component
 *
 * @param { AppTextFieldProps } props
 * @returns {JSX.Element}
 */
export function AppTextField(props: AppTextFieldProps): JSX.Element {
  const {
      className,
      onEnterKeyDown,
      InputProps = {},
      InputLabelProps = {},
      label,
      flex = false,
      autoFocus = false,
      tabIndex = 0,
      selectOnFocus = false,
      onBlur,
      ...other
    } = props,
    onKeyDown =
      isFunction(onEnterKeyDown) &&
      ((e: React.KeyboardEvent<any>) => {
        if (e.key === "Enter") {
          onEnterKeyDown(e)
        }
      }),
    onInputFocus = useCallback(
      (event: React.FocusEvent<HTMLInputElement>) => {
        event.target.select()
        InputProps?.onFocus?.(event)
      },
      [InputProps?.onFocus]
    )

  return (
    <AppTextFieldRoot
      label={label}
      autoFocus={autoFocus}
      tabIndex={tabIndex}
      className={clsx(
        appTextFieldClasses.root,
        {
          [appTextFieldClasses.hasLabel]: !!label,
          [appTextFieldClasses.flex]: flex
        },
        className
      )}
      margin="normal"
      variant="filled"
      InputLabelProps={{
        shrink: true,
        ...InputLabelProps
      }}
      InputProps={{
        className: appTextFieldClasses.input,
        disableUnderline: true,

        ...InputProps,
        onBlur: onBlur ?? InputProps?.onBlur,
        onFocus: onInputFocus,
        onKeyDown: interceptEvent(onKeyDown, InputProps?.onKeyDown)
      }}
      {...other}
    />
  )
}

export interface AppTextFieldFormikProps<T extends {}, P extends keyof T>
  extends Omit<AppTextFieldProps, "error" | "helperText" | "onChange" | "value" | "name"> {
  formikContext?: FormikContextType<T>

  label?: string

  name: P
}

export function AppTextFieldFormik<T extends {}, P extends keyof T = keyof T>(props: AppTextFieldFormikProps<T, P>) {
  const {
      onBlur: providedOnBlur,
      formikContext: propFormikContext,
      name,
      selectOnFocus = false,
      label = capitalize(name as string),
      ...other
    } = props,
    providedFormikContext = useFormikContext<T>(),
    formikContext = propFormikContext ?? providedFormikContext,
    { isSubmitting, errors, handleBlur, handleChange, touched, values } = formikContext

  return (
    <AppTextField
      error={Boolean(touched[name] && errors[name])}
      helperText={
        touched[name] &&
        match(errors[name])
          .when(isString, it => it)
          .when(isDefined, it => it?.toString())
          .otherwise(() => null)
      }
      label={label}
      name={name as string}
      type="text"
      selectOnFocus={selectOnFocus}
      onBlur={providedOnBlur ?? handleBlur}
      onChange={handleChange}
      value={values[name]}
      disabled={isSubmitting === true || other?.disabled === true}
      {...other}
    />
  )
}

export default AppTextField
