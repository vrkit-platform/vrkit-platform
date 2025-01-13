// REACT
import React, { useMemo } from "react"

// CLSX
// 3FV
import { getLogger } from "@3fv/logger-proxy"

// MUI
import CloseIcon from "@mui/icons-material/Close"
import Button from "@mui/material/Button"
import type { BoxProps } from "@mui/material/Box"
import Box from "@mui/material/Box"
import { darken, styled, useTheme } from "@mui/material/styles"

// APP
import {
  alpha,
  child,
  ClassNamesKey,
  createClassNames,
  CssSelectors,
  EllipsisBox,
  Fill,
  FillBounds,
  FillWidth,
  flex,
  flexAlign,
  FlexAuto,
  FlexColumn,
  FlexRowCenter,
  FlexRowCenterBox,
  FlexScaleZero,
  hasCls,
  linearGradient,
  OverflowHidden,
  OverflowVisible,
  padding,
  PositionAbsolute,
  PositionRelative,
  rem,
  transition, Transparent
} from "@vrkit-platform/shared-ui"
import clsx from "clsx"
import { DashboardConfig } from "@vrkit-platform/models"
import { sharedAppSelectors } from "../../../services/store/slices/shared-app"
import { useAppSelector } from "../../../services/store"
import { useNavigate } from "react-router-dom"
import { WebPaths } from "../../../routes/WebPaths"
import { useService } from "../../service-container"
import { DashboardManagerClient } from "../../../services/dashboard-manager-client"
import { useAsyncCallback } from "../../../hooks"
import { useIsMounted } from "usehooks-ts"
import { Alert } from "../../../services/alerts"
import { Theme } from "../../../theme/ThemeTypes"
import GlobalStyles from "@mui/material/GlobalStyles"
import { DashboardsListItem, DashboardsListItemCreate } from "./DashboardsListItem"
import { PageMetadata, PageMetadataProps } from "../../page-metadata"
import { isNotEmptyString, newOnClickHandler } from "@vrkit-platform/shared"
import { asOption } from "@3fv/prelude-ts"


const log = getLogger(__filename)
const { info, debug, warn, error } = log

const classPrefix = "dashboardsListView"
const classes = createClassNames(
  classPrefix,
  "root",
  "container",
  "item",
  "itemPaper",
  "itemCreateButton",
  "itemAction",
  "itemSelected",
  "itemIsActive",
  "itemIsDefault",
  "itemDefaultBadge",
  "itemActiveBadge"
)

export const dashboardsListViewClasses = classes
export type DashboardsListViewClassKey = ClassNamesKey<typeof dashboardsListViewClasses>

function itemActionStyle({ palette, spacing }: Theme) {
  return {
    [`.${dashboardsListViewClasses.itemAction}`]: {
      ...transition(["opacity", "color"]),
      color: "inherit",
      "&:not(.menuAction)": {
        opacity: 0.5,
        transform: "scale(0.85) translateY(-4px)",
        alignSelf: "flex-start",
        "&:hover": {
          opacity: 1,
          "&.delete": {
            color: palette.error.main
          },
          "&.setAsDefault": {
            color: palette.success.main
          }
        }
      },
      "&.menuAction": {
        "&.delete": {
          color: palette.error.main
        }
      },
      gap: spacing(1)
    }
  }
}

function makeBadgeStyle(theme: Theme, color:string) {
  const {typography, spacing} = theme
  return {
    ...FlexRowCenter,
    ...padding(spacing(0.25), spacing(0.5)),
    ...typography.button,
    fontSize: rem(0.8),
    fontWeight: 800,
    borderColor: color,
    borderRadius: spacing(0.25),
    borderWidth: 1,
    borderStyle: "solid",
    color: color
  }
  
}

