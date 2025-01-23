import clsx from "clsx"
import TuneIcon from "@mui/icons-material/Tune"
import KeyboardIcon from '@mui/icons-material/Keyboard'
import { faEye } from "@awesome.me/kit-79150a3eed/icons/duotone/solid"
import { AppFAIcon } from "../../components/app-icon"
import { FlexRowCenter } from "@vrkit-platform/shared-ui"
import ButtonGroup from "@mui/material/ButtonGroup"
import Button from "@mui/material/Button"
import { AppearanceSettingsPanel } from "./panels/AppearanceSettingsPanel"
import { GlobalCSSClassNames } from "../../renderer-constants"
import { GeneralSettingsPanel } from "./panels/GeneralSettingsPanel"
import {
  ShortcutKeyMappingSettingsPanel
} from "./panels/ShortcutKeyMappingSettingsPanel"

export type SettingsPageTabId = "general" | "appearance" | "shortcut-key-mapping"

export interface SettingsPageTabConfig {
  id: SettingsPageTabId

  label: string

  contentFn: () => React.ReactNode

  iconFn: () => React.ReactNode
}

export const settingsPageTabConfigs = Array<SettingsPageTabConfig>(
  {
    id: "general",
    label: "General",
    contentFn: () => <GeneralSettingsPanel />,
    iconFn: () => <TuneIcon />
  },
  {
    id: "appearance",
    label: "Appearance",
    contentFn: () => <AppearanceSettingsPanel />,
    iconFn: () => <AppFAIcon icon={faEye} />
  },
  {
    id: "shortcut-key-mapping",
    label: "Shortcuts",
    contentFn: () => <ShortcutKeyMappingSettingsPanel />,
    iconFn: () => <KeyboardIcon />
  }
)
export type SettingsTabbarProps = {
  setSelectedTabId: (id: string) => any
  selectedTabId: string
}

export function SettingsTabbar({ setSelectedTabId, selectedTabId }: SettingsTabbarProps) {
  return (
    <ButtonGroup
      variant="outlined"
      color="primary"
      // className={clsx(GlobalCSSClassNames.electronAllowInteraction)}
      sx={{
        ...FlexRowCenter,
        flex: "1 1 auto"
      }}
    >
      {settingsPageTabConfigs.map(({ id, label, iconFn }) => (
        <Button
          key={`settings-tab-${id}`}
          id={`settings-tab-${id}`}
          onClick={() => setSelectedTabId(id)}
          variant={id === selectedTabId ? "contained" : "outlined"}
          className={clsx(GlobalCSSClassNames.electronAllowInteraction)}
        >
          {iconFn()}
        </Button>
      ))}
    </ButtonGroup>
  )
}
