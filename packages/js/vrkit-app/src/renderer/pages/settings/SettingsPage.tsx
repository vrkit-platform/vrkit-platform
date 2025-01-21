import { Page, PageProps } from "../../components/page"
import React, { useState } from "react"
import { getLogger } from "@3fv/logger-proxy"
import { styled } from "@mui/material/styles"
import {
  child, createClassNames,
  FlexColumn,
  FlexDefaults,
  FlexScaleZero,
  OverflowHidden,
  PositionRelative
} from "@vrkit-platform/shared-ui"
import Box, { BoxProps } from "@mui/material/Box"
import { settingsPageTabConfigs, SettingsTabbar } from "./SettingsTabbar"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const classPrefix = "settingsPage"
export const settingsPageClasses = createClassNames(classPrefix, "tabPanel")


const SettingsPageRoot = styled("div", {
  name: "SettingsPageRoot"
})(({ theme }) => ({
  ...PositionRelative,
  ...FlexScaleZero,
  ...FlexColumn,
  ...OverflowHidden,
  ...FlexDefaults.stretch,
  [child(settingsPageClasses.tabPanel)]: {
    ...FlexScaleZero,
    ...OverflowHidden,
    ...PositionRelative,
    ...FlexColumn,
    ...FlexDefaults.stretch
  }
}))


interface SettingsPageTabPanelProps extends Omit<BoxProps, "children"> {
  id: string
  visible: boolean
  contentFn: () => React.ReactNode
}

const SettingsPageTabPanelRoot = styled(Box, {
  name: "SettingsPageTabPanelRoot"
})(({theme}) => ({
  ...FlexScaleZero,
  ...OverflowHidden,
  ...PositionRelative
}))

function SettingsPageTabPanel(props: SettingsPageTabPanelProps) {
  const { contentFn, id, visible, ...other } = props
  
  return (
    <SettingsPageTabPanelRoot
      role="tabpanel"
      hidden={!visible}
      id={`settings-tabpanel-${id}`}
      aria-labelledby={`settings-tab-${id}`}
      {...other}
    >
      {visible && contentFn()}
    </SettingsPageTabPanelRoot>
  )
}

export interface SettingsPageProps extends PageProps {}

export function SettingsPage({ className, ...other }: SettingsPageProps) {
  const [selectedTabId, setSelectedTabId] = useState<string>(
    settingsPageTabConfigs[0]?.id
  )
  return (
    <Page metadata={{
      appTitlebar: {
        center: <SettingsTabbar selectedTabId={selectedTabId}
                                setSelectedTabId={setSelectedTabId}/>
      }
    }}>
      <SettingsPageRoot>
        {settingsPageTabConfigs.map(({ id, contentFn }) => (
          <SettingsPageTabPanel
            key={`settings-tabpanel-${id}`}
            id={id}
            visible={id === selectedTabId}
            contentFn={contentFn}
          />
        ))}
      </SettingsPageRoot>
    </Page>
  )
}

export default SettingsPage
