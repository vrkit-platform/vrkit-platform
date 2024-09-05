import {
  FlexAuto,
  FlexColumn,
  FlexColumnCenter
} from "vrkit-app-renderer/styles"
import type { BoxProps } from "@mui/material"
import { Box, styled } from "@mui/material"

const FlexColumnBoxRoot = styled(Box, { name: "FlexColumnBoxRoot" })(
  ({ theme }) => ({
    ...FlexColumn,
    ...FlexAuto
  })
)

const FlexColumnCenterBoxRoot = styled(Box, { name: "FlexColumnBoxRoot" })(
  ({ theme }) => ({
    ...FlexColumnCenter,
    ...FlexAuto
  })
)

export function FlexColumnBox(props: BoxProps) {
  return <FlexColumnBoxRoot {...props} />
}

export function FlexColumnCenterBox(props: BoxProps) {
  return <FlexColumnCenterBoxRoot {...props} />
}
