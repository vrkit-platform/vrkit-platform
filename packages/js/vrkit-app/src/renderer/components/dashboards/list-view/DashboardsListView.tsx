// REACT
import React, { useCallback, useMemo } from "react"

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
  EllipsisBox,
  Fill,
  FillWidth,
  flex,
  flexAlign,
  FlexAuto,
  FlexAutoBox,
  FlexColumn,
  FlexColumnBox,
  FlexColumnCenterBox,
  FlexRow,
  FlexRowBox,
  FlexRowCenter,
  FlexRowCenterBox,
  FlexScaleZero,
  FlexScaleZeroBox,
  FlexWrap,
  hasCls,
  heightConstraint,
  notHasCls,
  OverflowAuto,
  OverflowHidden,
  padding,
  PositionRelative,
  rem,
  transition
} from "vrkit-shared-ui"
import clsx from "clsx"
import { DashboardConfig, Timestamp } from "vrkit-models"
import Paper from "@mui/material/Paper"
import Typography from "@mui/material/Typography"
import { isNotEmpty } from "vrkit-shared"
import { asOption } from "@3fv/prelude-ts"
import { sharedAppSelectors } from "../../../services/store/slices/shared-app"
import { useAppSelector } from "../../../services/store"
import { DashboardIcon } from "../common/icon"
import { NavLink, useNavigate } from "react-router-dom"
import { WebPaths } from "../../../routes/WebPaths"
import ButtonBase, { ButtonBaseProps } from "@mui/material/ButtonBase"
import AddIcon from "@mui/icons-material/Add"
import { useService } from "../../service-container"
import { DashboardManagerClient } from "../../../services/dashboard-manager-client"
import { useAsyncCallback } from "../../../hooks"
import { useIsMounted } from "usehooks-ts"
import Alerts, { Alert } from "../../../services/alerts"
import IconButton, { IconButtonProps } from "@mui/material/IconButton"
import { faEdit, faEllipsisVertical, faRocketLaunch, faTrash } from "@awesome.me/kit-79150a3eed/icons/sharp/solid"
import { AppFAIcon } from "../../icon"
import { isNotEmptyString } from "vrkit-shared/utils"
import Tooltip from "@mui/material/Tooltip"
import { Divider, Menu } from "@mui/material"
import MenuItem from "@mui/material/MenuItem"
import { faGridHorizontal } from "@awesome.me/kit-79150a3eed/icons/duotone/solid"
import { AppSettingsClient } from "../../../services/app-settings-client"
import { noop } from "lodash"
import { Theme } from "../../../theme/ThemeTypes"
import GlobalStyles from "@mui/material/GlobalStyles"
import Moment from "react-moment"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const classPrefix = "dashboardsListView"
export const dashboardsListViewClasses = createClassNames(
  classPrefix,
  "root",
  "container",
  "item",
  "itemPaper",
  "itemCreateButton",
  "itemAction",
  "itemSelected",
  "itemIsOpen",
  "itemIsDefault",
  "itemDefaultBadge"
)
export type DashboardsListViewClassKey = ClassNamesKey<typeof dashboardsListViewClasses>

function itemActionStyle({ palette, spacing }: Theme) {
  return {
    [`.${dashboardsListViewClasses.itemAction}`]: {
      ...transition(["opacity", "color"]),
      color: "inherit",
      "&:not(.menuAction)": {
        opacity: 0.5,
        transform: "scale(0.85) translateY(-4px)",
        alignSelf: "flex-start",
        "&:hover": {
          opacity: 1,
          "&.delete": {
            color: palette.error.main
          },
          "&.setAsDefault": {
            color: palette.success.main
          }
        }
      },
      "&.menuAction": {
        "&.delete": {
          color: palette.error.main
        }
      },
      gap: spacing(1)
    }
  }
}

