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
} from "@vrkit-platform/shared-ui"
import { PluginComponentDefinition, PluginManifest } from "@vrkit-platform/models"
import { Markdown } from "../markdown"
import { AsyncImage } from "../async-image"
import Paper, { PaperProps } from "@mui/material/Paper"
import { rgbToHex } from "../../theme/paletteAndColorHelpers"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const classPrefix = "pluginManifestView"
export const pluginManifestViewClasses = createClassNames(
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
const classes = pluginManifestViewClasses
export type PluginManifestViewClassKey = ClassNamesKey<typeof pluginManifestViewClasses>

const PluginManifestViewRoot = styled(Paper, {
  name: "PluginManifestViewRoot",
  label: "PluginManifestViewRoot"
})(({ theme: { palette, spacing, transitions, typography, shadows, dimen, shape, mixins } }) => ({
  // root styles here
  [hasCls(classes.root)]: {
    ...FlexColumn,
    ...PositionRelative,
    ...FlexAuto,
    ...OverflowHidden,
    ...flexAlign("stretch", "flex-start"),
    //borderRadius: shape.borderRadius * 2,
    [child(classes.header)]: {
      ...padding(spacing(1)),
      ...FlexRow,
      ...flexAlign("center", "stretch"),
      ...FlexAuto,
      overflowY: "visible",
      gap: spacing(1.5),
      boxShadow: shadows[2],
      zIndex: 3,
      [child(classes.headerIcon)]: {
        ...dimensionConstraints(rem(2)),
        "& img, & svg ": {
          color: palette.primary.contrastText,
          fill: palette.primary.contrastText
        },
        
        ...FlexRowCenter,
        ...FlexAuto
      },
      [child(classes.headerBox)]: {
        ...FlexColumn,
        ...FlexScaleZero,
        ...flexAlign("stretch", "flex-start"),
        
        [child(classes.headerTitle)]: {
          ...Ellipsis,
          ...FlexAuto,
          ...typography.h4
        },
        [child(classes.headerSubheader)]: {
          ...Ellipsis,
          ...FlexAuto,
          ...typography.subtitle1,
          fontWeight: 100,
          opacity: 0.25,
          letterSpacing: 0.9
        }
      }
    },
    
    [child(classes.carousel)]: {
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
      [child(classes.carouselItem)]: {
        ...FlexRowCenter,
        ...PositionRelative,
        ...Fill,
        ...OverflowHidden,
        objectFit: "contain",
        [child(classes.carouselItemImage)]: {
          ...PositionRelative,
          ...OverflowHidden,
          objectFit: "contain", // maxHeight: "-webkit-fill-available",
          height: "auto",
          maxWidth: "-webkit-fill-available"
        }
      }
    },
    [child(classes.content)]: {
      ...padding(spacing(1), spacing(2)),
      ...OverflowAuto,
      "&, & *": {
        color: alpha(palette.primary.contrastText, 0.6)
      }
    }
  }
}))

/**
 * PluginManifestView Component Properties
 */
export interface PluginManifestViewProps extends Omit<PaperProps, "children" | "onClick"> {
  manifest: PluginManifest
  onClick?: (manifest: PluginManifest) => any
  actions?: React.ReactNode
}

/**
 * PluginManifestView Component
 *
 * @param { PluginManifestViewProps } props
 */
export function PluginManifestView(props: PluginManifestViewProps) {
  const { className, onClick: inOnClick, manifest, actions, ...other } = props,
      { name, author, version, description, overview } = manifest,
      {screenshots, iconUrl, websiteUrl, sourceUrl, featureContent, changeLogContent} = overview,
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
      onClick = !inOnClick ? undefined : (ev: React.SyntheticEvent) => {
        ev.preventDefault()
        ev.stopPropagation()
        inOnClick(manifest)
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
      <PluginManifestViewRoot
          className={clsx(classes.root, {}, className)}
          elevation={4}
          onClick={onClick}
          {...other}
      >
        <Box className={classes.header}>
          <Box className={classes.headerIcon}>
            <AsyncImage src={iconUrl} />
          </Box>
          <Box className={classes.headerBox}>
            <Box className={classes.headerTitle}>{name}</Box>
            <Box className={classes.headerSubheader}>{description}</Box>
          </Box>
        </Box>
        <Box className={classes.carousel}>
          <FlexRowBox
              sx={{
                ...OverflowHidden,
                ...FillWidth
              }}
          >
            {overview?.screenshots?.map?.((ss, idx) => (
                <Box
                    key={idx}
                    className={classes.carouselItem}
                    sx={{
                      backgroundColor: screenshotBackgrounds[idx]
                    }}
                >
                  <AsyncImage
                      src={ss.url}
                      onLoad={createScreenshotLoadedHandler(idx)}
                      className={classes.carouselItemImage}
                  />
                </Box>
            ))}
          </FlexRowBox>
        </Box>
        <Box className={classes.content}>
          <Markdown>{text}</Markdown>
        </Box>
      </PluginManifestViewRoot>
  )
}

export default PluginManifestView
