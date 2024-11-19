import type { StorybookConfig } from "@storybook/react-webpack5"
import * as Webpack from "webpack"
import * as Fsx from "fs-extra"
import * as Path from "path"

const config: StorybookConfig = {
  //"../src/**/*.mdx",
  //stories: ["../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  stories: ["../lib/**/*.stories.@(js|jsx|mjs)"],
  addons: [
    // "@storybook/addon-webpack5-compiler-swc",
    "@storybook/addon-onboarding",
    "@storybook/addon-essentials",
    "@chromatic-com/storybook",
    "@storybook/addon-interactions"
  ],
  swc: (config, options) => {
    
    return Fsx.readJSONSync(Path.join(__dirname, ".swcrc"))
  },
  framework: {
    name: "@storybook/react-webpack5",
    options: {}
  },
  webpackFinal: config => {
  
    if (!config.resolve.fallback)
      config.resolve.fallback = {}
    
    config.resolve.fallback = {
      buffer: false,
      stream: false,
      zlib: false,
      path: false,
      fs: false,
      os: false,
      crypto: false,
      constants: false
    }
    
    config.plugins.unshift(new Webpack.DefinePlugin({
      "TARGET_PLATFORM": JSON.stringify("storybook"),
      "process.env.TARGET_PLATFORM": JSON.stringify("storybook")
    }))
    
    return config
  }
}
export default config
