import Box from "@mui/material/Box"
import Button, { ButtonProps } from "@mui/material/Button"
import { styled, useTheme } from "@mui/material/styles"
import { alpha, flex, FlexColumnCenter, FlexRowCenter, paddingRem, rem } from "../../styles/ThemedStyles"

import { useAppSelector } from "../../services/store/AppStoreHooks"
import { sessionManagerSelectors } from "../../services/store/slices/session-manager"
import React, { useCallback } from "react"
import { FlexRowCenterBox } from "../box"

import { getLogger } from "@3fv/logger-proxy"
import { useService } from "../service-container"

import { OverlayMode } from "vrkit-app-common/models/overlay-manager"
import { sharedAppSelectors } from "../../services/store/slices/shared-app"
import SharedAppStateClient from "vrkit-app-renderer/services/shared-app-state-client"
// import { SharedAppStateClient } from "../../services/shared-app-state-client"

const log = getLogger(__filename)

const OverlayModeSessionBox = styled(FlexRowCenterBox, { name: "OverlayModeSessionBox" })(({ theme }) => ({
  backgroundColor: alpha(theme.palette.success.main, 0.2), // ...widthConstraint(rem(6)),
  ...flex(0, 0, "auto"),
  ...paddingRem(0, 1),
  gap: rem(1)
}))


/**
 * OverlayModeButtonProps - Props for the OverlayModeSessionButton component.
 *
 * This interface extends the ButtonProps from Material-UI and does not
 * introduce any additional properties. It is a placeholder for further
 * customization if needed.
 */
interface OverlayModeButtonProps extends ButtonProps {
}


/**
 * OverlayModeSessionButton is a React component that renders a button to
 * toggle overlay modes in the app based on the session state.
 *
 * @param {OverlayModeButtonProps} props - The properties object for configuring the button.
 * @param {object} props.sx - The style object for custom styles.
 * @param {...object} other - Additional properties to spread on the Button component.
 * @return {JSX.Element} The rendered button component.
 */
function OverlayModeSessionButton({ sx, ...other }: OverlayModeButtonProps) {
  const hasActiveSession = useAppSelector(sessionManagerSelectors.hasActiveSession),
    overlayMode = useAppSelector(sharedAppSelectors.selectOverlayMode),
    sharedAppClient = useService(SharedAppStateClient),
    onClick = useCallback(() => {
      sharedAppClient.setOverlayMode(overlayMode === OverlayMode.NORMAL ? OverlayMode.EDIT : OverlayMode.NORMAL)
    }, [sharedAppClient, overlayMode])

  return (
    <Button
      sx={{
        ...FlexRowCenter,
        ...sx
      }}
      variant={"text"}
      color={"success"}
      onClick={onClick}
      disabled={!hasActiveSession}
      {...other}
    >
      <Box
        sx={{
          ...FlexColumnCenter
        }}
      >
        {!hasActiveSession
          ? `Overlay Mode Disabled`
          : `Overlay ${overlayMode === OverlayMode.EDIT ? "Normal" : "Edit"}  Mode`}
      </Box>
    </Button>
  )
}

export interface OverlayModeSessionWidgetProps {}

export function OverlayModeSessionWidget(props: OverlayModeSessionWidgetProps) {
  return (
    <OverlayModeSessionBox>
      <OverlayModeSessionButton />
    </OverlayModeSessionBox>
  )
}
