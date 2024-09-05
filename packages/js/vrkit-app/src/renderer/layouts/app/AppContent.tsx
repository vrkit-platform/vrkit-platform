import type { BoxProps } from "@mui/material/Box"
import Box from "@mui/material/Box"
import { useTheme } from "@mui/material/styles"

import { useSettingsContext } from "vrkit-app-renderer/components/settings"


interface AppContentProps extends BoxProps {}

export function AppContent({ sx, children, ...other }: AppContentProps) {
  
  return (
    <Box
      sx={{
        display: "flex",
        flex: "1 1 0",
        flexDirection: "column",
        ...sx
      }}
      {...other}
    >
      {children}
    </Box>
  )
}
