import type { BoxProps } from "@mui/material/Box"
import Box from "@mui/material/Box"

import { forwardRef } from "react"
import { useTheme } from "@mui/material/styles"

import { RouterLink } from "../app-router-link"
import {
  FillHeight,
  FlexAuto,
  FlexScaleZeroBox,
  padding,
  rem
} from "@vrkit-platform/shared-ui"
import HelmetLogoSVGRaw from "!!raw-loader!assets/images/logo/helmet-logo.svg"
import Typography from "@mui/material/Typography"
// ----------------------------------------------------------------------

export interface LogoProps extends BoxProps {
  href?: string

  disableLink?: boolean
}

export const Logo = forwardRef<HTMLDivElement, LogoProps>(
  (
    {
      width = "auto",
      height = "100%",
      disableLink = false,
      href = "/",
      sx,
      ...other
    },
    ref
  ) => {
    const theme = useTheme()
    return (
      <>
        <Box
        ref={ref}
        component={RouterLink}
        href={href}
        width={width}
        height={height}
        aria-label="logo"
        sx={{
          ...padding(theme.spacing(0.75),theme.spacing(1)),
          ...FlexAuto,
          verticalAlign: "middle",
          opacity: 0.5,
          maxHeight: "100%",
          "& > svg": {
            ...FillHeight
          },
          
          ...sx
        }}
        {...other}
        
        dangerouslySetInnerHTML={{__html:HelmetLogoSVGRaw}}
        
      />
      <Typography sx={{...FlexAuto}}>VRKit</Typography>
      <FlexScaleZeroBox/>
      </>
    )
  }
)
