// REACT
import React, { useState } from "react"

// CLSX
import clsx from "clsx"

// 3FV
import { getLogger } from "@3fv/logger-proxy"

// MUI
import Box from "@mui/material/Box"
import { darken, styled, useTheme } from "@mui/material/styles"

// APP
import ColorThief from "colorthief"
import {
  alpha,
  child,
  ClassNamesKey,
  createClassNames,
  Ellipsis,
  EllipsisBox,
  Fill,
  FillHeight,
  FillWidth,
  flexAlign,
  FlexAuto,
  FlexColumn,
  FlexRow,
  FlexRowCenter,
  FlexScaleZero,
  hasCls,
  heightConstraint,
  margin,
  overflow,
  OverflowAuto,
  OverflowHidden,
  OverflowVisible,
  padding,
  PositionAbsolute,
  PositionRelative,
  widthConstraint
} from "@vrkit-platform/shared-ui"
import { PluginManifest } from "@vrkit-platform/models"
import { Markdown } from "../markdown"
import { AsyncImage } from "../async-image"
import Paper, { PaperProps } from "@mui/material/Paper"
import { rgbToHex } from "../../theme/paletteAndColorHelpers"
import { arrayOf, isNotEmptyString, stopEvent } from "@vrkit-platform/shared"
import { PluginComponentView } from "../plugin-component-item"
import { PluginIconView } from "../plugin-icon-view"
import { capitalize } from "lodash"
import { PluginManagerClient } from "../../services/plugin-manager-client"
import { useService } from "../service-container"
import { match } from "ts-pattern"
import { Alert } from "../../services/alerts"
import { action } from "../../theme/core"
import {
  createPluginManifestActionHandler,
  PluginManifestActionKind,
  PluginManifestActionsButton
} from "./PluginManifestActionsButton"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const classPrefix = "pluginManifestView"
export const pluginManifestViewClasses = createClassNames(
  classPrefix,
  "root",
  "header",
  "headerIcon",
  "headerBox",
  "headerAction",
  "headerTitle",
  "headerSubheader",
  "carousel",
  "carouselContent",
  "carouselItem",
  "carouselItemImage",
  "content",
  "components",
  "componentsContent",
  "componentItem",
  "componentItemView",
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
    ...flexAlign("stretch", "flex-start"), //borderRadius: shape.borderRadius * 2,
    [child(classes.header)]: {
      ...padding(spacing(1)),
      ...FlexRow,
      ...flexAlign("flex-start", "stretch"),
      ...FlexAuto,
      ...FillWidth,
      overflowX: "hidden",
      overflowY: "visible",
      gap: spacing(1.5),
      boxShadow: shadows[2],
      zIndex: 3,
      [child(classes.headerIcon)]: {
        // ...dimensionConstraints(rem(2)),
        "& img, & svg ": {
          color: palette.primary.contrastText,
          fill: palette.primary.contrastText
        },

        ...FlexRow,
        ...FlexAuto,
        ...flexAlign("flex-start", "flex-start")
      },
      [child(classes.headerBox)]: {
        ...FlexColumn,
        ...FlexScaleZero,
        ...flexAlign("flex-start", "stretch"),
        ...OverflowHidden,
        ...PositionRelative,
        gap: spacing(0.25),

        [child(classes.headerTitle)]: {
          ...Ellipsis,
          ...FlexAuto,
          ...typography.h4,
          ...OverflowHidden,
          ...FillWidth
        },
        [child(classes.headerSubheader)]: {
          ...Ellipsis,
          ...FlexAuto,
          ...typography.subtitle2,
          ...OverflowHidden,
          ...FillWidth,
          fontWeight: 100,
          opacity: 0.25,
          [hasCls(classes.headerAction)]: {
            marginTop: spacing(1),
            opacity: 1,
            "& > p": {
              opacity: 0.25
            }
          },
          letterSpacing: 0.9
        }
      }
    },

    [child(classes.carousel)]: {
      ...FlexRow,
      ...PositionRelative,
      ...heightConstraint("20vh"),
      ...margin(0, 0, spacing(1)),
      ...overflow("hidden", "visible"),
      ...FillWidth,
      backgroundColor: darken(palette.background.paper, 0.2),
      zIndex: 2,
      "&::after": {
        ...Fill,
        ...PositionAbsolute,
        zIndex: 2,
        content: "' '",
        pointerEvents: "none",
        boxShadow: `inset 0 -5px 5px 2px rgba(0,0,0,0.1), ${shadows[4]}`
      },
      [child(classes.carouselContent)]: {
        ...FillHeight,
        ...FlexRow,
        ...flexAlign("flex-start", "center"),
        ...overflow("auto", "hidden"),
        [child(classes.carouselItem)]: {
          ...FlexRowCenter,
          ...PositionRelative,
          ...FillHeight,
          ...OverflowHidden,
          objectFit: "contain",
          [child(classes.carouselItemImage)]: {
            ...PositionRelative,
            ...OverflowHidden,
            objectFit: "contain", // maxHeight:
            // "-webkit-fill-available",
            height: "auto",
            maxWidth: "-webkit-fill-available"
          }
        }
      }
    },
    [child(classes.content)]: {
      ...padding(0, spacing(2), 0),
      ...OverflowAuto,
      "&, & *": {
        color: alpha(palette.primary.contrastText, 0.6)
      }
    },

    [child(classes.components)]: {
      ...FlexRow,
      ...PositionRelative,
      ...OverflowVisible, // ...heightConstraint("30vh"),
      ...margin(0, 0, spacing(1)),
      ...FillWidth,
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
      [child(classes.componentsContent)]: {
        ...FillHeight,
        ...FlexRow,
        ...flexAlign("flex-start", "flex-start"),
        ...overflow("auto", "hidden"),
        gap: spacing(2),
        [child(classes.componentItem)]: {
          ...FlexRow,
          ...PositionRelative,
          ...FillHeight,
          ...OverflowHidden,
          ...padding(spacing(2)),
          ...FlexAuto,

          [child(classes.componentItemView)]: {
            ...widthConstraint(`calc(300px + ${spacing(1)})`)
          }
        }
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

  actions?: PluginManifestActionKind | PluginManifestActionKind[]
}

/**
 * PluginManifestView Component
 *
 * @param { PluginManifestViewProps } props
 */
export function PluginManifestView(props: PluginManifestViewProps) {
  const { className, onClick: inOnClick, manifest, actions: inActions = ["none"], ...other } = props,
    actions = arrayOf(inActions),
    { name, author, version, description, overview, components } = manifest,
    { screenshots, iconUrl, websiteUrl, sourceUrl, featureContent, changeLogContent } = overview,
    theme = useTheme(),
    pluginManagerClient = useService(PluginManagerClient),
    [screenshotBackgrounds, setScreenshotBackground] = useState<Array<string | number>>(
      Array(overview?.screenshots?.length ?? 0)
    ),
    createScreenshotLoadedHandler = (idx: number) => (ev: React.SyntheticEvent<HTMLImageElement>) => {
      const newBgs = [...screenshotBackgrounds],
        colorThief = new ColorThief(),
        img = ev.currentTarget,
        dominantColor = colorThief.getColor(img)

      log.debug(`Dominant color (${idx}): ${dominantColor}`)
      newBgs[idx] = rgbToHex(dominantColor)
      setScreenshotBackground(newBgs)
    },
    onClick = !inOnClick
      ? undefined
      : (ev: React.SyntheticEvent) => {
          stopEvent(ev)
          inOnClick(manifest)
        },
    handleAction = Alert.usePromise<ReturnType<typeof createPluginManifestActionHandler>>(
      createPluginManifestActionHandler(pluginManagerClient, manifest?.id),
      {
        loading: ({ args: [action = "none"] }) => `${capitalize(action)} plugin...`,
        success: ({ result, args: [action = "none"] }) => `${capitalize(action)} Plugin Successful`,
        error: ({ err, args: [action = "none"] }) => `${capitalize(action)} Plugin Failed: ${err.message ?? err}`
      },
      [action, manifest]
    ),
    featuresText = `# Features
${overview.featureContent}`,
    changeLogText = `# Change Log

${overview.changeLogContent}`

  return (
    <PluginManifestViewRoot
      className={clsx(classes.root, {}, className)}
      elevation={4}
      onClick={onClick}
      {...other}
    >
      <Box className={classes.header}>
        <Box className={classes.headerIcon}>
          <PluginIconView
            unpackIfPossible
            size="lg"
            src={iconUrl}
          />
        </Box>
        <Box className={classes.headerBox}>
          <Box className={classes.headerTitle}>{name}</Box>
          <Box className={classes.headerSubheader}>{description}</Box>
          <Box
            className={classes.headerSubheader}
            dangerouslySetInnerHTML={{
              __html: [actions.includes("none") ? version : null, author?.company, author?.name, author?.email]
                .filter(isNotEmptyString)
                .join("&nbsp;&bull;&nbsp;")
            }}
          />

          {!actions.includes("none") && (
            <Box
              className={clsx(classes.headerSubheader, classes.headerAction)}
              sx={{
                ...FlexRow,
                ...flexAlign("center", "stretch"),
                opacity: 1,
                gap: theme.spacing(1)
              }}
            >
              
              <PluginManifestActionsButton
                actions={actions}
                onAction={handleAction}
              />

              <EllipsisBox sx={{ ...FlexScaleZero }}>{version}</EllipsisBox>
            </Box>
          )}
        </Box>
      </Box>
      {!!overview?.screenshots?.length && (
        <Box className={classes.carousel}>
          <Box className={classes.carouselContent}>
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
          </Box>
        </Box>
      )}

      {isNotEmptyString(featuresText) && (
        <Box className={classes.content}>
          <Markdown>{featuresText}</Markdown>
        </Box>
      )}

      {!!components?.length && (
        <Box className={classes.components}>
          <Box className={classes.componentsContent}>
            {components.map((comp, idx) => (
              <Box
                key={comp.id}
                className={classes.componentItem}
              >
                <PluginComponentView
                  className={classes.componentItemView}
                  manifest={manifest}
                  componentDef={comp}
                  noDetails
                  noChangeLog
                />
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {isNotEmptyString(changeLogText) && (
        <Box className={classes.content}>
          <Markdown>{changeLogText}</Markdown>
        </Box>
      )}
    </PluginManifestViewRoot>
  )
}

export default PluginManifestView
