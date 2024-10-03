// REACT
import React, { useCallback, useContext, useMemo } from "react"

// CLSX
import clsx from "clsx"

// 3FV
import { getLogger } from "@3fv/logger-proxy"

import type { BoxProps } from "@mui/material/Box"
// MUI
import Box from "@mui/material/Box"
import { darken, styled, useTheme } from "@mui/material/styles"

// APP
import {
  child,
  ClassNamesKey,
  createClassNames,
  Ellipsis,
  FillHeight,
  FillWidth,
  flex,
  flexAlign,
  FlexAuto,
  FlexColumn,
  FlexRowCenter,
  FlexScaleZero,
  hasCls,
  OverflowAuto,
  OverflowHidden,
  OverflowVisible,
  padding,
  transition
} from "vrkit-app-renderer/styles"
import DashboardsViewContext from "../../pages/dashboards/DashboardsViewContext"
import { isEmpty } from "vrkit-app-common/utils"
import { useAppSelector } from "vrkit-app-renderer/services/store"
import { sharedAppSelectors } from "vrkit-app-renderer/services/store/slices/shared-app"
import IconButton from "@mui/material/IconButton"
import Icon from "../icon"
import { faClose } from "@awesome.me/kit-79150a3eed/icons/sharp/light"
import Typography from "@mui/material/Typography"
import { isDefined } from "@3fv/guard"
import { DashboardConfig, DashboardLayoutType } from "vrkit-models"
import { OverlayManagerClient } from "../../services/overlay-client"
import { useService } from "../service-container"
import { useAsyncCallback } from "../../hooks"
import { startCase } from "lodash"
import Checkbox from "@mui/material/Checkbox"
import Button from "@mui/material/Button"
import { FlexRowCenterBox } from "../box"
import { DashboardManagerClient } from "../../services/dashboard-manager-client"
// import { faWindowClose } from "@awesome.me/kit-79150a3eed"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const classPrefix = "dashboardsListEditor"
export const classNames = createClassNames(
  classPrefix,
  "root",
  "visible",
  "content",
  "header",
  "headerActions",
  "headerTitle",

  "details",
  "detailsContent",
  "layouts",
  "layout",
  "widgets",
  "widget"
)
export type DashboardsListEditorClassKey = ClassNamesKey<typeof classNames>

const DashboardsListEditorRoot = styled(Box, {
  name: "DashboardsListEditorRoot",
  label: "DashboardsListEditorRoot"
})(({ theme }) => ({
  // root styles here
  [hasCls(classNames.root)]: {
    ...transition(["flex-grow", "flex-shrink", "flex-basis", "filter"]),
    ...FlexColumn,
    ...FillHeight,
    ...OverflowHidden,
    ...flex(0, 0, 0),
    filter: `none`,
    background: darken(theme.palette.background.appBar, 0.4),
    [hasCls(classNames.visible)]: {
      ...flex(1, 1, "calc(min(40vw,300px))"),
      filter: `drop-shadow(0 0 0.75rem ${theme.palette.background.session})`
    },

    [child(classNames.content)]: {
      ...FlexColumn,
      ...FlexScaleZero,
      ...OverflowHidden,

      // gap: theme.spacing(1.5),
      [child(classNames.header)]: {
        ...padding(theme.spacing(1)),
        ...FlexRowCenter,
        filter: `drop-shadow(0 0 0.75rem ${theme.palette.background.session})`,
        [child(classNames.headerTitle)]: {
          ...FlexScaleZero,
          ...Ellipsis
        },
        [child(classNames.headerActions)]: {
          ...FlexRowCenter,
          ...FlexAuto
        }
      },
      [child(classNames.details)]: {
        ...FlexColumn,
        ...OverflowAuto,
        ...FlexScaleZero,

        ...flexAlign("center", "stretch"),

        background: darken(theme.palette.background.appBar, 0.2),
        [child(classNames.detailsContent)]: {
          ...padding(theme.spacing(1)),
          ...FillWidth,
          ...FlexColumn,
          ...FlexAuto,
          ...OverflowVisible,
          gap: theme.spacing(1),
          [child(classNames.layouts)]: {
            ...FillWidth,
            ...FlexColumn,
            ...FlexAuto,
            gap: theme.spacing(1),
            [child(classNames.layout)]: {
              gap: theme.spacing(1),
              ...FlexRowCenter,
              ...flexAlign("stretch", "center"),
              ...FlexAuto,

              [child("checkbox")]: {
                ...FlexAuto
              }
            }
          }
        }
      }
    }
  }
}))

