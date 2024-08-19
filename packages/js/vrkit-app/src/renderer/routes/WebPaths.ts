
export enum WebRootPath {
  app = 'app'
}

// ----------------------------------------------------------------------

export type WebRootPathKey = keyof typeof WebRootPath

function leaf(rootPath: WebRootPathKey | WebRootPath, ...parts: string[]) {
  return "/" + [WebRootPath[rootPath] ?? rootPath, ...parts].join("/")
}

export const WebPaths = {
  comingSoon: '/coming-soon',
  maintenance: '/maintenance',
  about: '/about-us',
  contact: '/contact-us',
  faqs: '/faqs',
  page403: '/error/403',
  page404: '/error/404',
  page500: '/error/500',
  components: '/components',
  
  
  
  // APP
  app: {
    root: leaf(WebRootPath.app,"overview"),
    overview: leaf(WebRootPath.app,"overview"),
    tracks: leaf(WebRootPath.app,"tracks"),
    laps: leaf(WebRootPath.app,"laps"),
    games: leaf(WebRootPath.app,"games"),
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