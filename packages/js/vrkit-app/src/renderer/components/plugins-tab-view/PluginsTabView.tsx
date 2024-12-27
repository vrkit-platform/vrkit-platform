// REACT
import React, { useMemo, useState } from "react"

// CLSX
import clsx from "clsx"

// 3FV
import { getLogger } from "@3fv/logger-proxy"

// MUI
import Box, { type BoxProps } from "@mui/material/Box"
import Tab from "@mui/material/Tab"
import TabContext from "@mui/lab/TabContext"
import TabList from "@mui/lab/TabList"
import TabPanel from "@mui/lab/TabPanel"
import { styled } from "@mui/material/styles"

// APP
import {
  alpha,
  child,
  ClassNamesKey,
  createClassNames,
  FillWidth,
  flex, flexAlign,
  FlexColumn,
  FlexRowCenter,
  hasCls,
  OverflowHidden
} from "@vrkit-platform/shared-ui"
import { pairOf, PluginsState } from "@vrkit-platform/shared"
import { capitalize, lowerCase, startCase, upperCase } from "lodash"
import { PluginViewMode, PluginViewModeKind } from "./PluginsTabViewTypes"
import PluginsTabPanel from "../plugins-tab-panel"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const classPrefix = "pluginsTabView"
export const pluginsTabViewClasses = createClassNames(classPrefix, "root", "tabbar", "tabbarList", "tabbarListTab", "content")
const classes = pluginsTabViewClasses

export type PluginsTabViewClassKey = ClassNamesKey<typeof pluginsTabViewClasses>

const PluginsTabViewRoot = styled(Box, {
  name: "PluginsTabViewRoot",
  label: "PluginsTabViewRoot"
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
      ...FlexColumn,
      ...flex(1,1,0),
      ...flexAlign("stretch","stretch"),
      [child(classes.tabbar)]: {
        ...FlexRowCenter,
        ...FillWidth,
        filter: "drop-shadow(0px 2px 2px rgba(0,0,0, 0.25))",
        backgroundColor: palette.background.actionFooter,
        [child(classes.tabbarList)]: {
          [child(classes.tabbarListTab)]: {
          
          }
        }
      },
      [child(classes.content)]: {
        // child styled here
      }
    }
  })
)

/**
 * PluginsTabView Component Properties
 */
export interface PluginsTabViewProps extends BoxProps {}


/**
 * PluginsTabView Component
 *
 * @param { PluginsTabViewProps } props
 */
export function PluginsTabView(props: PluginsTabViewProps) {
  const { className, ...other } = props,
      [viewMode, setViewMode] = useState<PluginViewModeKind>("availablePlugins"),
      viewModes = useMemo(() => Object.keys(PluginViewMode).map(mode => pairOf(mode, mode === "plugins" ? "Installed" : "Available")),[]),
      handleChange = (_event: React.SyntheticEvent, newMode: string) => {
        log.assert(PluginViewMode[newMode], `Invalid mode ${newMode}`)
        setViewMode(PluginViewMode[newMode]);
      };

  return (
    <PluginsTabViewRoot
      className={clsx(classes.root, {}, className)}
      {...other}
    >
      <TabContext value={viewMode}>
        <Box className={clsx(classes.tabbar)}>
          <TabList
              className={clsx(classes.tabbarList)}
              onChange={handleChange}
              aria-label="Plugins Available/Installed">
            {viewModes
                .map(([mode, label]) => <Tab
                    key={mode}
                    label={label}
                    value={mode}
                />)
            }
          </TabList>
        </Box>
        {viewModes
            .map(([mode]) => <PluginsTabPanel
                key={mode}
                mode={mode as PluginViewModeKind}
            />)
        }
        
      </TabContext>
    </PluginsTabViewRoot>
  )
}

export default PluginsTabView
