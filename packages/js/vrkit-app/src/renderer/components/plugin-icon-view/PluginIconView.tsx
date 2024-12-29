// REACT
import React from "react"

// CLSX
import clsx from "clsx"

// 3FV
import { getLogger } from "@3fv/logger-proxy"

// MUI

// APP
import { AsyncImage, AsyncImageProps } from "../async-image"
import { dimensionConstraints, rem } from "@vrkit-platform/shared-ui"
import { IconSize, type IconSizeKind } from "../../theme"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

export const PluginIconSizes: Record<IconSizeKind, number | string> = {
  sm: rem(1),
  md: rem(2),
  lg: rem(3),
  xl: rem(4)
}

/**
 * PluginIconView Component Properties
 */
export interface PluginIconViewProps extends AsyncImageProps {
  size?: IconSizeKind
}

/**
 * PluginIconView Component
 *
 * @param { PluginIconViewProps } props
 */
export const PluginIconView = React.forwardRef<HTMLDivElement, PluginIconViewProps>(function PluginIconView(
  props: PluginIconViewProps,
  ref
) {
  const { className, size = "lg", sx, ...other } = props

  return (
    <AsyncImage
      unpackIfPossible
      className={clsx(className)}
      ref={ref}
      sx={{
        opacity: 0.7,
        ...dimensionConstraints(PluginIconSizes[size]),
        ...sx
      }}
      {...other}
    />
  )
})

export default PluginIconView
