// import {dialog} from "@electron/remote"
import Button, { ButtonProps } from "@mui/material/Button"
import { FlexRowCenter } from "@vrkit-platform/shared-ui"
import { useAppSelector } from "../../services/store/AppStoreHooks"
import React from "react"
import { getLogger } from "@3fv/logger-proxy"
import { SessionManagerClient } from "../../services/session-manager-client"
import { useService } from "../service-container"
import { sharedAppSelectors } from "../../services/store/slices/shared-app"
import { Alert } from "../../services/alerts"
import FileOpenIcon from "@mui/icons-material/FileOpenSharp"
import Typography from "@mui/material/Typography"
import { useTheme } from "@mui/material/styles"

const log = getLogger(__filename)

export interface DiskSessionButtonProps extends Pick<ButtonProps, "disabled" | "sx" | "variant" | "size"> {}

export function DiskSessionButton({ sx, ...other }: DiskSessionButtonProps) {
  const theme = useTheme(),
    diskSession = useAppSelector(sharedAppSelectors.selectDiskSession),
    activeSessionType = useAppSelector(sharedAppSelectors.selectActiveSessionType),
    hasActiveSession = useAppSelector(sharedAppSelectors.hasActiveSession),
    isActive = activeSessionType === "DISK",
    isAvailable = diskSession?.isAvailable === true,
    sessionManagerClient = useService(SessionManagerClient),
    onCloseClick = Alert.usePromise(
      async () => {
        await sessionManagerClient.closeDiskSession()
      },
      {
        loading: () => `Closing disk session...`,
        success: ({ result }) => `Closed disk session...`,
        error: ({ err }) => `Unable to close disk session: ${err?.message ?? err}`
      },
      [sessionManagerClient]
    ),
    onOpenClick = Alert.usePromise(
      async () => {
        const file = await sessionManagerClient.showOpenDiskSession()
        log.info(`Loaded disk session (${file})`)
        return file
      },
      {
        loading: () => `Opening disk session...`,
        success: ({ result }) => `Opened disk session (${result})`,
        error: ({ err }) => `Unable to close disk session: ${err?.message ?? err}`
      },
      [sessionManagerClient]
    )

  return (
    <Button
      variant="contained"
      color={isAvailable ? "error" : "primary"}
      size="small"
      onClick={isAvailable ? onCloseClick.execute : onOpenClick.execute}
      sx={{
        ...FlexRowCenter,
        lineHeight: 1,
        gap: theme.spacing(1)
      }}
      {...other}
    >
      <FileOpenIcon />
      <Typography variant="inherit">{!isAvailable ? `Open Disk Session` : `Close Disk Session`}</Typography>
    </Button>
  )
}
