// noinspection NpmUsedModulesInstalled
import deepmerge from "deepmerge"

export function webpackDevServerConfig(port = 1617, options = {}) {
  return deepmerge(
    {
      port,
      hot: "only",
      liveReload: false,
      historyApiFallback: true,
      
      client: {
        
        overlay: {
          warnings: false,
          errors: true
        }
      },
      static: [],
      devMiddleware: {
        writeToDisk: true
      },
      headers: [
        // { key: "X-Frame-Options", value: "ALLOW" },
        // { key: "X-Content-Type-Options", value: "nosniff" },
        // { key: "X-XSS-Protection", value: "1; mode=block" },
        {
          key: "Content-Security-Policy",
          value: "base-uri 'none'; object-src 'none'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; frame-ancestors 'none'",
        },
      ],
    },
    options
  )
}
