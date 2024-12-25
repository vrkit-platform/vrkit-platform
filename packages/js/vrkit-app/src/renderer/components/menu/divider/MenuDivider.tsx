// REACT
import React from "react"

// CLSX
import clsx from "clsx"

// 3FV
import { getLogger } from "@3fv/logger-proxy"

// MUI
import Box from "@mui/material/Box"
import type {BoxProps} from "@mui/material/Box"
import { styled } from "@mui/material/styles"

// APP
import { ClassNamesKey, createClassNames, child } from "@vrkit-platform/shared-ui/styles"
import { Divider, DividerProps } from "@mui/material"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const classPrefix = "menuDivider"
export const menuDividerClasses = createClassNames(classPrefix)
export type MenuDividerClassKey = ClassNamesKey<typeof menuDividerClasses>


const MenuDividerRoot = styled<typeof Divider>(Divider)(({theme}) => ({
  
  padding: 0,
  margin: 0,
  
}))


/**
 * MenuDivider Component Properties
 */
export interface MenuDividerProps extends DividerProps {

}


/**
 * MenuDivider Component
 *
 * @param { MenuDividerProps } props
 * @returns {JSX.Element}
 */
export function MenuDivider(props:MenuDividerProps) {
  const { ...other } = props

  return <MenuDividerRoot
    {...other}
  />
}

export default MenuDivider
