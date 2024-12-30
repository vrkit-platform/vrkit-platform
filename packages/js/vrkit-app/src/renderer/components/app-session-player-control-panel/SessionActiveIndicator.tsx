import CircleIcon from "@mui/icons-material/Circle"
import Box from "@mui/material/Box"
import { darken } from "@mui/material/styles"
import {
  FlexAuto,
  PositionAbsolute, PositionRelative,
  rem
} from "@vrkit-platform/shared-ui"
import clsx from "clsx"
import React from "react"
import { getLogger } from "@3fv/logger-proxy"

const log = getLogger(__filename)

function SessionActiveIndicatorCircle({
  sx = {},
  color,
  className,
  ...other
}: Omit<React.ComponentProps<typeof CircleIcon>, "color"> & { color: string }) {
  return (
    <CircleIcon
      className={clsx("indicator", className)}
      sx={{
        ...PositionAbsolute,
        display: "block",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        animationIterationCount: "infinite",
        fill: color,
        width: "100%",
        height: "100%",
        ...sx
      }}
    />
  )
}

export function SessionActiveIndicator({ color, active }: { color: string; active: boolean }) {
  return (
    <Box
      sx={{
        ...FlexAuto,
        ...PositionRelative,
        width: 12,
        height: 12
      }}
    >
      <SessionActiveIndicatorCircle color={color} />
      <SessionActiveIndicatorCircle
        color={darken(color, 0.05)}
        sx={{
          animation: active ? "progress 1s ease-in infinite" : "progress 2s ease-in infinite",
          zIndex: 1, // opacity: 0.5,
          "@keyframes progress": {
            "0%": {
              transform: "scale(0)",
              opacity: 0.3
            },
            "60%": {
              transform: "scale(1.3)",
              opacity: 0.8
            },
            "100%": {
              transform: "scale(1.5)",
              opacity: 0
            }
          },
          fontSize: rem(0.5) as string
        }}
      />
    </Box>
  )
}