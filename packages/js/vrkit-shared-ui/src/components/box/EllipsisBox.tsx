import { Ellipsis } from "../../styles"
import type { TypographyProps } from "@mui/material"
import { styled, Typography } from "@mui/material"
import React from "react"

const EllipsisBoxRoot = styled(Typography, { name: "EllipsisBoxRoot" })(({ theme }) => ({
  ...Ellipsis
}))

export const EllipsisBox = React.forwardRef(function EllipsisBox(props: TypographyProps, ref) {
  return (
    <EllipsisBoxRoot
      ref={ref as any}
      {...props}
    />
  )
})
