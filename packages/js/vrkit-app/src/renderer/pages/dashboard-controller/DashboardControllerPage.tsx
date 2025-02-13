// REACT
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"

// CLSX
// 3FV
import { getLogger } from "@3fv/logger-proxy"

// MUI
import Box from "@mui/material/Box"
import { styled, useTheme } from "@mui/material/styles"

// ICONS
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown"
import ReloadWindowIcon from "@mui/icons-material/RefreshOutlined"
import DevToolsIcon from "@mui/icons-material/LogoDev"
import IsDefaultDashIcon from "@mui/icons-material/Check"
import ToggleEditorEnabledIcon from "@mui/icons-material/SpaceDashboard"
import { faDesktop, faVrCardboard } from "@awesome.me/kit-79150a3eed/icons/duotone/solid"

// OTHER
import { asOption } from "@3fv/prelude-ts"
import { get } from "lodash/fp"
import { range } from "lodash"
import { isArray, isDefined, toNumber } from "@3fv/guard"

import { Page, PageProps } from "../../components/page"

import clsx from "clsx"

import {
  alpha,
  child,
  dimensionConstraints,
  Ellipsis,
  EllipsisBox,
  Fill,
  flex,
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
  heightConstraint,
  margin,
  OverflowHidden,
  padding,
  PositionRelative,
  rem,
  Transparent
} from "@vrkit-platform/shared-ui"

import classes from "./DashboardControllerPageClasses"

import Button from "@mui/material/Button"
import { useService } from "../../components/service-container"
import { DashboardManagerClient } from "../../services/dashboard-manager-client"
import { AppSettingsClient } from "../../services/app-settings-client"
import { useAppSelector } from "../../services/store"
import { PluginCompEntry, sharedAppSelectors } from "../../services/store/slices/shared-app"
import { ErrorKind, isNotEmpty, isNotEmptyString, stopEvent, Triple } from "@vrkit-platform/shared"
import { PluginOverlayIcon } from "../../components/plugins"
import Alerts, { Alert } from "../../services/alerts/Alerts"
import { DashboardOverlayListItemMaxVisiblePluginCount } from "../../components/dashboards/list-view"
import { AppFAIcon, AppIcon } from "../../components/app-icon"
import { DashboardConfig, OverlayInfo, Timestamp } from "@vrkit-platform/models"
import Paper from "@mui/material/Paper"
import Moment from "react-moment"
import Tooltip from "@mui/material/Tooltip"
import Typography from "@mui/material/Typography"
import { SimpleList, SimpleListItemProps } from "../../components/simple-list"
import OverlayManagerClient from "vrkit-app-renderer/services/overlay-manager-client"
import useMounted from "../../hooks/useMounted"

import ButtonGroup, { buttonGroupClasses as muiButtonGroupClasses } from "@mui/material/ButtonGroup"
import Popper from "@mui/material/Popper"
import Grow from "@mui/material/Grow"
import MenuList from "@mui/material/MenuList"
import ClickAwayListener from "@mui/material/ClickAwayListener"
import MenuItem from "@mui/material/MenuItem"

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
  ...padding(theme.spacing(2), theme.spacing(2)),
  gap: theme.spacing(2),
  [child(classes.header)]: {
    ...FlexColumn,
    ...FlexAuto,
    ...flexAlign("stretch", "center"),
    gap: theme.spacing(2),

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
          fontSize: toNumber(theme.typography.h3.fontSize) * 1.25
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
                backgroundColor: theme.palette.error.main
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
    ...flexAlign("stretch", "stretch"), // ...OverflowHidden,
    [child(classes.overlaysPaper)]: {
      ...FlexColumn,
      //...FlexScaleZero,
      ...flex(0,1,"auto"),
      ...flexAlign("stretch", "stretch"), //  ...OverflowHidden,
      [child(classes.overlaysList)]: {
        overflowX: "hidden",
        overflowY: "auto",

        [child(classes.overlayRow)]: {
          ...FlexRow,
          ...OverflowHidden,
          minHeight: theme.dimen.appBarHeight,
          ...flexAlign("center", "flex-start"),
          ...padding(theme.spacing(1)),
          borderBottom: `1px solid ${alpha(theme.palette.border.selected, 0.1)}`, // "&:last-child": {
          //   borderTop: `1.5px solid
          // ${theme.palette.border.selected}`
          // },
          // "&:not(:last-child)": {
          //   borderBottom: `2px solid
          // ${theme.palette.border.selected}` }, borderRadius:
          // theme.shape.borderRadius,

          [child(classes.overlayDetails)]: {
            ...Ellipsis,
            ...FlexScaleZero,
            ...OverflowHidden,
            ...theme.typography.h4,
            color: alpha(theme.palette.text.primary, 0.75)
          },
          [child(classes.overlayActions)]: {
            ...FlexRowCenter,
            ...FlexAuto,
            ...OverflowHidden,
            ...padding(theme.spacing(0.25), theme.spacing(0.5)),
            gap: theme.spacing(1),
            [child(classes.overlayAction)]: {
              ...OverflowHidden,
              ...FlexRowCenter,
              ...FlexAuto,
              ...padding(0),
              "& > button": {
                ...padding(0),
                ...heightConstraint(rem(2)),
                ...PositionRelative,
                "& > svg": {
                  ...Fill
                }
              }
            }
          }
        }
      }
    }
  }
}))