const DashboardsListViewRoot = styled(Box, {
  name: "DashboardsListViewRoot",
  label: "DashboardsListViewRoot"
})(({ theme }) => {
  const { palette, spacing } = theme
  return {
    // root styles here
    [hasCls(dashboardsListViewClasses.root)]: {
      // ...flex(1, 1, "30vw"), // ...flexAlign("stretch","stretch"),
      ...FlexScaleZero,
      ...OverflowAuto,
      ...transition(["flex-grow", "flex-shrink"]),
      [child(dashboardsListViewClasses.container)]: {
        // ...FlexRow,
        // ...FlexWrap,
        display: "grid",
        gridTemplateColumns: `1fr 1fr`,
        ...FillWidth,
        ...flexAlign("flex-start", "flex-start"), // [child(dashboardsListViewClasses.itemLink)]: {
        //   textDecoration: "none",
        [child(dashboardsListViewClasses.item)]: {
          ...FlexRowCenter,
          ...OverflowHidden,
          ...PositionRelative, // ...flex(0,
          // 0,
          // "min(33%,
          // 25vw)"),
          ...padding("1rem"),
          ...heightConstraint("max(10rem,33%)"),
          ...flex(1, 0, "min(35%, 30vw)"), // ...widthConstraint("min(35%, 30vw)"),
          ...flexAlign("stretch", "flex-start"),
          [hasCls(dashboardsListViewClasses.itemSelected)]: {},

          [child(dashboardsListViewClasses.itemPaper)]: {
            ...FlexColumn,
            ...Fill,
            ...OverflowHidden,
            ...borderRadius(theme.shape.borderRadius),
            ...padding(spacing(1), spacing(0.5), spacing(0.5), spacing(0.5)),
            gap: "0.5rem",
            textDecoration: "none",
            [hasCls(dashboardsListViewClasses.itemCreateButton)]: {
              ...flexAlign("center", "center")
            },
            [notHasCls(dashboardsListViewClasses.itemCreateButton)]: {
              ...flexAlign("stretch", "stretch")
            },

            [child(dashboardsListViewClasses.itemDefaultBadge)]: {
              ...FlexRowCenter,
              ...padding(spacing(0.25), spacing(0.5)),
              fontSize: rem(0.6),
              borderColor: palette.success.main,
              borderRadius: spacing(0.25),
              borderWidth: 0.5,
              borderStyle: "solid",
              color: palette.success.main
            }
          }
        }
        // }
      }
    },
    ...itemActionStyle(theme)
  }
})

interface DashboardsListItemMenuProps extends Omit<IconButtonProps, "onClick"> {
  config: DashboardConfig

  disabled?: boolean

  isDefault: boolean

  onDelete: () => any

  onSetAsDefault: () => any
}

