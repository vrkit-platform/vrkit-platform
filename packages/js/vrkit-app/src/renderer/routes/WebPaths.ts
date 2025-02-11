import { useLocation } from "react-router-dom"
import { isNotEmptyString } from "@vrkit-platform/shared"

export enum WebRootPath {
  main = 'main',
  settings = 'settings',
  unknown = 'unknown',
  dashboardController = 'dashboardController',
  dashboardVRLayout = 'dashboardVRLayout'
}

export type WebRootPathKey = keyof typeof WebRootPath

function leaf(rootPath: WebRootPathKey | WebRootPath, ...parts: string[]) {
  return "/" + [WebRootPath[rootPath] ?? rootPath, ...parts].join("/")
}

export const WebPaths = {
  page403: '/error/403',
  page404: '/error/404',
  page500: '/error/500',
  
  // MAIN
  main: {
    dashboards: leaf(WebRootPath.main,"dashboards"),
    plugins: leaf(WebRootPath.main,"plugins"),
  },
  
  dashboardVRLayout: leaf(WebRootPath.dashboardVRLayout),
  dashboardController: leaf(WebRootPath.dashboardController),
  
  // SETTINGS
  settings: {
    general: leaf(WebRootPath.settings,"general"),
  },
};

/**
 * Get a path part.  If `idx < 0` (default), then the last element is retrieved
 *
 * @param webPath URI resource path (i.e. `/app/games`)
 * @param idx the index of the path part to return, `< 0` returns the final part
 */
export function getWebPathPart(webPath: string, idx: number = -1) {
  const parts = webPath.split("/")
  idx = idx < 0 || idx >= parts.length ? parts.length - 1 :  idx
  
  return parts[idx]
}

export function useWebPathRoot() {
  const loc = useLocation(),
    parts = loc.pathname.split("/").filter(isNotEmptyString),
    rootPart = parts[0]
  
  return WebRootPath[rootPart] ?? WebRootPath.unknown
  
}