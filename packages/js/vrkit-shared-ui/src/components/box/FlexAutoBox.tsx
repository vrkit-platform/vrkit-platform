import { FlexAuto } from "../../styles"
import type { BoxProps } from "@mui/material"
import { Box, styled } from "@mui/material"
import React from "react"

const FlexAutoBoxRoot = styled(Box, { name: "FlexAutoBoxRoot" })(
  ({ theme }) => ({
    ...FlexAuto
  })
)

export const FlexAutoBox = React.forwardRef(function FlexAutoBox(props: BoxProps, ref) {
  return <FlexAutoBoxRoot ref={ref} {...props} />
})
