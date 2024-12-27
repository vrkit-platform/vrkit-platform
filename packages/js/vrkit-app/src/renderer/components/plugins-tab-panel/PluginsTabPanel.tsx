// REACT
import React, { useCallback, useMemo, useState } from "react"

// CLSX
import clsx from "clsx"

// 3FV
import { getLogger } from "@3fv/logger-proxy"

// MUI
import Box from "@mui/material/Box"
import { lighten, styled } from "@mui/material/styles"

// APP
import {
  alpha,
  child,
  ClassNamesKey,
  createClassNames,
  dimensionConstraints,
  FillWidth,
  flex,
  flexAlign,
  FlexColumn,
  FlexRow,
  FlexScaleZero,
  hasCls,
  OverflowHidden,
  OverflowVisible, rem
} from "@vrkit-platform/shared-ui"
import TabPanel, { type TabPanelProps } from "@mui/lab/TabPanel"
import { PluginViewModeKind } from "../plugins-tab-view/PluginsTabViewTypes"
import { useAppSelector } from "../../services/store"
import { sharedAppSelectors } from "../../services/store/slices/shared-app"
import { isString } from "@3fv/guard"
import { PluginManifest } from "@vrkit-platform/models"
import { FilterableList, FilterableListItemProps } from "../filterable-list"
import ListItem from "@mui/material/ListItem"
import { propEqualTo } from "@vrkit-platform/shared"
import NoData from "../no-data"
import ListItemText from "@mui/material/ListItemText"
import PluginManifestView from "../plugin-manifest-view"
import ListItemIcon from "@mui/material/ListItemIcon"
import { AsyncImage } from "../async-image"

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
        zIndex: 2,
        boxShadow: shadows[4],
        
        [child(classes.listItem)]: {
          borderBottom: `1px solid ${alpha(palette.border.selected, 0.15)}`,
          paddingBottom: spacing(2),
          [hasCls(classes.listItemSelected)]: {}
        }
      },
      [child(classes.details)]: {
        ...flex(1, 1, "30vw"),
        ...OverflowHidden,
        ...FlexColumn,
        ...flexAlign("stretch", "stretch"),
        backgroundColor: lighten(palette.background.appBarSearch,0.05)
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
    plugins = useAppSelector(
      mode === "plugins" ? sharedAppSelectors.selectInstalledPlugins : sharedAppSelectors.selectAvailablePlugins
    ),
    [selectedId, setSelectedId] = useState<string>(""),
    itemRenderer = useCallback(
      (plugin: PluginManifest, { className, ...otherItemProps }: FilterableListItemProps) => {
        return (
          <ListItem
            key={plugin.id}
            className={clsx(className, classes.listItem, {
              [classes.listItemSelected]: selectedId === plugin.id
            })}
            {...otherItemProps}
          >
            <ListItemIcon>
              <AsyncImage
                  sx={{
                    ...dimensionConstraints(rem(3))
                  }}
                  src={plugin.overview?.iconUrl}/>
            </ListItemIcon>
            <ListItemText primaryTypographyProps={{typography:"subtitle1"}}
              primary={plugin.name}
                          secondary={<>{plugin.author?.company ?? "Company N/A"}&nbsp;&bull;&nbsp;{plugin.author?.name ?? "Author N/A"}</>}
            />
            
          </ListItem>
        )
      },
      [selectedId]
    ),
    selected = useMemo(() => plugins.find(propEqualTo("id", selectedId)), [selectedId, plugins]),
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
            <PluginManifestView manifest={selected}/>
          </Box>
        )}
      </Box>
    </PluginsTabPanelRoot>
  )
}

export default PluginsTabPanel
