import Typography, { TypographyProps } from "@mui/material/Typography"

export interface SettingsLabelProps extends TypographyProps {
  bold?: boolean
}

export const SettingsLabel = ({bold = false, ...other}: SettingsLabelProps) => <Typography
  sx={{
    fontWeight: bold ? 700 : 400,
    textAlign: "right"
  }}

  {...other}
/>

