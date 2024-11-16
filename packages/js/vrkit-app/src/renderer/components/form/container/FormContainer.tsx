// REACT
import React, { FormHTMLAttributes, HTMLAttributes } from "react"

// CLSX
import clsx from "clsx"

// 3FV
import { getLogger } from "@3fv/logger-proxy"

// MUI
import { styled } from "@mui/material/styles"
import { Grid, GridProps, Theme } from "@mui/material"
import type { SxProps } from "@mui/system"

// APP
import {
  ClassNamesKey,
  createClassNames,
  FlexColumn,
  FlexDefaults,
  FlexScaleZero, flexAlign,
  margin,
  PositionRelative
} from "vrkit-shared-ui/styles"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const formClassPrefix = "FormContainer"
export const formContainerClasses = createClassNames(
  formClassPrefix,
  "root",
  "body"
)
export type FormContainerClassKey = ClassNamesKey<typeof formContainerClasses>

const FormContainerRoot = styled("form")(({ theme }) =>
   ({
    [`&.${formContainerClasses.root}`]: {
			// ...FlexColumn,
			// ...PositionRelative,
			// ...OverflowHidden,
      ...FlexColumn,
      ...FlexScaleZero,
      ...PositionRelative,
      ...FlexDefaults.stretch,
      ...FlexDefaults.stretchSelf,
			[`& .${formContainerClasses.body}`]: {
        ...FlexColumn,
        ...FlexScaleZero,
        ...PositionRelative,
        ...FlexDefaults.stretch,
        ...FlexDefaults.stretchSelf,
        //...makeFlexAlign("stretch","center"),

        // ...makeMargin(theme.spacing(8)),
        flexWrap: "nowrap",
        // alignItems: "center",
        // gap: theme.spacing(4),

        width: "auto"
			}
		}

  })
)


/**
 * FormContainer Component Properties
 */
export interface FormContainerProps extends FormHTMLAttributes<HTMLFormElement> {
  sx?: SxProps<Theme>
  bodyProps?: HTMLAttributes<HTMLDivElement>


}

// const onSubmitDefault: FormContainerProps["onSubmit"] = event =>
//   event.preventDefault()

/**
 * FormContainer Component
 *
 * @param { FormContainerProps } props
 * @returns {JSX.Element}
 */
export const FormContainer = React.forwardRef<HTMLFormElement, FormContainerProps>(function FormContainer(props: FormContainerProps, formRef) {
  const { className, onSubmit,children, bodyProps = {}, ...other } = props,
    { className: bodyClassName, ...bodyOther } = bodyProps

  return (
    <FormContainerRoot
      ref={formRef}
      className={clsx(formContainerClasses.root, className)}
      onSubmit={(event) => {
        event.preventDefault()
        event.stopPropagation?.()
        onSubmit?.(event)
        return false
      }}
      {...other}
    >
      <div
        className={clsx(formContainerClasses.body, bodyClassName)}
        {...bodyOther}
      >
        {children}
      </div>
    </FormContainerRoot>
  )
})


export default FormContainer
