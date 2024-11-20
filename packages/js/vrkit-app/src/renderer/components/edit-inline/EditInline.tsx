// REACT
import React, { useState } from "react"

// CLSX
import clsx from "clsx"

// 3FV
import { getLogger } from "@3fv/logger-proxy"

// MUI
import Box from "@mui/material/Box"
import type {BoxProps} from "@mui/material/Box"
import { styled } from "@mui/material/styles"
import InputBase, { InputBaseProps } from "@mui/material/InputBase"

// APP
import { ClassNamesKey, createClassNames, dimensionConstraints, child, hasCls } from "vrkit-shared-ui"
import { isDefined } from "@3fv/guard"
import { asOption } from "@3fv/prelude-ts"
import Typography, { TypographyProps } from "@mui/material/Typography"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const classPrefix = "editInline"
export const editInlineClasses = createClassNames(classPrefix, "root", "view", "input")
export type EditInlineClassKey = ClassNamesKey<typeof editInlineClasses>


const EditInlineViewRoot = styled(Typography, {
  name: "EditInlineViewRoot",
  label: "EditInlineViewRoot"
})(({theme}) => ({
  // root styles here
  [hasCls([editInlineClasses.root,editInlineClasses.view])]: {
    
  }
}))

const EditInlineInputRoot = styled(InputBase, {
  name: "EditInlineInputRoot",
  label: "EditInlineInputRoot"
})(({theme}) => ({
  // root styles here
  [hasCls([editInlineClasses.root,editInlineClasses.view])]: {
    
  }
}))


/**
 * EditInline Component Properties
 */
export interface EditInlineProps {
  editing?: boolean
  value: string
  placeholder?: string | undefined
  onEditing?: (editing: boolean) => void
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  
  InputProps?: InputBaseProps
  ViewProps?: TypographyProps
}


/**
 * EditInline Component
 *
 * @param { EditInlineProps } props
 * @returns {JSX.Element}
 */
export function EditInline(props:EditInlineProps) {
  const
      { 
        value, 
        placeholder = "", 
        onEditing, 
        onChange, 
        editing:providedEditing, 
        ViewProps: {className: viewClassName, ...viewOther} = {},
        InputProps: {className: inputClassName, ...inputOther} = {} } = props,
      [internalEditing, setInternalEditing] = useState(providedEditing)
  
  const
      isEditingProvided = isDefined(props.editing),
      editing = isEditingProvided ? providedEditing : internalEditing,
      onInternalEditing = (updatedEditing: boolean) => {
        if (isEditingProvided)
          onEditing(updatedEditing)
        else
          setInternalEditing(updatedEditing)
      }
  
  
  return !editing ? (
    <EditInlineViewRoot
      onClick={() => {
        onInternalEditing(true)
      }}
      className={clsx(editInlineClasses.root,editInlineClasses.view, viewClassName, {})}
      {...viewOther}
    >
      {asOption(value).getOrElse(placeholder)}
    </EditInlineViewRoot>
  ) : (
    <EditInlineInputRoot
      autoFocus
      value={value}
      onChange={onChange}
      className={clsx(editInlineClasses.root,editInlineClasses.view, inputClassName, {})}
      onBlur={() => onInternalEditing(false)}
      {...inputOther}
    />
  )
}

export default EditInline


