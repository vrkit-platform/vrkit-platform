// REACT
import React, { useCallback, useMemo, useState } from "react"

// CLSX
import clsx from "clsx"

// 3FV
import { getLogger } from "@3fv/logger-proxy"

// MUI
import Box from "@mui/material/Box"
import { lighten, styled, useTheme } from "@mui/material/styles"

// APP
import {
  alpha,
  child,
  ClassNamesKey,
  createClassNames,
  Ellipsis,
  EllipsisBox,
  FillWidth,
  flex,
  flexAlign,
  FlexColumn,
  FlexColumnBox,
  FlexRow,
  FlexScaleZero,
  hasCls,
  OverflowHidden,
  OverflowVisible,
  padding,
  Transparent
} from "@vrkit-platform/shared-ui"
import TabPanel, { type TabPanelProps } from "@mui/lab/TabPanel"
import { PluginViewModeKind } from "../plugins-tab-view/PluginsTabViewTypes"
import { useAppSelector } from "../../services/store"
import { sharedAppSelectors } from "../../services/store/slices/shared-app"
import { isString } from "@3fv/guard"
import { PluginManifest } from "@vrkit-platform/models"
import { FilterableList, FilterableListItemProps } from "../filterable-list"
import ListItem from "@mui/material/ListItem"
import { isNotEmptyString, propEqualTo } from "@vrkit-platform/shared"
import NoData from "../no-data"
import PluginManifestView, { getPluginActions, PluginManifestActionKind } from "../plugin-manifest-view"
import ListItemIcon from "@mui/material/ListItemIcon"
import PluginIconView from "../plugin-icon-view"
import Typography from "@mui/material/Typography"
import { asOption } from "@3fv/prelude-ts"
import ButtonBase from "@mui/material/ButtonBase"
import PluginManifestActionsButton, {
  createPluginManifestActionHandler
} from "../plugin-manifest-view/PluginManifestActionsButton"
import { useService } from "../service-container"
import { PluginManagerClient } from "../../services/plugin-manager-client"
import { Alert } from "../../services/alerts"
import { capitalize } from "lodash"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const classPrefix = "pluginsTabPanel"
export const pluginsTabPanelClasses = createClassNames(
  classPrefix,
  "root",
  "list",
  "listFilter",
  "listItems",
  "listItem",
  "listItemAction",
  "listItemSelected",
  "details",
  "detailsNone",
  "detailsSelected"
)
const classes = pluginsTabPanelClasses

export type PluginsTabPanelClassKey = ClassNamesKey<typeof pluginsTabPanelClasses>

const PluginsTabPanelRoot = styled(TabPanel, {
  name: "PluginsTabPanelRoot",
  label: "PluginsTabPanelRoot"
})(
  ({
    theme: {
      dimen,
      palette,
      shape,
      customShadows,
      shadows,
      components,
      colors,
      transitions,
      typography,
      insetShadows,
      mixins,
      zIndex,
      spacing
    }
  }) => ({
    // root styles here
    [hasCls(classes.root)]: {
      padding: 0,
      ["&:not([hidden])"]: {
        ...FlexRow,
        ...FillWidth,
        ...flexAlign("stretch", "stretch"),
        ...FlexScaleZero
      },
      [child(classes.list)]: {
        ...flex(1, 1, "20vw"),
        ...OverflowVisible,
        maxWidth: 500,
        zIndex: 3,
        boxShadow: shadows[6],

        [child(classes.listItem)]: {
          ...FlexColumn,
          borderBottom: `1px solid ${alpha(palette.border.selected, 0.15)}`,
          ...padding(spacing(1), spacing(2), spacing(2), spacing(1.5)),
          ...flexAlign("flex-start", "stretch"),
          transition: transitions.create("background-color"),
          backgroundColor: Transparent,
          [hasCls(classes.listItemSelected)]: {
            backgroundColor: alpha(palette.primary.main, palette.action.selectedOpacity),
            [child(classes.listItemAction)]: {
              opacity: 1
            }
          },
          "& > .top": {
            ...FlexRow,
            ...flexAlign("center", "stretch"),
            ...OverflowHidden,
            [child(classes.listItemAction)]: {
              opacity: 0.7,
              transition: transitions.create(["all"]),
              marginLeft: spacing(2)
            }
          },
          "& > .bottom": {
            ...FlexColumn,
            ...flexAlign("flex-start", "stretch"),
            ...padding(0, spacing(1))
          }
        }
      },
      [child(classes.details)]: {
        ...flex(1, 1, "30vw"),
        ...OverflowHidden,
        ...FlexColumn,
        ...flexAlign("stretch", "stretch"),
        backgroundColor: lighten(palette.background.appBarSearch, 0.05)
      }
    }
  })
)

/**
 * PluginsTabPanel Component Properties
 */
export interface PluginsTabPanelProps extends Omit<TabPanelProps, "value"> {
  mode: PluginViewModeKind
}

