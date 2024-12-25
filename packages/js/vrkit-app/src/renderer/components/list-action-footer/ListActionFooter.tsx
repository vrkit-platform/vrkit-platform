// REACT
// 3FV
import { getLogger } from "@3fv/logger-proxy"
import { buttonBaseClasses, buttonClasses } from "@mui/material"
import { styled } from "@mui/material/styles"
import type { ToolbarProps } from "@mui/material/Toolbar"
// MUI
import Toolbar, { toolbarClasses } from "@mui/material/Toolbar"
// APP
import {
  child,
  ClassNamesKey,
  createClassNames,
  FlexDefaults,
  FlexRow,
  hasCls,
  heightConstraint,
  padding,
  OverflowHidden
} from "@vrkit-platform/shared-ui/styles"
import React from "react"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const classPrefix = "listActionFooter"
export const listActionFooterClasses = createClassNames(
  classPrefix,
  "child1"
)
export type ListActionFooterClassKey = ClassNamesKey<
  typeof listActionFooterClasses
>

const listActionFooterBorder = `1px solid rgba(0, 0, 0, 0.23)`

const ListActionFooterRoot = styled<typeof Toolbar>(Toolbar)(
  ({ theme: { palette, spacing, dimen } }) => ({
    [hasCls(toolbarClasses.root)]: {
      ...FlexRow,
      ...FlexDefaults.stretch,
      ...OverflowHidden,
      ...heightConstraint(dimen.listActionFooterHeight),
      ...padding(0),
      backgroundColor: palette.background.actionFooter,
			borderTop: `1px solid rgba(0, 0, 0, 0.23)`,
      [`& button.${[buttonBaseClasses.root,buttonClasses.root].join(".")}`]: {
        borderLeft: "none",
				borderTop: "none",
				borderBottom: "none",
				"&:not(:last-child)": {
					borderRight: listActionFooterBorder
				}
      }
    }
  })
)

/**
 * ListActionFooter Component Properties
 */
export interface ListActionFooterProps extends ToolbarProps {}

/**
 * ListActionFooter Component
 *
 * @param { ListActionFooterProps } props
 * @returns {JSX.Element}
 */
export function ListActionFooter(props: ListActionFooterProps) {
  const { ...other } = props

  return (
    <ListActionFooterRoot {...other}>{/* Body */}</ListActionFooterRoot>
  )
}

export default ListActionFooter
