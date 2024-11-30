// REACT
import React, { useMemo } from "react"

// CLSX
// 3FV
import { getLogger } from "@3fv/logger-proxy"

import type { BoxProps } from "@mui/material/Box"
// MUI
import Box from "@mui/material/Box"
import { styled, useTheme } from "@mui/material/styles"

// APP
import {
  borderRadius,
  child,
  ClassNamesKey,
  createClassNames,
  Fill,
  FillWidth,
  flex,
  flexAlign,
  FlexColumn,
  FlexRowCenter,
  FlexScaleZero,
  hasCls,
  heightConstraint,
  notHasCls,
  OverflowAuto,
  OverflowHidden,
  padding,
  PositionRelative,
  rem,
  transition
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
      ...FlexScaleZero,
      ...OverflowAuto,
      ...transition(["flex-grow", "flex-shrink"]),
      [child(dashboardsListViewClasses.container)]: {
        // ...FlexRow,
        // ...FlexWrap,
        display: "grid",
        gridTemplateColumns: `1fr 1fr`,
        ...FillWidth,
        ...flexAlign("flex-start", "flex-start"), // [child(dashboardsListViewClasses.itemLink)]: {
        //   textDecoration: "none",
        [child(dashboardsListViewClasses.item)]: {
          ...FlexRowCenter,
          ...OverflowHidden,
          ...PositionRelative, // ...flex(0,
          // 0,
          // "min(33%,
          // 25vw)"),
          ...padding("1rem"),
          ...heightConstraint("max(10rem,33%)"),
          ...flex(1, 0, "min(35%, 30vw)"), // ...widthConstraint("min(35%, 30vw)"),
          ...flexAlign("stretch", "flex-start"),
          [hasCls(dashboardsListViewClasses.itemSelected)]: {},

          [child(dashboardsListViewClasses.itemPaper)]: {
            ...FlexColumn,
            ...Fill,
            ...OverflowHidden,
            ...borderRadius(theme.shape.borderRadius / 2),
            ...padding(spacing(1), spacing(0.5), spacing(0.5), spacing(0.5)),
            gap: "0.5rem",
            textDecoration: "none",
            boxShadow: customShadows.raisedCard,
            [hasCls(dashboardsListViewClasses.itemCreateButton)]: {
              ...flexAlign("center", "center")
            },
            [notHasCls(dashboardsListViewClasses.itemCreateButton)]: {
              ...flexAlign("stretch", "stretch")
            },

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
          }
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
    globalStyles = useMemo(() => itemActionStyle(theme), [theme])

  return (
    <>
      <GlobalStyles styles={globalStyles} />
      <DashboardsListViewRoot
        className={clsx(dashboardsListViewClasses.root, className)}
        {...other}
      >
        <Box className={clsx(dashboardsListViewClasses.container, className)}>
          {configs.map(config => (
            <DashboardsListItem
              key={config.id}
              config={config}
            />
          ))}
          <DashboardsListItemCreate onClick={createDash} />
        </Box>
      </DashboardsListViewRoot>
    </>
  )
}

export default DashboardsListView
