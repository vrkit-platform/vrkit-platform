import "./preview-init"


import type { Preview } from "@storybook/react"
import StoryPreviewContainer from "../src/entry-storybook"

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i
      }
    }
  },
  
  decorators: [
    StoryPreviewContainer
  ]
}

export default preview
