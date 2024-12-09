// REACT
import React from "react"

// CLSX
import clsx from "clsx"

// 3FV
import { getLogger } from "@3fv/logger-proxy"

// MUI
import IconButton, { type IconButtonProps } from "@mui/material/IconButton"

import { styled } from "@mui/material/styles"

// APP
import { ClassNamesKey, createClassNames, hasCls } from "vrkit-shared-ui"
import Tooltip, { TooltipProps } from "@mui/material/Tooltip"
import { isNotEmptyString } from "vrkit-shared"
import { asOption } from "@3fv/prelude-ts"
import { OverrideProps } from "@mui/material/OverridableComponent"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const classPrefix = "appIconButton"
export const appIconButtonClasses = createClassNames(classPrefix, "root")
export type AppIconButtonClassKey = ClassNamesKey<typeof appIconButtonClasses>

const AppIconButtonRoot = styled(IconButton, {
  name: "AppIconButtonRoot",
  label: "AppIconButtonRoot"
})(({ theme }) => ({
  // root styles here
  [hasCls(appIconButtonClasses.root)]: {}
}))

/**
 * AppIconButton Component Properties
 */
export type AppIconButtonProps = IconButtonProps & {
  tooltip?: string
  tooltipProps?: TooltipProps
} & React.ComponentProps<IconButtonProps["component"]>

/**
 * AppIconButton Component
 *
 * @param { AppIconButtonProps } props
 */
export const AppIconButton = React.forwardRef<typeof AppIconButtonRoot, AppIconButtonProps>(function AppIconButton(
  props: AppIconButtonProps, ref: any
) {
  const { tooltipProps: providedTooltipProps = null, tooltip = null, className, ...other } = props,
    button = (
      <AppIconButtonRoot
        ref={ref as any}
        className={clsx(appIconButtonClasses.root, {}, className)}
        {...other}
      />
    ),
    tooltipProps = asOption(providedTooltipProps)
      .tapIf(
        props => {
          return isNotEmptyString(tooltip) && !props.title
        },
        props => {
          props.title = tooltip
        }
      )
      .orCall(() => asOption((tooltip ? { title: tooltip } : undefined) as TooltipProps))
      .getOrNull()

  return tooltipProps ? <Tooltip {...tooltipProps}>{button}</Tooltip> : button
})

export default AppIconButton
