import React from "react"

import { FlexAuto, FlexRow, FlexRowCenter } from "../../styles"
import type { BoxProps } from "@mui/material"
import { Box, styled } from "@mui/material"

const FlexRowBoxRoot = styled(Box, { name: "FlexRowBoxRoot" })(({ theme }) => ({
  ...FlexRow,
  ...FlexAuto
}))

const FlexRowCenterBoxRoot = styled(Box, { name: "FlexRowCenterBoxRoot" })(
  ({ theme }) => ({
    ...FlexRowCenter,
    ...FlexAuto
  })
)



export const FlexRowBox = React.forwardRef(function FlexRowBox(props:BoxProps, ref) {
  return (
    <FlexRowBoxRoot
      ref={ref as any}
      {...props}
    />
  )
})

export const FlexRowCenterBox = React.forwardRef(function FlexRowCenterBox(props:BoxProps, ref) {
  return (
    <FlexRowCenterBoxRoot
      ref={ref as any}
      {...props}
    />
  )
})

