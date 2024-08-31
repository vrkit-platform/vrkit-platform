import type { BoxProps } from "@mui/material/Box"
import Box from "@mui/material/Box"

import { forwardRef, useId } from "react"
import { useTheme } from "@mui/material/styles"

import { RouterLink } from "vrkit-app-renderer/routes/components"

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

    const gradientId = useId()

    const palette = theme.vars.palette

    const PRIMARY_LIGHT = theme.vars.palette.primary.light

    const PRIMARY_MAIN = theme.vars.palette.primary.main

    const PRIMARY_DARK = theme.vars.palette.primary.dark

    const logo = (
      <svg
        id="Layer_1"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 617.06 149"
      >
        <path
          fill={"#333"}
          d="M.5,12.09v124.83c0,6.4,4.5,11.59,10.05,11.59h110.07c2.79,0,5.45-1.33,7.35-3.68l14.93-18.43c3.97-4.91,10.72-4.91,14.7,0l14.93,18.43c1.9,2.35,4.56,3.68,7.35,3.68h110.07c5.55,0,10.05-5.19,10.05-11.59V12.09c0-6.4-4.5-11.59-10.05-11.59H10.55C5,.5.5,5.69.5,12.09Z"
        />
        <g fill={palette.primary.contrastText}>
          <path d="M360.17,76.92l-29.28,22.39,14.85-7.23-4.95,24.34h-29.71l19.8-97.34h29.71l-7.07,34.91,48.38-34.91h34.66l-53.47,40.47,38.62,56.88h-34.66l-26.88-39.49Z" />
          <path d="M446.74,116.42l19.8-97.34h29.71l-4.67,22.67h-17.4l16.41,4.87-14.15,69.81h-29.71Z" />
          <path d="M516.06,19.07h101l-4.67,22.67h-50.5l16.55,4.87-14.29,69.81h-32.96l15.14-74.68h-34.94l4.67-22.67Z" />
        </g>
        <g fill={palette.primary.contrastText}>
          <path d="M139.07,19.07l-51.21,97.34h-49.51L20.24,19.07h31.4l13.86,69.81-16.55,4.87h17.54L104.41,19.07h34.66Z" />
          <path d="M215.88,88.88h-36.21l-5.66,27.54h-29.71l19.8-97.34h95.34c2.64,0,5.07.53,7.29,1.6,2.21,1.07,4.05,2.5,5.52,4.31,1.46,1.81,2.52,3.87,3.18,6.19.66,2.32.75,4.73.28,7.23l-7.64,37.41c-.76,3.8-2.64,6.93-5.66,9.39-3.02,2.46-6.51,3.68-10.47,3.68h-6.37l12.59,27.54h-29.71l-12.59-27.54ZM237.66,66.08c.75,0,1.44-.23,2.05-.7.61-.46,1.01-1.07,1.2-1.81l3.54-17.94c.19-1.02-.02-1.92-.64-2.71-.61-.79-1.44-1.18-2.48-1.18h-69.6l16.41,4.87-3.96,19.47h53.47Z" />
        </g>
      </svg>
    )
    return (
      <Box
        ref={ref}
        component={RouterLink}
        href={href}
        width={width}
        height={height}
        aria-label="logo"
        sx={{
          flexShrink: 0,
          flex: "1 0 16rem",
          display: "flex",
          verticalAlign: "middle",
          ...sx
        }}
        {...other}
      >
        {logo}
      </Box>
    )
  }
)
