import { FlexScaleZero } from "vrkit-app-renderer/styles"
import type { BoxProps } from "@mui/material"
import { Box, styled } from "@mui/material"

const FlexScaleZeroBoxRoot = styled(Box, { name: "FlexSpacerBoxRoot" })(
  ({ theme }) => ({
    ...FlexScaleZero
  })
)

export function FlexScaleZeroBox(props: BoxProps) {
  return <FlexScaleZeroBoxRoot {...props} />
}
