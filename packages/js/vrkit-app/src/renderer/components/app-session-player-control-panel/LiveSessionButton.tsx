import { useAppSelector } from "../../services/store"
import { sharedAppSelectors } from "../../services/store/slices/shared-app"
import { useService } from "../service-container"
import { SessionManagerClient } from "../../services/session-manager-client"
import { FlexRowCenter } from "@vrkit-platform/shared-ui"
import Button, { ButtonProps } from "@mui/material/Button"
import { match, P } from "ts-pattern"
import { useCallback } from "react"
import { useTheme } from "@mui/material/styles"
import BoltIcon from "@mui/icons-material/BoltSharp"
import Typography from "@mui/material/Typography"

export interface LiveSessionButtonProps extends ButtonProps {}

export function LiveSessionButton({ sx, disabled = false, ...other }: LiveSessionButtonProps) {
  const theme = useTheme(),
    activeSessionType = useAppSelector(sharedAppSelectors.selectActiveSessionType),
    isAvailable = useAppSelector(sharedAppSelectors.isLiveSessionAvailable),
    isActive = activeSessionType === "LIVE",
    sessionManagerClient = useService(SessionManagerClient),
    text = match([isAvailable, isActive])
      .with([false, P.any], () => "Not Available")
      .with([true, false], () => "Connect")
      .with([true, true], () => "Disconnect")
      .otherwise(() => "unknown"),
    onClick = useCallback(() => {
      sessionManagerClient.setLiveSessionActive(!(isActive || !isAvailable))
    }, [isActive, isAvailable])

  return (
    <Button
      disabled={!isAvailable || disabled}
      variant={isAvailable || isAvailable ? "contained" : "text"}
      color={isActive ? "error" : "primary"}
      size="small"
      onClick={onClick}
      sx={{
        ...FlexRowCenter,
        lineHeight: 1,
        gap: theme.spacing(1),
        ...sx
      }}
      {...other}
    >
      <BoltIcon />
      <Typography variant="inherit">{text}</Typography>
    </Button>
  )
}

export default LiveSessionButton