/**
 * DashboardsListEditor Component Properties
 */
export interface DashboardsListEditorProps extends BoxProps {}

interface LayoutFieldProps {
  type: DashboardLayoutType
  label: string
  enabled: boolean

  config: DashboardConfig

  onChange: (enabled: boolean) => void
}

function LayoutField({ type, label, enabled, config, onChange }: LayoutFieldProps) {
  return (
    <Box className={clsx(classNames.layout)}>
      <Box
        sx={{
          ...FlexScaleZero,
          ...Ellipsis
        }}
      >
        {label}{" "}
        <Typography
          component="span"
          variant="caption"
          sx={{ opacity: 0.7, fontStyle: "italic" }}
        >
          {enabled ? "" : "Not "}Enabled
        </Typography>
      </Box>
      <Checkbox
        sx={{
          ...FlexAuto
        }}
        defaultChecked={enabled}
        onChange={(event: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
          onChange(checked)
        }}
      />
    </Box>
  )
}

/**
 * DashboardsListEditor Component
 *
 * @param { DashboardsListEditorProps } props
 * @returns {JSX.Element}
 */
export function DashboardsListEditor(props: DashboardsListEditorProps) {
  const theme = useTheme(),
    { className, ...other } = props,
    configs = useAppSelector(sharedAppSelectors.selectDashboardConfigs),
    { selectedConfigId, setSelectedConfigId } = useContext(DashboardsViewContext),
    config: DashboardConfig = configs.find(config => config.id === selectedConfigId),
    dashboardClient = useService(DashboardManagerClient),
    patchConfigAsync = useAsyncCallback(dashboardClient.updateDashboardConfig),
    // }, [config, overlayClient]),
    launchLayoutEditorAsync = useAsyncCallback(dashboardClient.launchLayoutEditor),
    // (config.id, type)
    // }, [config, overlayClient]),
    canModify = useMemo(() => {
      return !launchLayoutEditorAsync.loading && !patchConfigAsync.loading
    }, [launchLayoutEditorAsync.loading, patchConfigAsync.loading])

  return (
    <DashboardsListEditorRoot
      className={clsx(
        classNames.root,
        {
          [classNames.visible]: !isEmpty(selectedConfigId) && isDefined(config)
        },
        className
      )}
      {...other}
    >
      <Box className={clsx(classNames.content)}>
        {/* HEADER */}
        <Box className={clsx(classNames.header)}>
          <Box className={clsx(classNames.headerTitle)}>
            <Typography variant="h5">{config?.name}</Typography>
          </Box>
          <Box className={clsx(classNames.headerActions)}>
            <IconButton
              aria-label="close"
              color="inherit"
              onClick={() => {
                canModify && setSelectedConfigId("")
              }}
            >
              <Icon
                fa={true}
                icon={faClose}
              />
            </IconButton>
          </Box>
        </Box>
        <Box className={clsx(classNames.details)}>
          {config && (
            <Box className={clsx(classNames.detailsContent)}>
              <Box className={clsx(classNames.layouts)}>
                <FlexRowCenterBox>
                  <Typography
                    sx={{
                      ...Ellipsis,
                      ...FlexScaleZero
                    }}
                    variant="h6"
                  >
                    Layouts
                  </Typography>
                  <Button
                    sx={{
                      ...FlexAuto
                    }}
                    variant="contained"
                    disabled={!canModify || (!config?.vrEnabled && !config?.screenEnabled)}
                    onClick={() => {
                      canModify && launchLayoutEditorAsync.execute(config.id)
                    }}
                  >
                    Edit Layouts
                  </Button>
                </FlexRowCenterBox>
                <LayoutField
                  type={DashboardLayoutType.VR}
                  enabled={config.vrEnabled}
                  label="VR"
                  config={config}
                  onChange={vrEnabled => {
                    canModify && patchConfigAsync.execute(config.id, { vrEnabled })
                  }}
                />
                <LayoutField
                  type={DashboardLayoutType.SCREEN}
                  enabled={config.screenEnabled}
                  config={config}
                  label="Screen"
                  onChange={screenEnabled => {
                    canModify && patchConfigAsync.execute(config.id, { screenEnabled })
                  }}
                />
              </Box>
            </Box>
          )}
        </Box>
        {/*  FIELDS */}
      </Box>
    </DashboardsListEditorRoot>
  )
}

export default DashboardsListEditor
