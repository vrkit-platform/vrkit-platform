import type { ActiveSessionType } from "@vrkit-platform/shared"
import { useAppSelector } from "../../services/store"
import { sharedAppSelectors } from "../../services/store/slices/shared-app"
import { useService } from "../service-container"
import { SessionManagerClient } from "../../services/session-manager-client"
import { FlexColumnCenter, FlexRowCenter } from "@vrkit-platform/shared-ui"
import Button, { ButtonProps } from "@mui/material/Button"
import { match, P } from "ts-pattern"
import { useCallback } from "react"
import Box from "@mui/material/Box"


export interface LiveSessionButtonProps extends ButtonProps {
  activeSessionType: ActiveSessionType
}

export function LiveSessionButton({ sx, activeSessionType, ...other }: LiveSessionButtonProps) {
  const isAvailable = useAppSelector(sharedAppSelectors.isLiveSessionAvailable),
      isActive = activeSessionType === "LIVE",
      sessionManagerClient = useService(SessionManagerClient),
      text = match([isAvailable, isActive])
          .with([false, P.any], () => "Not Running")
          .with([true, false], () => "Connect")
          .with([true, true], () => "Disconnect")
          .otherwise(() => "unknown"),
      onClick = useCallback(() => {
        sessionManagerClient.setLiveSessionActive(!(
            isActive || !isAvailable
        ))
      }, [isActive, isAvailable])
  
  return (
      <Button
          disabled={!isAvailable}
          sx={{
            ...FlexRowCenter,
            ...sx
          }}
          onClick={onClick}
          variant={isAvailable ? "contained" : "text"}
          {...other}
      >
        <Box
            sx={{
              ...FlexColumnCenter
            }}
        >
          <Box sx={{}}>{text}</Box>
        </Box>
      </Button>
  )
}


export default LiveSessionButton