const DashboardsListViewRoot = styled(Box, {
  name: "DashboardsListViewRoot",
  label: "DashboardsListViewRoot"
})(({ theme }) => {
  const { palette, spacing, customShadows } = theme
  return {
    // root styles here
    [hasCls(dashboardsListViewClasses.root)]: {
      ...FillWidth,
      ...OverflowVisible,
      ...transition(["flex-grow", "flex-shrink"]),

      [child(dashboardsListViewClasses.container)]: {
        display: "grid",
        gridTemplateColumns: `1fr`,
        ...FillWidth,
        ...flexAlign("flex-start", "flex-start"),
        ...padding("1rem"),
        [child(dashboardsListViewClasses.item)]: {
          ...FlexRowCenter,
          ...OverflowHidden,
          ...PositionRelative,
          filter: "drop-shadow(0px 2px 2px rgba(0,0,0, 0.25))",
          ...flex(1, 0, "min(35%, 30vw)"),
          ...flexAlign("stretch", "flex-start"),
          
          [hasCls(dashboardsListViewClasses.itemIsDefault)]: {
            [child(dashboardsListViewClasses.itemPaper)]: {
              "&::after": {
                opacity: 1,
                border: `2px solid ${palette.success.main}`,
                backgroundImage: linearGradient(
                    "to bottom",
                    `${alpha(theme.palette.success.main, 0.05)} 0%`,
                    `${alpha(theme.palette.success.main, 0.2)} 95%`,
                    `${alpha(theme.palette.success.main, 0.3)} 100%`
                ),
              }
            }
          },
          [hasCls(dashboardsListViewClasses.itemIsActive)]: {
            [child(dashboardsListViewClasses.itemPaper)]: {
              "&::after": {
                opacity: 1,
                border: `2px solid ${palette.error.main}`,
                backgroundImage: linearGradient(
                    "to bottom",
                    `${alpha(theme.palette.error.main, 0.05)} 0%`,
                    `${alpha(theme.palette.error.main, 0.2)} 95%`,
                    `${alpha(theme.palette.error.main, 0.3)} 100%`
                ),
              }
            }
          },
          [hasCls(dashboardsListViewClasses.itemSelected)]: {},

          [child(dashboardsListViewClasses.itemPaper)]: {
            ...FlexColumn,
            ...Fill,
            ...OverflowHidden,
            borderRadius: 0,
            padding: 0,
            gap: spacing(1),
            textDecoration: "none",
            ...flexAlign("stretch", "stretch"),
            
            "&::after": {
              ...PositionAbsolute,
              ...FillBounds,
              // zIndex: 2,
              
              borderRadius: theme.shape.borderRadius,
              pointerEvents: "none",
              content: "' '",
              border: `2px solid ${Transparent}`,
              backgroundImage: "none",
              opacity: 0,
              transition: theme.transitions.create(["border", "background-image", "opacity"])
            },
            
            "&.first": {
              borderTopLeftRadius: theme.shape.borderRadius,
              borderTopRightRadius: theme.shape.borderRadius
            },
            "&:not(.first)": {},
            "&:not(.last)": {
              backgroundImage: linearGradient(
                "to bottom",
                `${darken(theme.palette.background.paper, 0.03)} 0%`,
                `${darken(theme.palette.background.paper, 0.04)} 95%`,
                `${darken(theme.palette.background.paper, 0.1)} 100%`
              ),

              ...OverflowVisible
            },
            "&.last": {
              borderBottomLeftRadius: theme.shape.borderRadius,
              borderBottomRightRadius: theme.shape.borderRadius
            },

            [child(classes.itemDefaultBadge)]: makeBadgeStyle(theme, palette.success.main),
            [child(classes.itemActiveBadge)]: makeBadgeStyle(theme, palette.error.main)
          },
          [`${hasCls(dashboardsListViewClasses.itemCreateButton)}, ${child(
            dashboardsListViewClasses.itemCreateButton
          )}`]: {
            ...flexAlign("center", "flex-end"),
            ...transition(["color", "fill", "background"]),
            color: alpha(theme.palette.text.primary, 0.5),
            fill: alpha(theme.palette.text.primary, 0.5),
            [CssSelectors.hover]: {
              color: theme.palette.text.primary,
              fill: theme.palette.text.primary
            }
          }
        }
      }
    },
    ...itemActionStyle(theme)
  }
})

