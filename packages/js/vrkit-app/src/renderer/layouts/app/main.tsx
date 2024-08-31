import type { BoxProps } from "@mui/material/Box"
import Box from "@mui/material/Box"
import { useTheme } from "@mui/material/styles"

import { useSettingsContext } from "vrkit-app-renderer/components/settings"
import {
  dimensionConstraints,
  Fill,
  FlexColumn,
  OverflowHidden
} from "../../styles"

// ----------------------------------------------------------------------

type MainProps = BoxProps & {}

export function Main({ children, sx, ...other }: MainProps) {
  const theme = useTheme()
  return (
    <Box
      component="main"
      
      sx={{
        position: "absolute",
        display: "flex",
        // ...dimensionConstraints("100%", "100%"),
        top: theme.dimen.appBarHeight,
        left: 0,
        right: 0,
        bottom: 0,
        ...OverflowHidden,
        // paddingTop: theme.dimen.appBarHeight,
        // flex: "1 1 0",
        //flexDirection: "column",
        ...sx
      }}
      {...other}
    >
      <Box sx={{...FlexColumn}}>
      {children}
      </Box>
    </Box>
  )
}

// ----------------------------------------------------------------------

interface AppContentProps extends BoxProps {}

export function AppContent({ sx, children, ...other }: AppContentProps) {
  const theme = useTheme()

  const settings = useSettingsContext()

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
