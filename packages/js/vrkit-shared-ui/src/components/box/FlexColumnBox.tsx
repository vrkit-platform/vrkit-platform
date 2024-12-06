
import React from "react"

import {
  FlexAuto,
  FlexColumn,
  FlexColumnCenter
} from "../../styles"
import type { BoxProps } from "@mui/material"
import { Box, styled } from "@mui/material"

const FlexColumnBoxRoot = styled<typeof Box>(Box, { name: "FlexColumnBoxRoot" })(
  ({ theme }) => ({
    ...FlexColumn,
    ...FlexAuto
  })
)

const FlexColumnCenterBoxRoot = styled<typeof Box>(Box, { name: "FlexColumnBoxRoot" })(({ theme }) => ({
  ...FlexColumnCenter,
  ...FlexAuto
}))

export const FlexColumnBox = React.forwardRef(function FlexColumnBox(props: BoxProps, ref) {
  return (
    <FlexColumnBoxRoot
      ref={ref}
      {...props}
    />
  )
})

export const FlexColumnCenterBox = React.forwardRef(function FlexColumnCenterBox(props: BoxProps, ref) {
  return (
    <FlexColumnCenterBoxRoot
      ref={ref}
      {...props}
    />
  )
})

