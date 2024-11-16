// REACT
import React from "react"

// CLSX
import clsx from "clsx"

// 3FV
import { getLogger } from "@3fv/logger-proxy"

// MUI
import { styled } from "@mui/material/styles"

// APP
import {
  ClassNamesKey,
  createClassNames,
  FillWidth,
  FlexAuto,
  FlexColumn,
  FlexDefaults,
  FlexScaleZero,
  flexAlign, padding,
  widthConstraint,
  PositionRelative
} from "vrkit-shared-ui/styles"
import { Box } from "@mui/material"
import { BoxProps } from "@mui/material/Box"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const formClassPrefix = "FormContent"
export const formContentClasses = createClassNames(
  formClassPrefix,
  "root",
  "scroller",
  "content"
)
export type FormContentClassKey = ClassNamesKey<typeof formContentClasses>

// const FormContentRoot = styled(Box, {
//   name: "FormContentRoot"
// })(({ theme }) => ({}))
//
// const FormContentScrollerRoot = styled(Box, {
//   name: "FormContentScrollerRoot"
// })(({ theme }) => ({}))

const FormContentScrollerWrapperRoot = styled(Box, {
  name: "FormContentScrollerWrapperRoot"
})(({ theme }) => ({
  [`&.${formContentClasses.root}`]: {
    ...FlexColumn,
    ...FillWidth,
    ...FlexScaleZero,
    ...PositionRelative,
    ...FlexDefaults.stretch,
    ...FlexDefaults.stretchSelf,
    ...PositionRelative,
    ...theme.mixins.fadeBottom,
    [`& > .${formContentClasses.scroller}`]: {
      ...FlexColumn,
      ...FlexScaleZero,
      ...PositionRelative,
      ...flexAlign("center", "stretch"),
      ...FlexDefaults.stretchSelf,
      ...PositionRelative,

      overflowX: "hidden",
      overflowY: "auto",

      [`& > .${formContentClasses.content}`]: {
        ...FlexColumn,
        ...PositionRelative,
        ...FlexAuto,
        ...widthConstraint(`min(100%, 65rem)`),
        ...padding(theme.spacing(12)),
        gap: theme.spacing(4),

        width: "auto"
      }
    }
  }
}))

/**
 * FormContent Component Properties
 */
export interface FormContentProps extends BoxProps {
  //FormHTMLAttributes<HTMLDivElement> {
  scrollerProps?: BoxProps
  contentProps?: BoxProps
}

// const onSubmitDefault: FormContentProps["onSubmit"] = event =>
//   event.preventDefault()

/**
 * FormContent Component
 *
 * @param { FormContentProps } props
 * @returns {JSX.Element}
 */
export const FormContent = React.forwardRef<HTMLDivElement, FormContentProps>(
  function FormContent(props: FormContentProps, rootRef) {
    const {
        className,
        onSubmit,
        children,
        scrollerProps = {},
        contentProps = {},
        ...other
      } = props,
      { className: contentClassName, ...contentOther } = contentProps

    return (
      <FormContentScrollerWrapperRoot
        ref={rootRef}
        className={clsx(formContentClasses.root, className)}
        {...other}
      >
        <Box
          className={clsx(formContentClasses.scroller)}
          {...scrollerProps}
        >
          <Box
            className={clsx(formContentClasses.content, contentClassName)}
            {...contentOther}
          >
            {children}
          </Box>
        </Box>
      </FormContentScrollerWrapperRoot>
    )
  }
)

export default FormContent
