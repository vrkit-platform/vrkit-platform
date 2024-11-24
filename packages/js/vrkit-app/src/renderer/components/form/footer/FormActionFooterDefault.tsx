import { Box, Button } from "@mui/material"
import { FlexAuto, FlexRowCenter } from "vrkit-shared-ui/styles"
import { isEmpty } from "lodash"
import React from "react"
import FormActionFooter, { FormActionFooterProps } from "./FormActionFooter"
import { useFormikContext } from "formik"


export interface FormActionFooterDefaultProps<T = any> extends FormActionFooterProps {
  item?: T
  negativeLabel: string
  negativeHandler?: React.MouseEventHandler
  positiveLabel: string
  positiveHandler?: React.MouseEventHandler
}

export function FormActionFooterDefault<T = any>({
  item,
  negativeLabel,
  negativeHandler,
  positiveLabel,
  positiveHandler,
    children,
    sx,
  ...other
}: FormActionFooterDefaultProps<T>) {
  const {isSubmitting, submitForm, resetForm} = useFormikContext<T>()
  return <FormActionFooter {...other}>
    <Box
      sx={{
        ...FlexRowCenter,
        ...FlexAuto,
        gap: 2,
        ...sx
      }}
      {...other}
    >
      {children}
      <Button
        color="error"
        disabled={isSubmitting}
        size="medium"
        variant="outlined"
        onClick={e => {
          e.preventDefault()
          if (negativeHandler) {
            negativeHandler(e)
          } else {
            resetForm()
          }
        }}
      >
        {negativeLabel}
      </Button>
    
      <Button
        color="primary"
        disabled={isSubmitting}
        size="medium"
        variant="contained"
        onClick={e => {
          e.preventDefault()
          positiveHandler ? positiveHandler(e) : submitForm()
        }}
      >
        {positiveLabel}
      </Button>
    </Box>
  </FormActionFooter>
}