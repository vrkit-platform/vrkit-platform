// REACT
import React, { useMemo } from "react"

// CLSX
// 3FV
import { getLogger } from "@3fv/logger-proxy"

import type { BoxProps } from "@mui/material/Box"
// MUI
import Box from "@mui/material/Box"
import { darken, styled, useTheme } from "@mui/material/styles"

// APP
import {
  alpha,
  borderRadius,
  child,
  ClassNamesKey,
  createClassNames,
  CssSelectors,
  Fill,
  FillWidth,
  flex,
  flexAlign, FlexAuto,
  FlexColumn,
  FlexRowBox,
  FlexRowCenter,
  FlexScaleZero,
  hasCls,
  heightConstraint,
  linearGradient,
  notHasCls,
  OverflowAuto,
  OverflowHidden,
  OverflowVisible,
  padding,
  PositionRelative,
  rem,
  transition,
  Transparent
} from "vrkit-shared-ui"
import clsx from "clsx"
import { DashboardConfig } from "vrkit-models"
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
import AppBreadcrumbs from "../../app-breadcrumbs"
import { PageMetadata, PageMetadataProps } from "../../page-metadata"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const classPrefix = "dashboardsListView"
export const dashboardsListViewClasses = createClassNames(
  classPrefix,
  "root",
  "container",
  "item",
  "itemPaper",
  "itemCreateButton",
  "itemAction",
  "itemSelected",
  "itemIsOpen",
  "itemIsDefault",
  "itemDefaultBadge"
)
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

const DashboardsListViewRoot = styled(Box, {
  name: "DashboardsListViewRoot",
  label: "DashboardsListViewRoot"
})(({ theme }) => {
  const { palette, spacing, customShadows } = theme
  return {
    // root styles here
    [hasCls(dashboardsListViewClasses.root)]: {
      // ...flex(1, 1, "30vw"), // ...flexAlign("stretch","stretch"),
      // ...FlexAuto,
      ...FillWidth,
      ...OverflowVisible,
      ...transition(["flex-grow", "flex-shrink"]),
      
      [child(dashboardsListViewClasses.container)]: {
        // ...FlexRow,
        // ...FlexWrap,
        display: "grid",
        // gridTemplateColumns: `1fr 1fr`,
        gridTemplateColumns: `1fr`,
        ...FillWidth,
        ...flexAlign("flex-start", "flex-start"), // [child(dashboardsListViewClasses.itemLink)]: {
        ...padding("1rem"),
        //   textDecoration: "none",
        [child(dashboardsListViewClasses.item)]: {
          ...FlexRowCenter,
          ...OverflowHidden,
          ...PositionRelative, // ...flex(0,
          // 0,
          // "min(33%,
          // 25vw)"),
          // ...padding(0, "1rem"),
          filter: "drop-shadow(0px 2px 2px rgba(0,0,0, 0.25))",
          // ...heightConstraint("8.5rem"),
          ...flex(1, 0, "min(35%, 30vw)"), // ...widthConstraint("min(35%, 30vw)"),
          ...flexAlign("stretch", "flex-start"),
          [hasCls(dashboardsListViewClasses.itemSelected)]: {},

          [child(dashboardsListViewClasses.itemPaper)]: {
            ...FlexColumn,
            ...Fill,
            ...OverflowHidden,
            borderRadius: 0,
            // ...borderRadius(theme.shape.borderRadius / 4),
            // ...padding(spacing(1), spacing(1), spacing(1), spacing(1)),
            padding: 0,
            gap: spacing(1),
            textDecoration: "none",
            
            "&.first": {
              
                borderTopLeftRadius: theme.shape.borderRadius,
                borderTopRightRadius: theme.shape.borderRadius,
              
            },
            "&:not(.first)": {
            },
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
              
                borderBottomLeftRadius: theme.shape.borderRadius ,
                borderBottomRightRadius: theme.shape.borderRadius,
              
            },
            // boxShadow: customShadows.raisedCard,
            
            //[notHasCls(dashboardsListViewClasses.itemCreateButton)]: {
              ...flexAlign("stretch", "stretch"),
            //},

            [child(dashboardsListViewClasses.itemDefaultBadge)]: {
              ...FlexRowCenter,
              ...padding(spacing(0.25), spacing(0.5)),
              fontSize: rem(0.6),
              borderColor: palette.success.main,
              borderRadius: spacing(0.25),
              borderWidth: 0.5,
              borderStyle: "solid",
              color: palette.success.main
            }
          },
          [`${hasCls(dashboardsListViewClasses.itemCreateButton)}, ${child(dashboardsListViewClasses.itemCreateButton)}`]: {
            ...flexAlign("center", "flex-end"),
            ...transition(["color","fill","background"]),
            color: alpha(theme.palette.text.primary, 0.5),
            fill: alpha(theme.palette.text.primary, 0.5),
            [CssSelectors.hover]: {
              color: theme.palette.text.primary,
              fill: theme.palette.text.primary
            }
            //background: Transparent
          },
        }
        // }
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
            nav(WebPaths.app.dashboards + `/${newDashConfig.id}/edit`)
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
    pageMetadata:PageMetadataProps = {
      appContentBar: {
        title: "Dashboards",
        actions: <DashboardsListItemCreate onClick={createDash}/>
      }
    }

  return (
    <>
      <PageMetadata {...pageMetadata}/>
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
          
          {configs.map((config, idx) => {const posClassName = clsx({
            first: idx === 0,
            last: idx >= configs.length - 1
          }); return (
            <DashboardsListItem
              key={config.id}
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