function DashboardsListItemMenu({
  onDelete,
  onSetAsDefault,
  isDefault,
  config,
  disabled = false,
  ...other
}: DashboardsListItemMenuProps) {
  const id = config.id,
    menuId = `dashboard-item-menu-${id}`,
    buttonId = `dashboard-item-menu-button-${id}`,
    [anchorEl, setAnchorEl] = React.useState<HTMLElement>(null),
    open = Boolean(anchorEl),
    handleClick = (event: React.MouseEvent<HTMLElement>) => {
      setAnchorEl(event.currentTarget)
    },
    newCloseEventHandler =
      (fn: Function = null) =>
      () => {
        if (fn) {
          fn()
        }
        setAnchorEl(null)
      }

  return (
    <>
      <IconButton
        id={buttonId}
        className={clsx(dashboardsListViewClasses.itemAction)}
        aria-controls={open ? menuId : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        onClick={handleClick}
        {...other}
      >
        <AppFAIcon
          icon={faEllipsisVertical}
          size="2xs"
        />
      </IconButton>
      <Menu
        id={menuId}
        MenuListProps={{
          "aria-labelledby": buttonId
        }}
        anchorEl={anchorEl}
        open={open}
        onClose={newCloseEventHandler()}
      >
        <MenuItem
          className={clsx(dashboardsListViewClasses.itemAction, "delete", "menuAction")}
          onClick={newCloseEventHandler(onDelete)}
        >
          <AppFAIcon
            size="2xs"
            icon={faTrash}
          />
          Delete
        </MenuItem>
        {!isDefault && (
          <>
            <Divider sx={{ my: 0.5 }} />
            <MenuItem
              className={clsx(dashboardsListViewClasses.itemAction, "setAsDefault", "menuAction")}
              onClick={newCloseEventHandler(isDefault ? noop : onSetAsDefault)}
            >
              <AppFAIcon
                size="2xs"
                icon={faGridHorizontal}
              />
              Set as Default
            </MenuItem>
          </>
        )}
      </Menu>
    </>
  )
}

export interface DashboardsListItemProps extends Omit<BoxProps, "onClick"> {
  config: DashboardConfig
}

export function DashboardsListItem(props: DashboardsListItemProps) {
  const theme = useTheme(),
    { className, config, ...other } = props,
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
    handleDelete = useCallback(() => {
      if (!isNotEmptyString(config?.id)) {
        Alerts.onError(`Can not delete dashboard config, id is invalid`)
        return
      }

      if (activeId === config.id) {
        Alerts.onError(`Dashboard is currently active, please close it before deleting`)
      } else {
        dashClient.deleteDashboardConfig(config.id)
      }
    }, [config?.id, hasActive, dashClient]),
    toggleOpen = useCallback(() => {
      if (hasActive) {
        dashClient.closeDashboard()
      } else if (isNotEmpty(config?.id)) {
        dashClient.openDashboard(config.id)
      } else {
        Alerts.onError(`No dashboard ID available`)
      }
    }, [config?.id, hasActive, dashClient])

  return (
    <Box
      className={clsx(dashboardsListViewClasses.item, className)}
      {...other}
    >
      <Paper
        elevation={4}
        className={clsx(dashboardsListViewClasses.itemPaper, {
          [dashboardsListViewClasses.itemIsDefault]: isDefault,
          [dashboardsListViewClasses.itemIsOpen]: isActive
        })}
      >
        <FlexRowBox
          sx={{
            ...FlexAuto,
            ...OverflowHidden,
            ...flexAlign("stretch", "stretch"),
            gap: theme.spacing(1)
          }}
        >
          <DashboardIcon
            elevation={4}
            variant="circle"
            size="md"
            icon={"Alien"}
            sx={{ ...FlexAuto }}
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
          <FlexRowCenterBox>
            <Tooltip title="Edit">
              <IconButton
                className={clsx(dashboardsListViewClasses.itemAction)}
                component={NavLink}
                to={WebPaths.app.dashboards + `/${config?.id}/edit`}
              >
                <AppFAIcon
                  size="2xs"
                  icon={faEdit}
                />
              </IconButton>
            </Tooltip>
            <Tooltip title="Launch dashboard">
              <IconButton
                className={clsx(dashboardsListViewClasses.itemAction)}
                onClick={toggleOpen}
              >
                <AppFAIcon
                  size="2xs"
                  icon={faRocketLaunch}
                />
              </IconButton>
            </Tooltip>

            <DashboardsListItemMenu
              config={config}
              onDelete={handleDelete}
              onSetAsDefault={handleSetAsDefault}
              isDefault={isDefault}
            />
          </FlexRowCenterBox>
        </FlexRowBox>
        <FlexScaleZeroBox />
        <FlexRowBox
          sx={{
            ...padding(theme.spacing(0.25), theme.spacing(0.5))
          }}
        >
          <EllipsisBox
            variant="caption"
            sx={{
              ...FlexScaleZero,
              fontSize: rem(0.65),
              opacity: 0.5
            }}
          >
            Modified&nbsp;
            <Moment
              fromNow
              date={Timestamp.toDate(config.fileInfo.modifiedAt)}
            />
          </EllipsisBox>
          <FlexScaleZeroBox />
          {isDefault && <FlexAutoBox className={clsx(dashboardsListViewClasses.itemDefaultBadge)}>DEFAULT</FlexAutoBox>}
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
    <Box className={clsx(dashboardsListViewClasses.item, className)}>
      <Paper
        component={ButtonBase}
        onClick={onClick}
        elevation={4}
        className={clsx(dashboardsListViewClasses.itemPaper, dashboardsListViewClasses.itemCreateButton)}
      >
        <FlexColumnCenterBox
          sx={{
            ...padding(`0.5rem`),
            gap: theme.spacing(1)
          }}
        >
          <AddIcon />
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
        error: ({ err }) => `Unable to create dashboard config: ${err.message ?? err}`
      },
      [isMounted]
    ),
    theme = useTheme(),
    globalStyles = useMemo(() => itemActionStyle(theme), [theme])

  return (
    <>
      <GlobalStyles styles={globalStyles} />
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
          <DashboardsListItemCreate onClick={createDash} />
        </Box>
      </DashboardsListViewRoot>
    </>
  )
}

export default DashboardsListView
