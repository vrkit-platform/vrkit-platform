// REACT
import React from "react"

// CLSX
// 3FV
import { getLogger } from "@3fv/logger-proxy"

import type { BoxProps } from "@mui/material/Box"
// MUI
import Box from "@mui/material/Box"
import { styled, useTheme } from "@mui/material/styles"

// APP
import {
  alpha,
  borderRadius,
  child,
  ClassNamesKey,
  createClassNames,
  Ellipsis,
  Fill,
  FillWidth,
  flex,
  flexAlign,
  FlexAuto,
  FlexAutoGrow, FlexColumn,
  FlexColumnBox,
  FlexColumnCenter,
  FlexColumnCenterBox,
  FlexRow,
  FlexRowBox,
  FlexRowCenter,
  FlexScaleZero,
  FlexWrap,
  hasCls,
  heightConstraint,
  OverflowAuto,
  OverflowHidden,
  padding,
  PositionRelative,
  transition,
  widthConstraint
} from "vrkit-shared-ui"
import clsx from "clsx"
import { DashboardConfig } from "vrkit-models"
import Paper from "@mui/material/Paper"
import Typography from "@mui/material/Typography"
import { isNotEmpty } from "vrkit-shared"
import { asOption } from "@3fv/prelude-ts"
import { sharedAppSelectors } from "../../../services/store/slices/shared-app"
import { useAppSelector } from "../../../services/store"
import { useModelEditorContext } from "../../model-editor-context"
import { DashboardIcon } from "../common/icon"
import { NavLink, useNavigate } from "react-router-dom"
import { WebPaths } from "../../../routes/WebPaths"
import ButtonBase, { ButtonBaseProps } from "@mui/material/ButtonBase"
import AddIcon from "@mui/icons-material/Add"
import { useService } from "../../service-container"
import {
  DashboardManagerClient
} from "../../../services/dashboard-manager-client"
import { useAsyncCallback } from "../../../hooks"
import { useIsMounted } from "usehooks-ts"
import { FormikContextType } from "formik"
import { Alert } from "../../../services/alerts"

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
    // ...flex(1, 1, "30vw"), // ...flexAlign("stretch","stretch"),
    ...FlexScaleZero,
    ...OverflowAuto,
    ...transition(["flex-grow", "flex-shrink"]),
    [child(dashboardsListViewClasses.container)]: {
      ...FlexRow,
      ...FlexWrap,
      ...FillWidth,
      ...flexAlign("flex-start", "flex-start"), // [child(dashboardsListViewClasses.itemLink)]: {
      //   textDecoration: "none",
      [child(dashboardsListViewClasses.item)]: {
        ...FlexRowCenter,
        ...OverflowHidden,
        ...PositionRelative,
        // ...flex(0, 0, "min(33%, 25vw)"),
        ...padding("1rem"),
        ...heightConstraint("max(10rem,33%)"),
        ...widthConstraint("min(33%, 25vw)"),
        ...flexAlign("stretch", "flex-start"),
        [hasCls(dashboardsListViewClasses.itemSelected)]: {},

        [child(dashboardsListViewClasses.itemPaper)]: {
          ...FlexColumn,
          ...Fill,
          ...OverflowHidden,
          ...flexAlign("stretch", "stretch"),
          // ...flexAlign("stretch", "center"),
          ...borderRadius("0.5rem"),
          ...padding("1rem","1rem","1rem","0.5rem"),
          gap: "0.5rem",
          textDecoration: "none"
        }
      }
      // }
    }
  }
}))

export interface DashboardsListItemProps extends Omit<BoxProps, "onClick"> {
  config: DashboardConfig
}