/**
 * DashboardsListView Component Properties
 */
export interface DashboardsListViewProps extends BoxProps {}

/**
 * DashboardsListView Component
 *
 * @param { DashboardsListViewProps } props
 */
export function DashboardsListView(props: DashboardsListViewProps) {
  const { className, ...other } = props,
    isMounted = useIsMounted(),
    configs = useAppSelector(sharedAppSelectors.selectDashboardConfigs),
    activeDashboardConfig = useAppSelector(sharedAppSelectors.selectActiveDashboardConfig),
      activeDashboardConfigId = activeDashboardConfig?.id,
    dashboardClient = useService(DashboardManagerClient),
    nav = useNavigate(),
    createDashAsync = useAsyncCallback(dashboardClient.createDashboardConfig),
    createDash = Alert.usePromise(
      async (): Promise<DashboardConfig> => {
        try {
          // CREATE NEW DASH CONFIG
          const newDashConfig = await createDashAsync.execute()
          log.info(`Created new dashboard config (${newDashConfig.id}`)
          if (isMounted) {
            nav(WebPaths.app.dashboards + `/${newDashConfig.id}`)
          }
          return newDashConfig
        } catch (err) {
          log.error(err)
          throw err
        }
      },
      {
        loading: "Creating dashboard...",
        success: ({ result }) => `"Successfully created dashboard (${result.name})."`,
        error: ({ err }) => `Unable to create dashboard config: ${err.message ?? err}`
      },
      [isMounted]
    ),
    theme = useTheme(),
    globalStyles = useMemo(() => itemActionStyle(theme), [theme]),
    hasActiveDash = isNotEmptyString(activeDashboardConfigId),
    pageMetadata: PageMetadataProps = {
      appContentBar: {
        title: "Dashboards",
        actions: (
          <FlexRowCenterBox
            sx={{
              gap: theme.spacing(1)
            }}
          >
            <Button
              color={"error"}
              size="small"
              disabled={!hasActiveDash}
              variant={hasActiveDash ? "contained" : "outlined"}
              onClick={newOnClickHandler<any>(() => {
                dashboardClient.closeDashboard().catch(err => {
                  log.error(`Failed to close dashboard`, err)
                  Alert.onError(`Failed to close dashboard`)
                })
              })}
              sx={{
                ...FlexAuto,
                ...FlexRowCenter,
                maxWidth: 350,
                gap: theme.spacing(1)
              }}
            >
              <CloseIcon />
              <EllipsisBox sx={{...FlexScaleZero}}>Close Dash {asOption(activeDashboardConfig?.name).filter(isNotEmptyString).map(it => `(${it})`).getOrElse("")}</EllipsisBox>
            </Button>
            <DashboardsListItemCreate onClick={createDash} />
          </FlexRowCenterBox>
        )
      }
    }

  return (
    <>
      <PageMetadata {...pageMetadata} />
      <GlobalStyles styles={globalStyles} />
      <DashboardsListViewRoot
        className={clsx(dashboardsListViewClasses.root, className)}
        {...other}
      >
        <Box className={clsx(dashboardsListViewClasses.container, className)}>
          {/*<FlexRowBox sx={{...flexAlign("space-between")}}>*/}
          {/*<AppBreadcrumbs/>*/}
          {/*<DashboardsListItemCreate onClick={createDash} />*/}
          {/*</FlexRowBox>*/}

          {configs.map((config, idx) => {
            const posClassName = clsx({
              first: idx === 0,
              last: idx >= configs.length - 1
            })
            return (
              <DashboardsListItem
                key={idx}
                sx={{
                  zIndex: configs.length - idx + 1
                }}
                config={config}
                paperClassName={posClassName}
                className={posClassName}
              />
            )
          })}
        </Box>
      </DashboardsListViewRoot>
    </>
  )
}

export default DashboardsListView
