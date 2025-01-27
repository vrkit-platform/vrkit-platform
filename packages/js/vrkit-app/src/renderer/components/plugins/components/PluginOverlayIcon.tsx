// REACT
import React from "react"

// CLSX
// 3FV
import { getLogger } from "@3fv/logger-proxy"

import type { BoxProps } from "@mui/material/Box"
// MUI
import { useTheme } from "@mui/material/styles"
import { PluginComponentDefinition } from "@vrkit-platform/models"
import { decodeSvgFromUri, hasProp, isNotEmpty, isSvgUri, propEqualTo } from "@vrkit-platform/shared"
import { alpha, dimensionConstraints, FlexAuto, FlexRowCenterBox, padding } from "@vrkit-platform/shared-ui"
import { asOption } from "@3fv/prelude-ts"
import { get } from "lodash/fp"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

export interface PluginOverlayIconProps extends Omit<BoxProps, "component"> {
  component?: PluginComponentDefinition
  
  moreCount?: number
}

export function PluginOverlayIcon({ component = null, moreCount = 0, sx: providedSx = {}, ...other }: PluginOverlayIconProps) {
  const theme = useTheme(),
      uiRes = component?.uiResource,
      uiIcon = uiRes?.icon,
      color = alpha(theme.palette.text.primary, 0.7),
      iconHtml = asOption(uiIcon)
          .filter(hasProp("url"))
          .filter(propEqualTo("isDataUrl", true))
          .map(get("url"))
          .filter(isSvgUri)
          .map(decodeSvgFromUri)
          .filter(isNotEmpty)
          .getOrNull(),
      sx = {
        ...FlexAuto,
        ...padding(0, theme.spacing(0.25)),
        ...dimensionConstraints(theme.dimen.appIconSizes[2]),
        fill: color,
        color,
        ...providedSx
      } as any
  
  return moreCount > 0 ? (
      <FlexRowCenterBox
          sx={sx}
          {...other}
      >
        +{moreCount}
      </FlexRowCenterBox>
  ) : iconHtml ? (
      <FlexRowCenterBox
          sx={sx}
          dangerouslySetInnerHTML={{ __html: iconHtml }}
          {...other}
      />
  ) : (
      <></>
  )
}

export default PluginOverlayIcon