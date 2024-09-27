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
import type { Theme } from "@mui/material"
import type { SxProps } from "@mui/system"

// APP
import { borderRadius, ClassNamesKey, createClassNames, dimensionConstraints, hasCls } from "vrkit-app-renderer/styles"
import { useAppSelector } from "vrkit-app-renderer/services/store"
import { sharedAppSelectors } from "vrkit-app-renderer/services/store/slices/shared-app"

import Select, {selectClasses} from "@mui/material/Select"
import MenuItem from "@mui/material/MenuItem"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const classPrefix = "activeDashboardConfigWidget"
export const activeDashboardConfigWidgetClasses = createClassNames(classPrefix, "select")
export type ActiveDashboardConfigWidgetClassKey = ClassNamesKey<typeof activeDashboardConfigWidgetClasses>


const ActiveDashboardConfigWidgetRoot = styled(Box, {
  name: "ActiveDashboardConfigWidgetRoot",
  label: "ActiveDashboardConfigWidgetRoot"
})(({theme}) => ({
  // root styles here
  [`& div.${activeDashboardConfigWidgetClasses.select}` ]: {
    padding: 0,
    ...borderRadius(4),
    [`& > div.${selectClasses.filled}`]: {
      paddingTop: 5,
      paddingBottom: 5,
    }
    
  }
}))


/**
 * ActiveDashboardConfigWidget Component Properties
 */
export interface ActiveDashboardConfigWidgetProps extends BoxProps {

}


/**
 * ActiveDashboardConfigWidget Component
 *
 * @param { ActiveDashboardConfigWidgetProps } props
 * @returns {JSX.Element}
 */
export function ActiveDashboardConfigWidget(props:ActiveDashboardConfigWidgetProps) {
  const { ...other } = props,
      activeId = useAppSelector(sharedAppSelectors.selectActiveDashboardConfigId),
      // activeConfig = useAppSelector(sharedAppSelectors.selectActiveDashboardConfig),
      configs = useAppSelector(sharedAppSelectors.selectDashboardConfigs)

  return <ActiveDashboardConfigWidgetRoot
    
    {...other}
  >
    <Select
        className={clsx(activeDashboardConfigWidgetClasses.select)}
        disableUnderline
        variant="filled" color="success"  id="selectActiveDashboardConfig" value={activeId} label="Dashboard Config"
    
    >
      {configs.map(config => <MenuItem key={config.id} value={config.id}>
        {config.name}
      </MenuItem>)}
    </Select>
  </ActiveDashboardConfigWidgetRoot>
}

export default ActiveDashboardConfigWidget
