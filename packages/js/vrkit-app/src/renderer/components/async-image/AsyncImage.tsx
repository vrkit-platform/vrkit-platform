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
import { isNotEmptyString } from "@vrkit-platform/shared"
import EmptyImageURL from "!!url-loader!assets/images/components/async-image-placeholder.svg"
import { Fill, OverflowHidden, PositionRelative } from "@vrkit-platform/shared-ui"
import { type SxProps } from "@mui/material/styles"
import Box from "@mui/material/Box"
import { Theme } from "@mui/material/styles/createTheme"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const kDataURLSVGPrefix = "data:image/svg+xml;base64,"

const resToError = (res: Response) => {
  info("resToError", res.status, res.statusText)
  return Error(`Cache miss (${res?.url ?? "NULL"}): code=${res?.status ?? -1},text=${res?.statusText ?? "NULL"}`)
}

/**
 * AsyncImage Component Properties
 */
export interface AsyncImageProps extends DetailedHTMLProps<ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement> {
  src: string

  sx?: SxProps<Theme>

  unpackIfPossible?: boolean

  fallback?: string

  cache?: string | Cache // A unique key for the cache (use the URL as default).
}

/**
 * AsyncImage Component
 *
 * @param { AsyncImageProps } props
 */
export const AsyncImage = React.forwardRef<"img", AsyncImageProps>(function AsyncImage(props: AsyncImageProps, ref) {
  const {
    className,
    unpackIfPossible = false,
    sx = {},
    src,
    fallback,
    alt,
    cache: cacheOrName = "async-image",
    ...other
  } = props
  const [localImageUrl, setLocalImageUrl] = useState<string>(null)
  const [htmlContent, setHTMLContent] = useState<string>(null)

  // Helper function to fetch and cache the image
  const fetchImageWithCache = async () => {
    try {
      const cache = isString(cacheOrName) ? await caches.open(cacheOrName) : cacheOrName // Open or create a named cache
      const res = await Future.of(cache.match(src))
        .filter(isDefined<Body>, resToError)
        .mapFailure(err => {
          log.debug(`cache miss`, err)
          return Future.of(fetch(src))
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
    setLocalImageUrl(null)
    setHTMLContent(null)
    if (!src) {
      return
    }
    if (src.startsWith("data:")) {
      if (unpackIfPossible && src.startsWith(kDataURLSVGPrefix)) {
        const dataEncoded = src.substring(kDataURLSVGPrefix.length),
          data = atob(dataEncoded)
        setHTMLContent(data)
        return
      }
      setLocalImageUrl(src)
    } else {
      fetchImageWithCache()
    }
  }, [src, cacheOrName])

  const imageUrl = asOption(localImageUrl).filter(isNotEmptyString).orElse(asOption(fallback)).getOrElse(EmptyImageURL)
  const htmlProps = htmlContent
    ? {
        dangerouslySetInnerHTML: { __html: htmlContent }
      }
    : {
        children: (
          <img
            ref={ref as any}
            src={imageUrl}
            alt={alt}
            {...other}
          />
        )
      }
  return (
    <Box
      className={className}
      sx={{
        ...PositionRelative,
        ...OverflowHidden,
        "& > img, & > svg": {
          ...Fill
        },
        ...sx
      }}
      {...htmlProps}
    ></Box>
  )
})

export default AsyncImage