type MultiLayoutActionInfo = Triple<"VR" | "SCREEN", string, React.ReactNode>

interface MultiLayoutButtonProps {
  icon: React.ReactNode

  actions: MultiLayoutActionInfo[]

  onAction: (action: MultiLayoutActionInfo) => any

  id?: string
}

function MultiLayoutButton({
  icon,
  onAction,
  actions,
  id: inId = "multi-layout-action-button",
  ...other
}: MultiLayoutButtonProps) {
  const isMounted = useMounted(),
    idRef = useRef<string>(null)

  useLayoutEffect(() => {
    if (!idRef.current) {
      const elems = document.querySelectorAll(`#${inId}`)
      idRef.current = `${inId}-${elems.length + 1}`
    }
  }, [isMounted])

  const id = idRef.current,
    theme = useTheme(),
    [current, setCurrent] = useState<MultiLayoutActionInfo>(null),
    [open, setOpen] = useState(false),
    anchorRef = useRef<HTMLDivElement>(null),
    handleMenuItemClick = (event: React.MouseEvent<HTMLLIElement, MouseEvent>, index: number) => {
      stopEvent(event)
      if (!actions.length) {
        return
      }

      setCurrent(actions[index])
      setOpen(false)
      onAction(actions[index])
    },
    handleToggle = () => {
      setOpen(prevOpen => !prevOpen)
    },
    handleClose = (event: Event) => {
      if (anchorRef.current && anchorRef.current.contains(event.target as HTMLElement)) {
        return
      }

      setOpen(false)
    }

  useEffect(() => {
    if (!actions.length) {
      return
    }

    setCurrent(actions[0])
  }, [actions?.[0]])

  return (
    !!actions.length &&
    isArray(current) && (
      <>
        <ButtonGroup
          className={classes.overlayAction}
          variant="outlined"
          color={"primary"}
          ref={anchorRef}
          aria-label="Layout Specific Action"
        >
          <Button
            size="medium"
            data-action={current[0]}
            onClick={handleToggle}
            // startIcon={icon}
          >
            {icon}
            {/*{current[1]}*/}
          </Button>
          {actions.length > 1 && (
            <Button
              size="medium"
              aria-controls={open ? id : undefined}
              aria-expanded={open ? "true" : undefined}
              aria-label="Select alternative layout target"
              aria-haspopup="menu"
              sx={{
                ...padding(theme.spacing(1.5), theme.spacing(0.5)),
                [`&.${muiButtonGroupClasses.grouped}`]: {
                  minWidth: 0,
                  width: "auto"
                }
              }}
              onClick={handleToggle}
            >
              <ArrowDropDownIcon />
            </Button>
          )}
        </ButtonGroup>
        {actions.length > 1 && (
          <Popper
            sx={{
              zIndex: 1
            }}
            open={open}
            anchorEl={anchorRef.current}
            role={undefined}
            transition
            disablePortal
          >
            {({ TransitionProps, placement }) => (
              <Grow
                {...TransitionProps}
                style={{
                  transformOrigin: placement === "bottom" ? "center top" : "center bottom"
                }}
              >
                <Paper>
                  <ClickAwayListener onClickAway={handleClose}>
                    <MenuList
                      id={id}
                      autoFocusItem
                    >
                      {actions
                        // .filter(action => action !== current)
                        .map((action, index) => (
                          <MenuItem
                            key={action[0]}
                            selected={action[0] === current[0]}
                            onClick={event => handleMenuItemClick(event, index)}
                            sx={{
                              ...FlexRow,
                              ...flexAlign("center", "stretch"),
                              gap: theme.spacing(1)
                            }}
                          >
                            {action[2]}
                            <Box>{action[1]}</Box>
                          </MenuItem>
                        ))}
                    </MenuList>
                  </ClickAwayListener>
                </Paper>
              </Grow>
            )}
          </Popper>
        )}
      </>
    )
  )
}

type OverlayControllerItemProps = SimpleListItemProps<
  OverlayInfo,
  {
    config: DashboardConfig
  }
>

