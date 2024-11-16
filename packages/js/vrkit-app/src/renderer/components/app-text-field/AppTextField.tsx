// REACT
import React, { useCallback } from "react"

// CLSX
import clsx from "clsx"

// 3FV
import { getLogger } from "@3fv/logger-proxy"

// MUI
import MuiTextField, { FilledTextFieldProps as MuiFilledTextFieldProps } from "@mui/material/TextField"
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

    [hasCls(appTextFieldClasses.flex)]: {
      ...FlexScaleZero
    },
    [hasCls(appTextFieldClasses.hasLabel)]: {
      marginTop: rem(2),
      "& .MuiInputLabel-root.MuiInputLabel-formControl.MuiInputLabel-shrink": {
        transform: `translate(0,${rem(-2)})`
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
export interface AppTextFieldProps extends Omit<MuiFilledTextFieldProps, "variant"> {
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
export function AppTextField(props: AppTextFieldProps) {
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
        onFocus: onInputFocus,
        onKeyDown: interceptEvent(onKeyDown, InputProps?.onKeyDown)
      }}
      {...other}
    />
  )
}

export interface AppTextFieldFormikProps<T extends {}, P extends keyof T>
  extends Omit<AppTextFieldProps, "error" | "helperText" | "onBlur" | "onChange" | "value" | "name"> {
  formikContext?: FormikContextType<T>

  label?: string

  name: P
}

export function AppTextFieldFormik<T extends {}, P extends keyof T = keyof T>(props: AppTextFieldFormikProps<T, P>) {
  const {
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
      onBlur={handleBlur}
      onChange={handleChange}
      value={values[name]}
      disabled={isSubmitting === true || other?.disabled === true}
      {...other}
    />
  )
}

export default AppTextField
