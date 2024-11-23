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

export type AppIconProps = BaseIconProps &
    // HTMLAttributes<HTMLDivElement> &
    Pick<
        FontAwesomeIconProps,
        "size" | "icon" | "spin" | "rotation" | "transform" | "pull"
    > & {
  fa?: true
  className?: string
  style?: CSSProperties
  // size?: FontAwesomeIconProps["size"]
  // icon: FontAwesomeIconProps["icon"]
}

export type AppFAIconProps = Omit<AppIconProps, "fa">

const AppFAIconRoot = styled<typeof FontAwesomeIcon>(FontAwesomeIcon)(
  ({ theme }) => ({
    color: "inherit"
  })
)

export const AppFAIcon = React.forwardRef(function AppFAIcon(props: AppFAIconProps, ref) {
  const {size = "sm",...other} = props
  return <AppFAIconRoot ref={ref} size={size} {...omit(other, ["fa"]) as any} />
})


export const AppIcon = React.forwardRef(function AppIcon(props: AppIconProps, ref) {
  const {size = "sm",fa = false,...other} = props
  return fa ? (
    <AppFAIconRoot ref={ref} size={size} {...other as any} />
  ) : null
})

