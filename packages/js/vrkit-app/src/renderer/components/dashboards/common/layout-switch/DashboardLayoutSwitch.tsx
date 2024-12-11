import { getLogger } from "@3fv/logger-proxy"
import { child, ClassNamesKey, createClassNames, flexAlign, FlexAuto, FlexRowCenter, hasCls } from "vrkit-shared-ui"
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
    gap: theme.spacing(0.25),
    ...FlexRowCenter,
    ...flexAlign("center", "center"),
    ...FlexAuto,

    [child("checkbox")]: {
      ...FlexAuto
    }
  }
}))

export interface DashboardLayoutSwitchProps {
  vr?: boolean

  value: boolean

  disabled?: boolean

  onChange: (enabled: boolean) => void
}

export function DashboardLayoutSwitch({
  vr: isVR = false,
  value,
  disabled,
  onChange,
}: DashboardLayoutSwitchProps) {
  return (
    <DashboardLayoutSwitchRoot className={clsx(classNames.root)}>
      <Typography
        component="span"
        variant="inherit"
        sx={{
          ...FlexAuto,
          opacity: 0.7
        }}
      >
        {isVR ? "VR" : "Screen"}
      </Typography>

      <Checkbox
        id={isVR ? "vrEnabled" : "screenEnabled"}
        name={isVR ? "vrEnabled" : "screenEnabled"}
        sx={{
          ...FlexAuto
        }}
        checked={value}
        onChange={(event: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
          info(`isVR=${isVR} enabled=${checked}`)
          onChange(checked)
          event.preventDefault?.()
          event.stopPropagation?.()
        }}
      />
    </DashboardLayoutSwitchRoot>
  )
}
