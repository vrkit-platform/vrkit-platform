import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';

import { LoadingScreen } from "./LoadingScreen"

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const storyMeta = {
  title: 'LoadingScreen',
  component: LoadingScreen,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
  },
  
  args: {
    // variant: "primary",
    onClick: fn()
  },
} satisfies Meta<typeof LoadingScreen>;

export default storyMeta;
type Story = StoryObj<typeof storyMeta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Primary: Story = {
  args: {
    // variant: "primary",
    // children: "My Button"
  },
};
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
