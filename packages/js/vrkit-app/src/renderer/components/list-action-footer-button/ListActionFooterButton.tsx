// REACT
// 3FV
import { getLogger } from "@3fv/logger-proxy"
import Button, { ButtonProps } from "@mui/material/Button"
import { styled } from "@mui/material/styles"
// APP
import { ClassNamesKey, createClassNames } from "@vrkit-platform/shared-ui/styles"
import React from "react"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const classPrefix = "listActionFooterButton"
export const listActionFooterButtonClasses = createClassNames(
  classPrefix,
  "child1"
)
export type ListActionFooterButtonClassKey = ClassNamesKey<
  typeof listActionFooterButtonClasses
>

const ListActionFooterButtonRoot = styled<typeof Button>(Button)(
  ({ theme }) => ({
    borderRadius: 0
  })
)

/**
 * ListActionFooterButton Component Properties
 */
export interface ListActionFooterButtonProps extends ButtonProps {
  tabIndex?: number
  autoFocus?: boolean
}

/**
 * ListActionFooterButton Component
 *
 * @param { ListActionFooterButtonProps } props
 * @returns {JSX.Element}
 */
export function ListActionFooterButton(props: ListActionFooterButtonProps) {
  const { color = "inherit", tabIndex = 0, autoFocus = false, ...other } = props

  return (
    <ListActionFooterButtonRoot
      color={color}
      tabIndex={tabIndex}
      autoFocus={autoFocus}
      {...other}
    />
  )
}

export default ListActionFooterButton
