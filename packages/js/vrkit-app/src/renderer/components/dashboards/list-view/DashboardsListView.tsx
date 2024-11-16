// REACT
import React, { useContext, useState } from "react"

// CLSX

// 3FV
import { getLogger } from "@3fv/logger-proxy"

import type { BoxProps } from "@mui/material/Box"
// MUI
import Box from "@mui/material/Box"
import { styled, useTheme } from "@mui/material/styles"

// APP
import {
  alpha, borderRadius,
  child,
  ClassNamesKey,
  createClassNames,
  FillWidth,
  flex,
  flexAlign,
  FlexAutoGrow,
  FlexColumn,
  FlexRowCenter,
  FlexScaleZero,
  hasCls,
  OverflowAuto,
  padding,
  transition
} from "vrkit-shared-ui"
import clsx from "clsx"
import { DashboardConfig } from "vrkit-models"
import Paper from "@mui/material/Paper"
import Typography from "@mui/material/Typography"
import { FlexColumnBox, FlexColumnCenterBox } from "vrkit-shared-ui"
import { isEmpty } from "vrkit-shared"
import { asOption } from "@3fv/prelude-ts"
import { sharedAppSelectors } from "../../../services/store/slices/shared-app"
import { useAppSelector } from "../../../services/store"
import DashboardsViewContext
  from "../../../pages/dashboards/DashboardsViewContext"
import ButtonBase from "@mui/material/ButtonBase"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const classPrefix = "dashboardsListView"
export const dashboardsListViewClasses = createClassNames(
  classPrefix,
  "root",
  "container",
  "item",
  "itemPaper",
  "itemSelected"
)
export type DashboardsListViewClassKey = ClassNamesKey<typeof dashboardsListViewClasses>

const DashboardsListViewRoot = styled(Box, {
  name: "DashboardsListViewRoot",
  label: "DashboardsListViewRoot"
})(({ theme }) => ({
  // root styles here
  [hasCls(dashboardsListViewClasses.root)]: {
    ...flex(1,1,"30vw"), // ...flexAlign("stretch","stretch"),
    ...OverflowAuto,
    ...transition(["flex-grow", "flex-shrink"]),
    [child(dashboardsListViewClasses.container)]: {
      ...FlexColumn,
      ...FillWidth,
      ...flexAlign("stretch", "flex-start"),
      [child(dashboardsListViewClasses.item)]: {
        ...FlexRowCenter,
        ...flex(0, 0, "auto"),
        ...padding("1rem"),

        [hasCls(dashboardsListViewClasses.itemSelected)]: {
        
        },
            
            [child(dashboardsListViewClasses.itemPaper)]: {
              ...FlexRowCenter,
              ...FlexAutoGrow,
              ...borderRadius("0.5rem"),
              ...padding("1rem"),
              gap: "0.5rem"
}
      }
    }
  }
}))

export interface DashboardsListItemProps extends Omit<BoxProps, "onClick"> {
  config: DashboardConfig
}

export function DashboardsListItem(props: DashboardsListItemProps) {
  const
      theme = useTheme(),
      {selectedConfigId, setSelectedConfigId} = useContext(DashboardsViewContext),
      { className, config, ...other } = props,
      selected = selectedConfigId === config?.id

  return (
    <Box
      className={clsx(dashboardsListViewClasses.item, className)}
      {...other}
    >
      <ButtonBase
          onClick={() => {
            setSelectedConfigId(config.id)
          }}
          component={Paper} elevation={2} className={clsx(dashboardsListViewClasses.itemPaper)}>
        <FlexColumnBox sx={{...FlexScaleZero}}>
          <Typography variant="h6">{config.name}</Typography>
          <Typography variant="caption" sx={{
            color: alpha(theme.palette.text.primary,0.5)
          }}>{asOption(config.description).filter(isEmpty).getOrElse("No description")}</Typography>
        </FlexColumnBox>
      </ButtonBase>
    </Box>
  )
}

/**
 * DashboardsListView Component Properties
 */
export interface DashboardsListViewProps extends BoxProps {}

/**
 * DashboardsListView Component
 *
 * @param { DashboardsListViewProps } props
 * @returns {JSX.Element}
 */
export function DashboardsListView(props: DashboardsListViewProps) {
  const { className, ...other } = props,
      configs = useAppSelector(sharedAppSelectors.selectDashboardConfigs),
      {selectedConfigId, setSelectedConfigId} = useContext(DashboardsViewContext)
  
  return <DashboardsListViewRoot
      className={clsx(dashboardsListViewClasses.root, className)}
      {...other}>
    <Box className={clsx(dashboardsListViewClasses.container, className)}>
    {configs.map(config => <DashboardsListItem
        key={config.id}
        config={config}
        // onClick={() => setSelectedConfigId(config.id)}
        // selected={config.id === selectedConfigId}
    />)}
    </Box>
    
  </DashboardsListViewRoot>
}

export default DashboardsListView
