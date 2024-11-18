import { getLogger } from "@3fv/logger-proxy"
import {
  child,
  ClassNamesKey,
  createClassNames,
  Ellipsis,
  flexAlign,
  FlexAuto,
  FlexRowCenter,
  FlexScaleZero,
  hasCls
} from "vrkit-shared-ui"
import { styled } from "@mui/material/styles"
import Box from "@mui/material/Box"
import clsx from "clsx"
import Typography from "@mui/material/Typography"
import Checkbox from "@mui/material/Checkbox"
import React from "react"
const log = getLogger(__filename)
const { info, debug, warn, error } = log

const classPrefix = "dashboardLayoutSwitch"
export const classNames = createClassNames(classPrefix, "root")
export type DashboardLayoutSwitchClassKey = ClassNamesKey<typeof classNames>

const DashboardLayoutSwitchRoot = styled(Box, {
  name: "DashboardLayoutSwitchRoot",
  label: "DashboardLayoutSwitchRoot"
})(({ theme }) => ({
  // root styles here
  [hasCls(classNames.root)]: {
    gap: theme.spacing(1),
    ...FlexRowCenter,
    ...flexAlign("stretch", "center"),
    ...FlexAuto,

    [child("checkbox")]: {
      ...FlexAuto
    }
  }
}))

export interface DashboardLayoutSwitchProps {
  vr?: boolean

  hiddenLabel?: boolean
  hiddenTip?: boolean
  
  label: string

  value: boolean

  disabled?: boolean

  onChange: (enabled: boolean) => void
}

export function DashboardLayoutSwitch({
  vr: isVR = false,
  label,
  value,
  disabled,
  onChange,
    hiddenTip = false,
    hiddenLabel = false
}: DashboardLayoutSwitchProps) {
  return (
    <DashboardLayoutSwitchRoot className={clsx(classNames.root)}>
      {!hiddenLabel || !hiddenTip ? <>
      <Box
        sx={{
          ...FlexScaleZero,
          ...Ellipsis
        }}
      >
        {!hiddenLabel ? <>{label}{" "}</> : null}
        {!hiddenTip ? <Typography
          component="span"
          variant="caption"
          sx={{ opacity: 0.7, fontStyle: "italic" }}
        >
          {value ? "" : "Not "}Enabled
        </Typography> : null}
      </Box>
      </> : null}
      <Checkbox
        sx={{
          ...FlexAuto
        }}
        defaultChecked={value}
        onChange={(event: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
          onChange(checked)
        }}
      />
    </DashboardLayoutSwitchRoot>
  )
}
