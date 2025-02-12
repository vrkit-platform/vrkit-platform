// REACT
import React, { useCallback, useMemo } from "react"

// CLSX
// 3FV
import { getLogger } from "@3fv/logger-proxy"

// MUI
import Box from "@mui/material/Box"
import { styled, useTheme } from "@mui/material/styles"

// ICONS
import CloseDashIcon from "@mui/icons-material/ExitToApp"

// OTHER
import { asOption } from "@3fv/prelude-ts"
import { get } from "lodash/fp"
import { range } from "lodash"
import { isDefined, toNumber } from "@3fv/guard"

import { Page, PageProps } from "../../components/page"

import clsx from "clsx"

import {
  alpha,
  child,
  dimensionConstraints,
  Ellipsis,
  EllipsisBox,
  Fill,
  flexAlign,
  FlexAuto,
  FlexAutoBox,
  FlexColumn,
  FlexColumnBox,
  FlexRow,
  FlexRowCenter,
  FlexRowCenterBox,
  FlexScaleZero,
  FlexScaleZeroBox,
  margin,
  OverflowAuto,
  OverflowHidden,
  padding,
  PositionRelative,
  rem,
  Transparent
} from "@vrkit-platform/shared-ui"

import classes from "./DashboardControllerPageClasses"
import OpenLayoutEditorIcon from "@mui/icons-material/SpaceDashboard"
import Button from "@mui/material/Button"
import { useService } from "../../components/service-container"
import { DashboardManagerClient } from "../../services/dashboard-manager-client"
import { AppSettingsClient } from "../../services/app-settings-client"
import { useAppSelector } from "../../services/store"
import { PluginCompEntry, sharedAppSelectors } from "../../services/store/slices/shared-app"
import { ErrorKind, isNotEmpty, isNotEmptyString, stopEvent } from "@vrkit-platform/shared"
import { PluginOverlayIcon } from "../../components/plugins"
import Alerts, { Alert } from "../../services/alerts/Alerts"
import {
  DashboardOverlayListItemMaxVisiblePluginCount,
  dashboardsListViewClasses as classNames
} from "../../components/dashboards/list-view"
import { AppIcon } from "../../components/app-icon"
import { Timestamp } from "@vrkit-platform/models"
import Paper from "@mui/material/Paper"
import Moment from "react-moment"
import Tooltip from "@mui/material/Tooltip"
import Typography from "@mui/material/Typography"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const DashboardControllerPageRoot = styled(Box, {
  name: "DashboardControllerPageRoot"
})(({ theme }) => ({
  ...PositionRelative,
  ...FlexScaleZero,
  ...OverflowHidden,
  ...FlexColumn,
  ...flexAlign("stretch", "stretch"),
  [child(classes.header)]: {
    ...FlexColumn,
    ...FlexAuto,
    ...flexAlign("stretch", "center"),
    ...padding(theme.spacing(2), theme.spacing(4)),
    [child(classes.headerPaper)]: {
      ...FlexAuto,
      ...flexAlign("flex-start", "stretch"),
      ...padding(0),
      marginBottom: theme.spacing(1),
      borderRadius: theme.shape.borderRadius * 2,
      ...OverflowHidden,
      [child(classes.headerBottom)]: {
        ...FlexRow,
        ...padding(theme.spacing(1), theme.spacing(1), theme.spacing(1), theme.spacing(1)),
        gap: theme.spacing(1),
        background: theme.palette.background.actionFooter
      },
      [child(classes.headerTop)]: {
        ...FlexRow,
        ...FlexAuto,
        ...OverflowHidden,
        ...flexAlign("stretch", "stretch"),
        ...padding(theme.spacing(2), theme.spacing(1), theme.spacing(2), theme.spacing(1)),
        gap: theme.spacing(1),
        [child(classes.headerTitle)]: {
          ...theme.typography.h3,
          ...FlexAuto,
          ...Ellipsis,
          fontSize: toNumber(theme.typography.h3.fontSize) * 1.25 // fontWeight:
          // 100,
          // opacity: 0.5,
          // textAlign: "center"
        },
        [child(classes.headerInstructions)]: {
          ...FlexRowCenter,
          ...theme.typography.h3,
          fontWeight: 100,
          opacity: 0.5,
          textAlign: "center"
        },
        [child(classes.headerButtons)]: {
          ...FlexRowCenter,
          gap: theme.spacing(1),
          [child(classes.headerButton)]: {
            ...PositionRelative,
            ...dimensionConstraints(rem(3)),
            ...padding(theme.spacing(1)),
            ...margin(0),
            transition: theme.transitions.create(["border-Color", "opacity", "background-color"]),
            borderColor: alpha(theme.palette.primary.contrastText, 0.25),
            backgroundColor: Transparent,
            opacity: 0.5,
            "& svg": {
              ...Fill,
              color: theme.palette.primary.contrastText
            },
            "&:hover": {
              opacity: 1,
              backgroundColor: theme.palette.primary.main,
              borderColor: Transparent,
              "&.colorError": {
                backgroundColor: theme.palette.error.main,
              }
            }
          }
        }
      }
    }
  },
  [child(classes.overlays)]: {
    ...PositionRelative,
    ...FlexColumn,
    ...FlexScaleZero,
    ...flexAlign("stretch", "stretch"),
    ...OverflowAuto,
    [child(classes.overlayRow)]: {
      ...FlexRow,
      ...OverflowHidden,
      borderRadius: theme.shape.borderRadius,

      [child(classes.overlayDetails)]: {
        ...Ellipsis,
        ...FlexScaleZero,
        ...OverflowHidden,
        [child(classes.overlayActions)]: {
          ...FlexRowCenter,
          ...FlexAuto,
          ...OverflowHidden,
          ...padding(theme.spacing(0.25), theme.spacing(0.5)),
          gap: theme.spacing(1),
          [child(classes.overlayAction)]: {
            ...OverflowHidden,
            ...FlexRowCenter,
            ...FlexAuto
          }
        }
      }
    }
  }
}))

