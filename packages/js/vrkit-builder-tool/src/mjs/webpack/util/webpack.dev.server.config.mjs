// noinspection NpmUsedModulesInstalled
import deepmerge from "deepmerge"

export function webpackDevServerConfig(port = 1617, options = {}) {
  return deepmerge(
    {
      port,
      hot: true,
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
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
        "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization",
        "Content-Security-Policy": "base-uri 'none'; object-src 'none'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; frame-ancestors 'none'",
        "X-Frame-Options": "ALLOW" ,
        "X-Content-Type-Options": "nosniff" ,
        "X-XSS-Protection": "1; mode=block" ,
      }
        // { key: "X-Frame-Options", value: "ALLOW" },
        // { key: "X-Content-Type-Options", value: "nosniff" },
        // { key: "X-XSS-Protection", value: "1; mode=block" },
        
    },
    options
  )
}
