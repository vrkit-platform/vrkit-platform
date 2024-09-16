// import {dialog} from "@electron/remote"
import Box, { BoxProps } from "@mui/material/Box"
import Button, { ButtonProps } from "@mui/material/Button"
import { styled, useTheme } from "@mui/material/styles"
import { Grid2Props } from "@mui/material/Unstable_Grid2"
import {
  alpha,
  createClassNames,
  FillWidth,
  flex,
  flexAlign,
  FlexColumnCenter,
  FlexRow,
  FlexRowCenter,
  hasCls,
  heightConstraint,
  padding,
  paddingRem,
  rem
} from "../../styles"
import clsx from "clsx"
import { useAppSelector } from "../../services/store"
import { sessionManagerSelectors } from "vrkit-app-renderer/services/store/slices/session-manager"
import React, { useCallback } from "react"
import { FlexAutoBox, FlexRowBox, FlexRowCenterBox, FlexScaleZeroBox } from "../box"
import { match, P } from "ts-pattern"
import { getLogger } from "@3fv/logger-proxy"
import SessionManagerClient from "vrkit-app-renderer/services/session-manager-client"
import { useService } from "../service-container"
import { SessionTiming } from "vrkit-models"

import { DurationView, MILLIS_IN_HR } from "../time"
import { ActiveSessionType, SessionDetail } from "vrkit-app-common/models/session-manager"
import { OverlayMode } from "vrkit-app-common/models/overlay-manager"

const log = getLogger(__filename)

const classNamePrefix = "sessionPlayerControlBar"

const classNames = createClassNames(
  classNamePrefix,
  "root",
  "inactive",
  "active"
)

export interface SessionPlayerControlBarProps extends Grid2Props {}

const SPCRoot = styled("div", { name: "SessionPlayerControlBar" })(
  ({ theme }) => ({
    [hasCls(classNames.root)]: {
      backgroundColor: theme.palette.background.session,
      backgroundImage: theme.palette.background.sessionImage,
      ...FillWidth,
      ...FlexRow,
      [hasCls(classNames.active)]: {
        ...heightConstraint(rem(6)) // backgroundColor:
        // theme.palette.background.session,
      },
      [hasCls(classNames.inactive)]: {
        ...heightConstraint(rem(3))
      }
    }
  })
)

interface SessionDetailBoxProps {
  detail: SessionDetail
}

const SessionDetailTable = styled("table", { name: "SessionDetailTable" })(
  ({ theme }) => ({})
)

function SessionDetailBox({ detail }: SessionDetailBoxProps) {
  const { info, type } = detail,
    { weekendInfo: winfo } = info

  return (
    <SessionDetailTable>
      <tbody>
        <tr>
          <td>Track</td>
          <td>{winfo.trackDisplayName}</td>
        </tr>
        <tr>
          <td>Length</td>
          <td>{winfo.trackLength}</td>
        </tr>
      </tbody>
    </SessionDetailTable>
  )
}

const LiveSessionBox = styled(FlexRowCenterBox, { name: "LiveSessionBox" })(
  ({ theme }) => ({
    backgroundColor: alpha(theme.palette.action.active, 0.6), // ...widthConstraint(rem(6)),
    ...flex(0, 0, "auto"),
    ...paddingRem(0, 1),
    gap: rem(1)
  })
)

export interface LiveSessionButtonProps extends ButtonProps {
  activeSessionType: ActiveSessionType
}