export function DashboardsListItem(props: DashboardsListItemProps) {
  const theme = useTheme(),
    { className, config, ...other } = props

  return (
    <Box
      className={clsx(dashboardsListViewClasses.item, className)}
      {...other}
    >
      <Paper
        component={NavLink}
        to={WebPaths.app.dashboards + `/${config?.id}/edit`}
        elevation={4}
        className={clsx(dashboardsListViewClasses.itemPaper)}
      >
        <FlexRowBox sx={{
          ...FlexAuto,
          ...OverflowHidden,
          ...flexAlign("stretch","stretch"),
          gap: theme.spacing(1) }}>
          <DashboardIcon
            elevation={4}
            variant="circle"
            size="md"
            icon={"Alien"}
            sx={{...FlexAuto}}
          />

          <FlexColumnBox
            sx={{
              ...FlexScaleZero,
              ...OverflowHidden,
              ...flexAlign("stretch", "stretch"),
              ...padding(0, `0.5rem`, 0, 0)
            }}
          >
            <Typography
              sx={{
                ...FlexScaleZero,
                ...Ellipsis
            }}
              variant="body1"
            >
              {config.name}
            </Typography>

            <Typography
              variant="caption"
              sx={{
                color: alpha(theme.palette.text.primary, 0.5)
              }}
            >
              {asOption(config.description).filter(isNotEmpty).getOrElse("No notes")}
            </Typography>
          </FlexColumnBox>
        </FlexRowBox>
      </Paper>
    </Box>
  )
}

export interface DashboardsListItemCreateProps extends Omit<BoxProps, "onClick"> {
  onClick: ButtonBaseProps["onClick"]
}

export function DashboardsListItemCreate(props: DashboardsListItemCreateProps) {
  const theme = useTheme(),
      { className, onClick, ...other } = props
  
  return (
      <Box
          className={clsx(dashboardsListViewClasses.item, className)}
      >
        <Paper
            component={ButtonBase}
            onClick={onClick}
            elevation={4}
            className={clsx(dashboardsListViewClasses.itemPaper)}
        >
          {/*<FlexRowBox sx={{ ...FlexAuto, gap: theme.spacing(1) }}>*/}
          {/*  */}
          <FlexColumnCenterBox
                sx={{
                  ...padding(`0.5rem`),
                  gap: theme.spacing(1)
                }}
            >
              <AddIcon/>
              <Typography
                  variant="body1"
                  sx={{
                    color: alpha(theme.palette.text.primary, 0.5)
                  }}
              >
                Create
              </Typography>
            </FlexColumnCenterBox>
          {/*</FlexRowBox>*/}
        </Paper>
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
      isMounted = useIsMounted(),
      configs = useAppSelector(sharedAppSelectors.selectDashboardConfigs),
      dashboardClient = useService(DashboardManagerClient),
      nav = useNavigate(),
      createDashAsync = useAsyncCallback(dashboardClient.createDashboardConfig),
      createDash = Alert.usePromise(
          async (): Promise<DashboardConfig> => {
            try {
              // CREATE NEW DASH CONFIG
              const newDashConfig = await createDashAsync.execute()
              log.info(`Created new dashboard config (${newDashConfig.id}`)
              if (isMounted) {
                nav(WebPaths.app.dashboards + `/${newDashConfig.id}/edit`)
              }
              return newDashConfig
            } catch (err) {
              log.error(err)
              throw err
            }
          },
          {
            loading: "Creating dashboard...",
            success: ({ result }) => `"Successfully created dashboard (${result.name})."`,
            error: ({err})  => `Unable to create dashboard config: ${err.message ?? err}`
          },
          [isMounted]
      )
    

  return (
    <DashboardsListViewRoot
      className={clsx(dashboardsListViewClasses.root, className)}
      {...other}
    >
      <Box className={clsx(dashboardsListViewClasses.container, className)}>
        {configs.map(config => (
          <DashboardsListItem
            key={config.id}
            config={config}
          />
        ))}
        <DashboardsListItemCreate onClick={createDash}/>
      </Box>
    </DashboardsListViewRoot>
  )
}

export default DashboardsListView
