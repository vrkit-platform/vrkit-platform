import { Ellipsis } from "../../styles"
import type { TypographyProps } from "@mui/material"
import { styled, Typography } from "@mui/material"

const EllipsisBoxRoot = styled(Typography, { name: "EllipsisBoxRoot" })(
  ({ theme }) => ({
    ...Ellipsis
  })
)

export function EllipsisBox(props: TypographyProps) {
  return <EllipsisBoxRoot {...props} />
}
