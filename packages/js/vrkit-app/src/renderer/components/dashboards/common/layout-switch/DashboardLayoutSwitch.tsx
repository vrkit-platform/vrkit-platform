import { getLogger } from "@3fv/logger-proxy"
import { child, ClassNamesKey, createClassNames, flexAlign, FlexAuto, FlexColumnCenter, hasCls } from "@vrkit-platform/shared-ui"
import { styled } from "@mui/material/styles"
import { faDesktop, faVrCardboard } from "@awesome.me/kit-79150a3eed/icons/duotone/solid"
import Box from "@mui/material/Box"
import clsx from "clsx"
import Checkbox from "@mui/material/Checkbox"
import React from "react"
import { AppFAIcon } from "../../../app-icon"
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
    ...FlexColumnCenter,
    ...flexAlign("center", "center"),
    ...FlexAuto,
    flexDirection: "column-reverse",
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

export function DashboardLayoutSwitch({ vr: isVR = false, value, disabled, onChange }: DashboardLayoutSwitchProps) {
  return (
    <DashboardLayoutSwitchRoot className={clsx(classNames.root)}>
      <AppFAIcon
        size="lg"
        icon={isVR ? faVrCardboard : faDesktop}
      />

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