function OverlayControllerItem({
  className,
  config,
  item,
  key,
  onSelect,
  selected,
  ...other
}: OverlayControllerItemProps) {
  const overlayClient = useService(OverlayManagerClient),
    handleOpenDevTools = useCallback(
        ([layoutType]: MultiLayoutActionInfo) => {
          log.info(`Handling layout type (${layoutType}) action`)
          overlayClient.openDevTools(item.id, layoutType)
        },
      [overlayClient, item?.id]
    ),
      handleReloadWindow = useCallback(
          ([layoutType]: MultiLayoutActionInfo) => {
            log.info(`Handling reload window, layout type (${layoutType}) action`)
            overlayClient.reloadWindow(item.id, layoutType)
          },
          [overlayClient, item?.id]
      )
  return (
    <Box
      key={key}
      onClick={() => {
        onSelect(item.id)
      }}
      className={clsx(className, classes.overlayRow, {
        selected
      })}
      {...other}
    >
      <Box className={clsx(classes.overlayDetails)}>{item.name}</Box>
      <Box className={clsx(classes.overlayActions)}>
        <MultiLayoutButton
          id={`layout-action-button-group-open-dev-tools-${item.id}`}
          icon={<DevToolsIcon />}
          actions={
            [
              config.vrEnabled && [
                "VR",
                "VR DevTools",
                <AppFAIcon
                  size="sm"
                  icon={faVrCardboard}
                />
              ],
              config.screenEnabled && [
                "SCREEN",
                "Screen DevTools",
                <AppFAIcon
                  size="sm"
                  icon={faDesktop}
                />
              ]
            ].filter(isArray) as MultiLayoutActionInfo[]
          }
          onAction={handleOpenDevTools}
        />
        <MultiLayoutButton
            id={`layout-action-button-group-reload-window-${item.id}`}
            icon={<ReloadWindowIcon />}
            actions={
              [
                config.vrEnabled && [
                  "VR",
                  "Reload VR",
                  <AppFAIcon
                      size="sm"
                      icon={faVrCardboard}
                  />
                ],
                config.screenEnabled && [
                  "SCREEN",
                  "Reload Screen",
                  <AppFAIcon
                      size="sm"
                      icon={faDesktop}
                  />
                ]
              ].filter(isArray) as MultiLayoutActionInfo[]
            }
            onAction={handleReloadWindow}
        />
        {/*<Tooltip title={`Open Developer Tools for Overlay (${item.name})`}>*/}

        {/*<Button*/}
        {/*    size="medium"*/}
        {/*    variant="outlined"*/}
        {/*    color="inherit"*/}
        {/*    className={clsx(classes.overlayAction)}*/}
        {/*    onClick={handleOpenDevTools}*/}
        {/*>*/}
        {/*  <DevToolsIcon/>*/}
        {/*  */}
        {/*</Button>*/}
        {/*</Tooltip>*/}
      </Box>
    </Box>
  )
}

export interface DashboardControllerPageProps extends PageProps {}

export function DashboardControllerPage(props: DashboardControllerPageProps) {
  const theme = useTheme(),
    { className, ...other } = props,
    config = useAppSelector(sharedAppSelectors.selectActiveDashboardConfig),
    overlayClient = useService(OverlayManagerClient),
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
    handleToggleEditorEnabled = useCallback(
      (ev: React.SyntheticEvent<any>) => {
        stopEvent(ev)
        overlayClient.setEditorEnabled(!overlayClient.editorEnabled)
      },
      [overlayClient]
    ),
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
          // lightsEnabled: {
          //   maximize: false
          // },
          right: (
            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={handleCloseDash}
              sx={{
                mr: 1
              }}
            >
              CLOSE
            </Button>
          )
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
                  <Tooltip title={config.screenEnabled ? "Edit Screen Layout" : "Screen Layout Not Enabled"}>
                    <Button
                      size="large"
                      variant="outlined"
                      color="inherit"
                      className={clsx(classes.headerButton)}
                      onClick={handleToggleEditorEnabled}
                    >
                      <ToggleEditorEnabledIcon />
                    </Button>
                  </Tooltip>
                  <Tooltip title={config.vrEnabled ? "Edit VR Layout" : "VR Not Enabled"}>
                    <Button
                      size="large"
                      variant="outlined"
                      color="inherit"
                      className={clsx(classes.headerButton)}
                      onClick={editLayout.execute}
                    >
                      <AppFAIcon
                        size="sm"
                        icon={faVrCardboard}
                      />
                    </Button>
                  </Tooltip>
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
                {isDefault && (
                  <FlexAutoBox sx={{ ...FlexRowCenter }}>
                    <IsDefaultDashIcon color="success" />
                  </FlexAutoBox>
                )}
              </Box>
            </Paper>
          </Box>
          <Box className={classes.overlays}>
            <Typography
              variant="h3"
              sx={{
                mb: theme.spacing(1)
              }}
            >
              Overlays
            </Typography>
            <Paper
              className={classes.overlaysPaper}
              elevation={4}
            >
              <SimpleList<OverlayInfo, { config: DashboardConfig }>
                className={classes.overlaysList}
                itemComponent={OverlayControllerItem}
                itemIdProp="id"
                items={config.overlays}
                itemExtraProps={{ config }}
              />
            </Paper>
          </Box>
        </DashboardControllerPageRoot>
      </If>
    </Page>
  )
}

export default DashboardControllerPage