export function LiveSessionButton({
  sx,
  activeSessionType,
  ...other
}: LiveSessionButtonProps) {
  const isAvailable = useAppSelector(
      sessionManagerSelectors.isLiveSessionAvailable
    ),
    isActive = activeSessionType === "LIVE",
    sessionManagerClient = useService(SessionManagerClient),
    text = match([isAvailable, isActive])
      .with([false, P.any], () => "Not Running")
      .with([true, false], () => "Connect")
      .with([true, true], () => "Disconnect")
      .otherwise(() => "unknown"),
    onClick = useCallback(() => {
      sessionManagerClient.setActiveSessionType(
        isActive || !isAvailable ? "NONE" : "LIVE"
      )
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

const DiskSessionBox = styled(FlexRowCenterBox, { name: "DiskSessionBox" })(
  ({ theme }) => ({
    backgroundColor: alpha(theme.palette.secondary.main, 0.2), // ...widthConstraint(rem(6)),
    ...flex(0, 0, "auto"),
    ...paddingRem(0, 1),
    gap: rem(1)
  })
)

export interface DiskSessionButtonProps extends ButtonProps {
  activeSessionType: ActiveSessionType
}

export function DiskSessionButton({
  sx,
  activeSessionType,
  ...other
}: DiskSessionButtonProps) {
  const diskSession = useAppSelector(sessionManagerSelectors.selectDiskSession),
    isActive = activeSessionType === "DISK",
    isAvailable = diskSession?.isAvailable === true,
      sessionManagerClient = useService(SessionManagerClient),
    onCloseClick = useCallback(() => {
      sessionManagerClient.closeDiskSession()
    },[sessionManagerClient]),
    onOpenClick = useCallback(() => {
      sessionManagerClient
          .showOpenDiskSession()
        .catch(err => log.error("Failed to create disk player", err))
    },[sessionManagerClient])

  return (
    <Button
      sx={{
        ...FlexRowCenter,
        ...sx
      }}
      variant={"text"}
      color={"secondary"}
      onClick={isAvailable ? onCloseClick : onOpenClick}
      {...other}
    >
      <Box
        sx={{
          ...FlexColumnCenter
        }}
      >
        {!isAvailable ? `Open Session File` : `Close Session File`}
      </Box>
    </Button>
  )
}

interface SessionTimingViewProps extends BoxProps {
  timing: SessionTiming

  type: ActiveSessionType

  session: SessionDetail

  showHours?: boolean
}

function SessionTimingView({
  type,
  session,
  timing,
  showHours = timing.currentTimeMillis >= MILLIS_IN_HR
}: SessionTimingViewProps) {
  const { sampleIndex, sampleCount, isLive } = timing

  return (
    <FlexScaleZeroBox>
      {/*<Moment date={sessionTime} format="HH:mm:ss.SSS"/>*/}
      <DurationView
        millis={timing.currentTimeMillis}
        showHours={showHours}
      />
      {!isLive && timing.totalTimeMillis > 0 && (
        <>
          &nbsp;of&nbsp;
          <DurationView
            millis={timing.totalTimeMillis}
            showHours={showHours}
          />
        </>
      )}
    </FlexScaleZeroBox>
  )
}

const OverlayModeSessionBox = styled(FlexRowCenterBox, { name: "DashboardSessionBox" })(
    ({ theme }) => ({
      backgroundColor: alpha(theme.palette.success.main, 0.2), // ...widthConstraint(rem(6)),
      ...flex(0, 0, "auto"),
      ...paddingRem(0, 1),
      gap: rem(1)
    })
)

export interface OverlayModeButtonProps extends ButtonProps {

}

export function OverlayModeButton({
  sx,
  ...other
}: OverlayModeButtonProps) {
  const 
      hasActiveSession = useAppSelector(sessionManagerSelectors.hasActiveSession), 
      overlayMode = useAppSelector(sessionManagerSelectors.selectOverlayMode),
      
      sessionManagerClient = useService(SessionManagerClient),
      
      onClick = useCallback(() => {
        sessionManagerClient.setOverlayMode(overlayMode === OverlayMode.NORMAL ? OverlayMode.EDIT : OverlayMode.NORMAL)
      },[sessionManagerClient, overlayMode])      
  
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
          {!hasActiveSession ? `Overlay Mode Disabled` : `Overlay ${overlayMode === OverlayMode.EDIT ? "Normal" : "Edit"}  Mode`}
        </Box>
      </Button>
  )
}

export function SessionPlayerControlBar(props: SessionPlayerControlBarProps) {
  const theme = useTheme(),
    hasAvailableSession = useAppSelector(
      sessionManagerSelectors.hasAvailableSession
    ),
    isLiveSessionAvailable = useAppSelector(
      sessionManagerSelectors.isLiveSessionAvailable
    ),
    liveSession = useAppSelector(sessionManagerSelectors.selectLiveSession),
    diskSession = useAppSelector(sessionManagerSelectors.selectDiskSession),
    activeSession = useAppSelector(sessionManagerSelectors.selectActiveSession),
    activeSessionType = useAppSelector(
      sessionManagerSelectors.selectActiveSessionType
    ),
    activeSessionTiming = useAppSelector(
      sessionManagerSelectors.selectActiveSessionTiming
    )

  return (
    <SPCRoot
      className={clsx(classNames.root, {
        [classNames.active]: hasAvailableSession,
        [classNames.inactive]: !hasAvailableSession
      })}
      sx={{
        ...FillWidth
      }}
    >
      <FlexRowBox
        sx={{
          ...FillWidth
        }}
      >
        <FlexScaleZeroBox
          sx={{
            ...padding(rem(0.5)),
            ...FlexRowCenter,
            ...flexAlign("center", "start"),
            gap: rem(1)
          }}
        >
          {activeSession ? (
            <>
              <FlexAutoBox>{activeSessionType}</FlexAutoBox>
              <SessionTimingView
                type={activeSessionType}
                session={activeSession}
                timing={activeSessionTiming}
              />
            </>
          ) : (
            <>No Active Session</>
          )}
        </FlexScaleZeroBox>
        
        <OverlayModeSessionBox>
          <OverlayModeButton />
        </OverlayModeSessionBox>
        <DiskSessionBox>
          <DiskSessionButton activeSessionType={activeSessionType} />
          {diskSession?.isAvailable && (
            <SessionDetailBox detail={diskSession} />
          )}
        </DiskSessionBox>
        <LiveSessionBox>
          <LiveSessionButton activeSessionType={activeSessionType} />
          {isLiveSessionAvailable && <SessionDetailBox detail={liveSession} />}
        </LiveSessionBox>
      </FlexRowBox>
    </SPCRoot>
  )
}

export const sessionPlayerControlBarClasses = classNames
