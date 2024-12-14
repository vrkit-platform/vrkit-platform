// REACT
import React, { DetailedHTMLProps, ImgHTMLAttributes, useEffect, useState } from "react"

// CLSX
// 3FV
import { getLogger } from "@3fv/logger-proxy"

// MUI
// APP
import { isDefined, isString } from "@3fv/guard"
import { asOption, Future } from "@3fv/prelude-ts"
import { get } from "lodash/fp"
import { isNotEmptyString } from "vrkit-shared"
import EmptyImageURL from "!!url-loader!assets/images/components/async-image-placeholder.svg"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const resToError = (res: Response) => {
  info("resToError", res.status,res.statusText)
  return Error(`Cache miss (${res?.url ?? "NULL"}): code=${res?.status ?? -1},text=${res?.statusText ?? "NULL"}`)
}

/**
 * AsyncImage Component Properties
 */
export interface AsyncImageProps extends DetailedHTMLProps<ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement> {
  src: string

  fallback?: string

  cache?: string | Cache // A unique key for the cache (use the URL as default).
}

/**
 * AsyncImage Component
 *
 * @param { AsyncImageProps } props
 */
export const AsyncImage = React.forwardRef<"img", AsyncImageProps>(function AsyncImage(props: AsyncImageProps, ref) {
  const { className, src, fallback, alt, cache: cacheOrName = "async-image", ...other } = props
  const [localImageUrl, setLocalImageUrl] = useState<string | null>(null)
  
  // Helper function to fetch and cache the image
  const fetchImageWithCache = async () => {
    try {
      const cache = isString(cacheOrName) ? await caches.open(cacheOrName) : cacheOrName // Open or create a named cache
      const res = await Future.of(cache.match(src))
        .filter(isDefined<Body>, resToError)
        .mapFailure(err => {
          log.debug(`cache miss`, err)
          return Future.of(
            fetch(src)
          )
            .filter(get("ok"), resToError)
            .onSuccess(it => {
              cache.put(src, it.clone())
            })
        })
        .toPromise()

      setLocalImageUrl(URL.createObjectURL(await res.blob()))
    } catch (e) {
      log.error("Error fetching image:", e)
    }
  }

  useEffect(() => {
    if (!src)
      return
    if (src.startsWith("data:")) {
      setLocalImageUrl(src)
    } else {
      fetchImageWithCache()
    }
  }, [src, cacheOrName])

  const imageUrl = asOption(localImageUrl)
    .filter(isNotEmptyString)
    .orElse(asOption(fallback))
    .getOrElse(
      EmptyImageURL
    )

  return (
    <img
      className={className}
      ref={ref as any}
      src={imageUrl}
      alt={alt}
      {...other}
    />
  )
})

export default AsyncImage
