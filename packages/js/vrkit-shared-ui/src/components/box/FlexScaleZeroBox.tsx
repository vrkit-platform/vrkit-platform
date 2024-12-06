import { FlexScaleZero } from "../../styles"
import type { BoxProps } from "@mui/material"
import { Box, styled } from "@mui/material"
import React from "react"

const FlexScaleZeroBoxRoot = styled(Box, { name: "FlexSpacerBoxRoot" })(
  ({ theme }) => ({
    ...FlexScaleZero
  })
)

export const FlexScaleZeroBox = React.forwardRef<HTMLDivElement, BoxProps>(function FlexScaleZeroBox(props, ref) {
  return (
    <FlexScaleZeroBoxRoot
      ref={ref}
      {...props}
    />
  )
})


