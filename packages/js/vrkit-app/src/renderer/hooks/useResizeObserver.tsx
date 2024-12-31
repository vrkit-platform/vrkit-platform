import { Pair, pairOf } from "@vrkit-platform/shared"
import { SizeI } from "@vrkit-platform/models"
import { useCallback, useEffect, useRef, useState } from "react"
import { getLogger } from "@3fv/logger-proxy"

const log = getLogger(__filename)

export function useResizeObserver(): Pair<React.Ref<HTMLElement>, SizeI> {
  const contentRef = useRef<HTMLDivElement>(),
    [size, setSize] = useState<SizeI>(null),
    updateSize = useCallback((el: HTMLElement) => {
      const { clientWidth: width, clientHeight: height } = el,
        newSize = { width, height }
      
      if (log.isDebugEnabled())
        log.debug("New overlay window body content size", newSize)
      
      setSize(newSize)
    }, []),
    resizeCallback = useCallback(
      (entries: ResizeObserverEntry[]) => {
        if (!entries[0]?.target) {
          return
        }

        updateSize(entries[0].target as HTMLElement)
      },
      [updateSize]
    )
  // PluginComponent = pluginClientManager.getReactComponent()

  // Create & Apply a resize observer
  // TODO: Move this to a hook
  useEffect(() => {
    if (contentRef.current) {
      const observer = new ResizeObserver(resizeCallback)
      observer.observe(contentRef.current, {
        box: "border-box"
      })

      updateSize(contentRef.current)

      return () => {
        observer.disconnect()
      }
    }
  }, [contentRef.current])

  return pairOf(contentRef, size)
}
