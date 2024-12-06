// REACT
import React from "react"

// CLSX
import clsx from "clsx"

// 3FV
import { getLogger } from "@3fv/logger-proxy"

// MUI
import { styled } from "@mui/material/styles"
import type { DividerProps } from "@mui/material"
import { Divider } from "@mui/material"

// APP
import { ClassNamesKey, createClasses, createClassNames, FlexScaleZero } from "../../styles"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const classPrefix = "flexDivider"
export const flexDividerClasses = createClassNames(classPrefix, "root")
export type FlexDividerClassKey = ClassNamesKey<typeof flexDividerClasses>

const FlexDividerRoot = styled(Divider)(
  ({ theme }) =>
    createClasses<FlexDividerClassKey>(classPrefix, {
      root: {
        ...FlexScaleZero
      }
    })
)

/**
 * FlexDivider Component Properties
 */
export interface FlexDividerProps extends DividerProps {}

/**
 * FlexDivider Component
 *
 * @param { FlexDividerProps } props
 * @returns {JSX.Element}
 */
const FlexDivider = React.forwardRef<HTMLDivElement, FlexDividerProps>(function FlexDivider(props, ref) {
  const { className, ...other } = props

  return (
    <FlexDividerRoot
      ref={ref as any}
      className={clsx(flexDividerClasses.root, className)}
      flexItem
      {...other}
    />
  )
})

export default FlexDivider
