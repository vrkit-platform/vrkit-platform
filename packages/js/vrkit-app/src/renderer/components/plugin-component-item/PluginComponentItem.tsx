// REACT
import React, { useState } from "react"

// CLSX
import clsx from "clsx"

// 3FV
import { getLogger } from "@3fv/logger-proxy"

// MUI
import Box from "@mui/material/Box"
import { darken, styled } from "@mui/material/styles"

// APP
import ColorThief from "colorthief"
import {
  alpha,
  child,
  ClassNamesKey,
  createClassNames,
  dimensionConstraints,
  Ellipsis,
  Fill,
  FillWidth,
  flexAlign,
  FlexAuto,
  FlexColumn,
  FlexRow,
  FlexRowBox,
  FlexRowCenter,
  FlexScaleZero,
  hasCls,
  heightConstraint,
  OverflowAuto,
  OverflowHidden,
  OverflowVisible,
  padding,
  PositionAbsolute,
  PositionRelative,
  rem
} from "vrkit-shared-ui"
import { PluginComponentDefinition, PluginManifest } from "vrkit-models"
import { Markdown } from "../markdown"
import { AsyncImage } from "../async-image"
import Paper, { PaperProps } from "@mui/material/Paper"
import { rgbToHex } from "../../theme/paletteAndColorHelpers"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const classPrefix = "pluginOverlayItem"
export const pluginOverlayItemClasses = createClassNames(
  classPrefix,
  "root",
  "header",
  "headerIcon",
  "headerBox",
  "headerTitle",
  "headerSubheader",
  "carousel",
  "carouselItem",
  "carouselItemImage",
  "content",
  "footer",
  "footerActions"
)
export type PluginOverlayItemClassKey = ClassNamesKey<typeof pluginOverlayItemClasses>

const PluginOverlayItemRoot = styled(Paper, {
  name: "PluginOverlayItemRoot",
  label: "PluginOverlayItemRoot"
})(({ theme: { palette, spacing, transitions, typography, shadows, dimen, shape, mixins } }) => ({
  // root styles here
  [hasCls(pluginOverlayItemClasses.root)]: {
    ...FlexColumn,
    ...PositionRelative,
    ...FlexAuto,
    ...OverflowHidden,
    ...flexAlign("stretch", "flex-start"),
    borderRadius: shape.borderRadius * 2,
    [child(pluginOverlayItemClasses.header)]: {
      ...padding(spacing(1)),
      ...FlexRow,
      ...flexAlign("center", "stretch"),
      ...FlexAuto,
      overflowY: "visible",
      gap: spacing(1.5),
      boxShadow: shadows[2],
      zIndex: 3,
      [child(pluginOverlayItemClasses.headerIcon)]: {
        ...dimensionConstraints(rem(2)),
        "& img, & svg ": {
          color: palette.primary.contrastText,
          fill: palette.primary.contrastText
        },

        ...FlexRowCenter,
        ...FlexAuto
      },
      [child(pluginOverlayItemClasses.headerBox)]: {
        ...FlexColumn,
        ...FlexScaleZero,
        ...flexAlign("stretch", "flex-start"),

        [child(pluginOverlayItemClasses.headerTitle)]: {
          ...Ellipsis,
          ...FlexAuto,
          ...typography.h4
        },
        [child(pluginOverlayItemClasses.headerSubheader)]: {
          ...Ellipsis,
          ...FlexAuto,
          ...typography.subtitle1,
          fontWeight: 100,
          opacity: 0.25,
          letterSpacing: 0.9
        }
      }
    },

    [child(pluginOverlayItemClasses.carousel)]: {
      ...FlexRow,
      ...PositionRelative,
      ...OverflowVisible,
      ...FillWidth,
      ...heightConstraint(rem(10)),
      zIndex: 2,
      "&::after": {
        ...Fill,
        ...PositionAbsolute,
        zIndex: 2,
        content: "' '",
        pointerEvents: "none",
        boxShadow: `inset 0 -5px 5px 2px rgba(0,0,0,0.1), ${shadows[4]}`
      },
      backgroundColor: darken(palette.background.paper, 0.2),
      [child(pluginOverlayItemClasses.carouselItem)]: {
        ...FlexRowCenter,
        ...PositionRelative,
        ...Fill,
        ...OverflowHidden,
        objectFit: "contain",
        [child(pluginOverlayItemClasses.carouselItemImage)]: {
          ...PositionRelative,
          ...OverflowHidden,
          objectFit: "contain", // maxHeight: "-webkit-fill-available",
          height: "auto",
          maxWidth: "-webkit-fill-available"
        }
      }
    },
    [child(pluginOverlayItemClasses.content)]: {
      ...padding(spacing(1), spacing(2)),
      ...OverflowAuto,
      "&, & *": {
        color: alpha(palette.primary.contrastText, 0.6)
      }
    }
  }
}))

/**
 * PluginOverlayItem Component Properties
 */
export interface PluginComponentItemProps extends Omit<PaperProps, "children"> {
  manifest: PluginManifest

  componentDef: PluginComponentDefinition

  actions?: React.ReactNode
}

/**
 * PluginOverlayItem Component
 *
 * @param { PluginComponentItemProps } props
 */
export function PluginComponentItem(props: PluginComponentItemProps) {
  const { className, manifest, componentDef, ...other } = props,
    { uiResource: uiRes, overview } = componentDef,
    [screenshotBackgrounds, setScreenshotBackground] = useState<Array<string | number>>(
      Array(overview?.screenshots?.length ?? 0)
    ),
    createScreenshotLoadedHandler = (idx: number) => (ev: React.SyntheticEvent<HTMLImageElement>) => {
      const newBgs = [...screenshotBackgrounds],
        colorThief = new ColorThief(),
        img = ev.currentTarget,
        dominantColor = colorThief.getColor(img)

      log.info(`Dominant color (${idx}): ${dominantColor}`)
      newBgs[idx] = rgbToHex(dominantColor)
      setScreenshotBackground(newBgs)
    },
    text = `# Features
${overview.featureContent}

<hr/>

# Change Log

${overview.changeLogContent}

<hr/>

# Details

Version ${manifest.version}`.trimStart()

  return (
    <PluginOverlayItemRoot
      className={clsx(pluginOverlayItemClasses.root, {}, className)}
      elevation={4}
      {...other}
    >
      <Box className={pluginOverlayItemClasses.header}>
        <Box className={pluginOverlayItemClasses.headerIcon}>
          <AsyncImage src={uiRes?.icon?.url} />
        </Box>
        <Box className={pluginOverlayItemClasses.headerBox}>
          <Box className={pluginOverlayItemClasses.headerTitle}>{componentDef.name}</Box>
          <Box className={pluginOverlayItemClasses.headerSubheader}>{manifest.name}</Box>
        </Box>
      </Box>
      <Box className={pluginOverlayItemClasses.carousel}>
        <FlexRowBox
          sx={{
            ...OverflowHidden,
            ...FillWidth
          }}
        >
          {overview?.screenshots?.map?.((ss, idx) => (
            <Box
              key={idx}
              className={pluginOverlayItemClasses.carouselItem}
              sx={{
                backgroundColor: screenshotBackgrounds[idx]
              }}
            >
              <AsyncImage
                src={ss.url}
                onLoad={createScreenshotLoadedHandler(idx)}
                className={pluginOverlayItemClasses.carouselItemImage}
              />
            </Box>
          ))}
        </FlexRowBox>
      </Box>
      <Box className={pluginOverlayItemClasses.content}>
        <Markdown>{text}</Markdown>
      </Box>
    </PluginOverlayItemRoot>
  )
}

export default PluginComponentItem