export interface DashboardControllerPageProps extends PageProps {}

export function DashboardControllerPage(props: DashboardControllerPageProps) {
  const theme = useTheme(),
    { className, ...other } = props,
    config = useAppSelector(sharedAppSelectors.selectActiveDashboardConfig),
    dashClient = useService(DashboardManagerClient),
    settingsClient = useService(AppSettingsClient),
    defaultId = asOption(useAppSelector(sharedAppSelectors.selectDefaultDashboardConfigId))
      .filter(isNotEmptyString)
      .getOrNull(),
    isDefault = defaultId === config?.id,
    activeId = asOption(useAppSelector(sharedAppSelectors.selectActiveDashboardConfigId))
      .filter(isNotEmptyString)
      .getOrNull(),
    isActive = activeId === config?.id,
    hasActive = !!activeId,
    allOverlayCompEntryMap = useAppSelector(sharedAppSelectors.selectPluginComponentOverlayDefsMap),
    compIds = useMemo(() => {
      return (config?.overlays ?? []).map(get("componentId"))
    }, [config?.overlays]),
    overlayDefs = useMemo(() => {
      return compIds.map(compId => allOverlayCompEntryMap[compId]).filter(isDefined) as PluginCompEntry[]
    }, [allOverlayCompEntryMap, compIds]),
    visibleOverlayDefCount = Math.min(DashboardOverlayListItemMaxVisiblePluginCount, overlayDefs.length),
    moreOverlayDefCount = Math.max(0, overlayDefs.length - DashboardOverlayListItemMaxVisiblePluginCount),
    pluginIcons = range(0, visibleOverlayDefCount)
      .map(idx => overlayDefs[idx][1])
      .filter(isDefined)
      .map(component => {
        if (log.isDebugEnabled()) {
          log.debug(`Creating component icon`, component.id, component)
        }
        return (
          <PluginOverlayIcon
            key={component.id}
            component={component}
          />
        )
      }),
    handleSetAsDefault = useCallback(() => {
      if (!isNotEmptyString(config?.id)) {
        Alerts.onError(`Can not delete dashboard config, id is invalid`)
        return
      }

      if (isDefault) {
        Alerts.onError(`This dashboard is already the default`)
      } else {
        settingsClient.changeSettings({
          defaultDashboardConfigId: config.id
        })
      }
    }, [config?.id, hasActive, dashClient]),
    editLayout = Alert.usePromise(
      async () => {
        const idValid = isNotEmpty(config?.id)
        if (!idValid) {
          Alerts.onError(!idValid ? `Dashboard ID is invalid` : `Dashboard must be open in order to edit the layout`)
          return
        }

        if (!isActive) {
          if (hasActive) {
            info(`Closing active dashboard in order to start layout editor for ${config.id}`)
            await dashClient.closeDashboard()
          }
          info(`Launching dashboard to start layout editor for ${config.id}`)
          await dashClient.openDashboard(config.id)
        }
        info(`Launching dashboard to start layout editor for ${config.id}`)
        await dashClient.launchLayoutEditor(config.id)
      },
      {
        loading: ctx => `Launching layout editor for dashboard (${config.name})`,
        error: ctx => {
          log.error(`Failed to launch layout editor for dashboard ${config.id}`, ctx)
          return `Unable to launch layout editor: ${ctx.err?.message}`
        },
        success: () => `Launch dashboard layout editor`
      },
      [config?.id, isActive, hasActive, dashClient]
    ),
    handleCloseDash = useCallback(
      (ev: React.SyntheticEvent<any>) => {
        const handleError = (err: ErrorKind) => {
          const msg = `Failed to close dashboard: ${err.message}`
          log.error(msg, err)
          Alert.onError(msg)
        }
        try {
          stopEvent(ev)
          dashClient.closeDashboard().catch(handleError)
        } catch (err) {
          handleError(err)
        }
      },
      [config?.id, hasActive, dashClient]
    )

  return (
    <Page
      metadata={{
        title: "Dash Controller",
        appTitlebar: {
          lightsEnabled: {
            maximize: false
          }
        }
      }}
    >
      <If condition={!!config}>
        <DashboardControllerPageRoot className={clsx(className)}>
          <Box className={classes.header}>
            <Paper
              elevation={4}
              className={clsx(classes.headerPaper)}
            >
              <Box className={clsx(classes.headerTop)}>
                <AppIcon
                  elevation={4}
                  variant="circle"
                  size="xl"
                  icon={asOption(config?.uiResource?.icon?.url).getOrElse("Alien")}
                  sx={{ ...FlexAuto }}
                />

                <FlexColumnBox
                  sx={{
                    ...FlexScaleZero,
                    ...OverflowHidden,
                    ...flexAlign("stretch", "stretch"),
                    ...padding(0, theme.spacing(1), 0, 0)
                  }}
                >
                  <Typography className={classes.headerTitle}>{config.name}</Typography>

                  <Typography variant="subtitle2">
                    {asOption(config.description).filter(isNotEmpty).getOrElse("No notes")}
                  </Typography>
                </FlexColumnBox>
                <Box className={clsx(classes.headerButtons)}>
                  <Button
                    size="large"
                    variant="outlined"
                    color="inherit"
                    className={clsx(classes.headerButton)}
                    onClick={editLayout.execute}
                  >
                    <OpenLayoutEditorIcon />
                  </Button>
                  <Button
                    size="large"
                    variant="outlined"
                    color="error"
                    className={clsx(classes.headerButton, "colorError")}
                    onClick={handleCloseDash}
                  >
                    <CloseDashIcon />
                  </Button>
                </Box>
              </Box>

              <FlexScaleZeroBox />

              <Box className={clsx(classes.headerBottom)}>
                <Tooltip title="Dashboard includes these plugins">
                  <FlexRowCenterBox
                    sx={{
                      ...FlexAuto,
                      paddingLeft: theme.spacing(0.5),
                      gap: theme.spacing(1)
                    }}
                  >
                    {/*<Typography variant="caption">&nbsp;</Typography>*/}
                    {pluginIcons}
                    <PluginOverlayIcon moreCount={moreOverlayDefCount} />
                  </FlexRowCenterBox>
                </Tooltip>
                <EllipsisBox
                  variant="body2"
                  sx={{
                    ...FlexRow,
                    ...FlexScaleZero,
                    ...flexAlign("center", "flex-end"),
                    opacity: 0.35
                  }}
                >
                  modified&nbsp;
                  <Moment
                    fromNow
                    date={asOption(config.fileInfo?.modifiedAt)
                      .map(it => Timestamp.toDate(it))
                      .getOrCall(() => Timestamp.toDate(Timestamp.now()))}
                  />
                </EllipsisBox>
                {isActive && <FlexAutoBox className={clsx(classNames.itemActiveBadge)}>ACTIVE</FlexAutoBox>}
                {isDefault && <FlexAutoBox className={clsx(classNames.itemDefaultBadge)}>DEFAULT</FlexAutoBox>}
              </Box>
            </Paper>
            {/*<Box className={classes.headerInstructions}>*/}
            {/*  Manage your dashboard from this window.*/}
            {/*</Box>*/}
            <Box className={classes.headerButtons}>
              {/*<AppIconButton*/}
              {/*    tooltip={"Layout Editor"}*/}
              {/*    size="large"*/}
              {/*    variant="contained"*/}
              {/*    color="primary"*/}
              {/*    className={clsx(classes.headerButton)}*/}
              {/*    onClick={editLayout.execute}*/}
              {/*>*/}
              {/*  <OpenLayoutEditorIcon />*/}
              {/*</AppIconButton>*/}
              {/*<ButtonGroup>*/}
              {/*  <Button onClick={editLayout.execute}>*/}
              {/*    Launch VR Layout Editor*/}
              {/*  </Button>    */}
              {/*</ButtonGroup>*/}
              {/*<Button*/}
              {/*    size="large"*/}
              {/*    variant="contained"*/}
              {/*    color="primary"*/}
              {/*    className={clsx(classes.headerButton)}*/}
              {/*    onClick={editLayout.execute}*/}
              {/*>*/}
              {/*  <OpenLayoutEditorIcon />*/}
              {/*</Button>*/}
            </Box>
          </Box>
          <Box className={classes.overlays}></Box>
        </DashboardControllerPageRoot>
      </If>
    </Page>
  )
}

export default DashboardControllerPage
