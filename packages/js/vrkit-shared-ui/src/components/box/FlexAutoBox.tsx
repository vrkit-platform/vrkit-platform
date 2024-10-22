import { FlexAuto } from "../../styles"
import type { BoxProps } from "@mui/material"
import { Box, styled } from "@mui/material"

const FlexAutoBoxRoot = styled(Box, { name: "FlexAutoBoxRoot" })(
  ({ theme }) => ({
    ...FlexAuto
  })
)

export function FlexAutoBox(props: BoxProps) {
  return <FlexAutoBoxRoot {...props} />
}
