import { isNotEmptyString } from "@vrkit-platform/shared"
import { WebRootPath } from "../routes/WebPaths"
import { useLocation } from "react-router-dom"

export function useWebPathRoot() {
  const loc = useLocation(),
      parts = loc.pathname.split("/").filter(isNotEmptyString),
      rootPart = parts[0]
  
  return WebRootPath[rootPart] ?? WebRootPath.unknown
}