// REACT
import React from "react"

// CLSX
import clsx from "clsx"

// 3FV
import { getLogger } from "@3fv/logger-proxy"

// MUI
import Box, { BoxProps } from "@mui/material/Box"

// APP
import { flex } from "@vrkit-platform/shared-ui"
import { GlobalCSSClassNames } from "../../renderer-constants"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

export interface ElectronDraggableSpacerProps extends BoxProps {
  fillHeight?: boolean
}

export function ElectronDraggableSpacer({ className, fillHeight = false, sx = {}, ...other }: ElectronDraggableSpacerProps) {
  return (
    <Box
      className={clsx(GlobalCSSClassNames.electronWindowDraggable, className)}
      sx={{
        ...flex(1, 5, 0),
        ...sx,
        ...(fillHeight && {height: "-webkit-fill-available"})
      }}
    />
  )
}

export default ElectronDraggableSpacer