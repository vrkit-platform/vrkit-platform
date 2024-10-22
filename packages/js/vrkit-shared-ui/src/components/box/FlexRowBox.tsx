import { FlexAuto, FlexRow, FlexRowCenter } from "../../styles"
import type { BoxProps } from "@mui/material"
import { Box, styled } from "@mui/material"

const FlexRowBoxRoot = styled(Box, { name: "FlexRowBoxRoot" })(({ theme }) => ({
  ...FlexRow,
  ...FlexAuto
}))

const FlexRowCenterBoxRoot = styled(Box, { name: "FlexRowBoxRoot" })(
  ({ theme }) => ({
    ...FlexRowCenter,
    ...FlexAuto
  })
)

export function FlexRowBox(props: BoxProps) {
  return <FlexRowBoxRoot {...props} />
}

export function FlexRowCenterBox(props: BoxProps) {
  return <FlexRowCenterBoxRoot {...props} />
}
