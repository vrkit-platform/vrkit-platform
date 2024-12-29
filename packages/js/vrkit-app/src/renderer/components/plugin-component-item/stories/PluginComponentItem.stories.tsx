import type { Meta, StoryObj } from "@storybook/react"

import { PluginComponentView } from "../PluginComponentView"
import type { PluginsState } from "@vrkit-platform/shared"
import PluginsStateJSON from "./plugins-state-example-01.json"
import { get } from "lodash/fp"
import { first } from "lodash"

const pluginsState: PluginsState = PluginsStateJSON as any,
  installs = Object.values(pluginsState.plugins),
  manifests = installs.map(get("manifest")),
  manifest = first(manifests),
  [clockDef, trackmapDef] = manifest.components

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: "PluginComponentItem",
  component: PluginComponentView,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: "centered"
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ["autodocs"],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {
    // backgroundColor: { control: 'color' },
    // variant: "action"
  },
  // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
  args: {
    // onClick: fn()
  }
} satisfies Meta<typeof PluginComponentView>

export default meta
type Story = StoryObj<typeof meta>

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Primary: Story = {
  args: {
    manifest,
    componentDef: trackmapDef
  }
}
//
// export const Secondary: Story = {
//   args: {
//     label: 'Button',
//   },
// };
//
// export const Large: Story = {
//   args: {
//     size: 'large',
//     label: 'Button',
//   },
// };
//
// export const Small: Story = {
//   args: {
//     size: 'small',
//     label: 'Button',
//   },
// };
