// REACT
import React from "react"

// CLSX
import clsx from "clsx"

// 3FV
import { getLogger } from "@3fv/logger-proxy"

// MUI
import Box from "@mui/material/Box"
import type { BoxProps } from "@mui/material/Box"
import { styled } from "@mui/material/styles"
import type { DividerProps, Theme } from "@mui/material"
import type { SxProps } from "@mui/system"

// APP
import {
  ClassNamesKey,
  createClassNames,
  createClasses,
  FlexScaleZero
} from "vrkit-app-renderer/styles"
import { Divider } from "@mui/material"

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
export function FlexDivider(props: FlexDividerProps) {
  const { className, ...other } = props

  return (
    <FlexDividerRoot
      className={clsx(flexDividerClasses.root, className)}
      flexItem
      {...other}
    />
  )
}

export default FlexDivider