/**
 * PluginsTabPanel Component
 *
 * @param { PluginsTabPanelProps } props
 */
export function PluginsTabPanel(props: PluginsTabPanelProps) {
  const { className, mode, ...other } = props,
    theme = useTheme(),
    installedPluginMap = useAppSelector(sharedAppSelectors.selectInstalledPluginMap),
    installedPlugins = useAppSelector(sharedAppSelectors.selectInstalledPlugins),
    availablePlugins = useAppSelector(sharedAppSelectors.selectAvailablePlugins),
    pluginManagerClient = useService(PluginManagerClient),
    plugins = mode === "plugins" ? installedPlugins : availablePlugins,
    handleAction = Alert.usePromise(
      createPluginManifestActionHandler(pluginManagerClient, null),
      {
        loading: ({ args: [action = "none"] }) => `${capitalize(action)} plugin...`,
        success: ({ result, args: [action = "none"] }) => `${capitalize(action)} Plugin Successful`,
        error: ({ err, args: [action = "none"] }) => `${capitalize(action)} Plugin Failed: ${err.message ?? err}`
      },
      [pluginManagerClient]
    ),
    useInstallHandler = useCallback((id: string) => (action: PluginManifestActionKind) => handleAction(action, id), [handleAction]),
    [selectedId, setSelectedId] = useState<string>(""),
    itemRenderer = useCallback(
      (plugin: PluginManifest, { className, ...otherItemProps }: FilterableListItemProps) => {
        return (
          <ButtonBase
            component={ListItem}
            key={plugin.id}
            disableGutters
            className={clsx(className, classes.listItem, {
              [classes.listItemSelected]: selectedId === plugin.id
            })}
            {...otherItemProps}
          >
            <Box className={clsx("top")}>
              <ListItemIcon>
                <PluginIconView src={plugin.overview?.iconUrl} />
              </ListItemIcon>
              <FlexColumnBox
                sx={{
                  ...FlexScaleZero,
                  ...flexAlign("flex-start", "stretch"),
                  ...OverflowHidden
                }}
              >
                <EllipsisBox
                  variant="subtitle1"
                  sx={{
                    opacity: 0.85
                  }}
                >
                  {plugin.name}
                </EllipsisBox>
                <EllipsisBox variant="subtitle2">
                  v{plugin.version}
                  {asOption(plugin.author?.company)
                    .filter(isNotEmptyString)
                    .orElse(asOption(plugin.author?.name))
                    .map(authorLabel => <>&nbsp;&bull;&nbsp;{authorLabel}</>)
                    .getOrElse(<></>)}
                </EllipsisBox>
              </FlexColumnBox>
              {!installedPluginMap[plugin.id] && (
                <PluginManifestActionsButton
                  className={classes.listItemAction}
                  actions={getPluginActions(installedPluginMap, plugin)}
                  onAction={useInstallHandler(plugin.id)}
                />
              )}
            </Box>
            {isNotEmptyString(plugin.description) && (
              <Box className={clsx("bottom")}>
                <Typography
                  variant="body2"
                  sx={{
                    marginTop: theme.spacing(2),
                    opacity: 0.45,
                    lineHeight: 1.5,
                    fontWeight: 100,
                    ...Ellipsis
                  }}
                >
                  {plugin.description}
                </Typography>
              </Box>
            )}
          </ButtonBase>
        )
      },
      [selectedId, installedPluginMap, availablePlugins, theme]
    ),
    selected = useMemo(() => plugins.find(propEqualTo("id", selectedId)), [selectedId, installedPlugins, availablePlugins]),
    itemFilter = useCallback(
      (item: PluginManifest, query: string) =>
        [item.name, item.author?.name, item.author?.company, item.overview?.featureContent]
          .filter(isString)
          .some(it => it.includes(query)),
      []
    )

  return (
    <PluginsTabPanelRoot
      className={clsx(classes.root, {}, className)}
      value={mode}
      {...other}
    >
      <FilterableList<PluginManifest>
        className={clsx(classes.list)}
        filterProps={{
          className: clsx(classes.listFilter)
        }}
        listProps={{
          className: clsx(classes.listItems)
        }}
        items={plugins}
        itemRenderer={itemRenderer}
        itemFilter={itemFilter}
        onItemSelected={manifest => {
          setSelectedId(manifest.id)
        }}
      />
      <Box className={classes.details}>
        {!selected ? (
          <NoData className={clsx(classes.detailsNone)}>Select a plugin on the left to view details.</NoData>
        ) : (
          <Box className={clsx(classes.detailsSelected)}>
            <PluginManifestView
              manifest={selected}
              actions={getPluginActions(installedPluginMap, selected)}
            />
          </Box>
        )}
      </Box>
    </PluginsTabPanelRoot>
  )
}

export default PluginsTabPanel
