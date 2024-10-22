import type { BoxProps } from "@mui/material/Box"
import Box from "@mui/material/Box"
import { useTheme } from "@mui/material/styles"

import { useSettingsContext } from "vrkit-app-renderer/components/settings"
import { FillHeight, flexAlign, OverflowHidden } from "vrkit-shared-ui"


interface AppContentProps extends BoxProps {}

export function AppContent({ sx, children, ...other }: AppContentProps) {
  
  return (
    <Box
      sx={{
        display: "flex",
        flex: "1 1 0",
        flexDirection: "column",
        ...FillHeight,
        ...OverflowHidden,
        ...flexAlign("stretch","stretch"),
        ...sx
      }}
      {...other}
    >
      {children}
      
    </Box>
  )
}
