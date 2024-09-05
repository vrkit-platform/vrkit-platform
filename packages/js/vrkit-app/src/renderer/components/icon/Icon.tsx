import { getLogger } from "@3fv/logger-proxy"
import {
  FontAwesomeIcon,
  FontAwesomeIconProps
} from "@fortawesome/react-fontawesome"
import { styled, Theme } from "@mui/material"
import { SxProps } from "@mui/system"
import { omit } from "lodash"
import React, { CSSProperties } from "react"
const log = getLogger(__filename)
const { info, debug, warn, error } = log

export interface BaseIconProps {
  sx?: SxProps<Theme>
}

export type FAIconProps = BaseIconProps &
  // HTMLAttributes<HTMLDivElement> &
  Pick<
    FontAwesomeIconProps,
    "size" | "icon" | "spin" | "rotation" | "transform" | "pull"
  > & {
    fa: true
    className?: string
    style?: CSSProperties
    // size?: FontAwesomeIconProps["size"]
    // icon: FontAwesomeIconProps["icon"]
  }

const AppFAIcon = styled<typeof FontAwesomeIcon>(FontAwesomeIcon)(
  ({ theme }) => ({})
)

export type IconProps = FAIconProps

function isFAIconProps(props: any): props is FAIconProps {
  return !!props?.icon && props?.fa
}

export const Icon = React.forwardRef(function Icon(props: IconProps, ref) {
  return isFAIconProps(props) ? (
    <AppFAIcon ref={ref} {...omit(props, ["fa"]) as any} />
  ) : null
})

Icon.defaultProps = {
  size: "sm"
}
