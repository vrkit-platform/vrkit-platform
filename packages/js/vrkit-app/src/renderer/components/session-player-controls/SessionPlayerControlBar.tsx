// import {dialog} from "@electron/remote"
import Box, { BoxProps } from "@mui/material/Box"
import Button, { ButtonProps } from "@mui/material/Button"
import { styled, useTheme } from "@mui/material/styles"
import {
  alpha,
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
} from "vrkit-shared-ui"
import clsx from "clsx"
import { useAppSelector } from "../../services/store/AppStoreHooks"
import React, { useCallback } from "react"
import { FlexAutoBox, FlexRowBox, FlexRowCenterBox, FlexScaleZeroBox } from "vrkit-shared-ui"
import { match, P } from "ts-pattern"
import { getLogger } from "@3fv/logger-proxy"
import { SessionManagerClient } from "../../services/session-manager-client"
import { useService } from "../service-container"
import { DurationView, MILLIS_IN_HR } from "../time"
import type {
  ActiveSessionType,
  SessionDetail
} from "vrkit-shared"

import { createClassNames } from "vrkit-shared-ui"
import { sharedAppSelectors } from "../../services/store/slices/shared-app"
import { ISessionTimeAndDuration } from "vrkit-plugin-sdk"

const log = getLogger(__filename)

const classNamePrefix = "sessionPlayerControlBar"

const classNames = createClassNames(
  classNamePrefix,
  "root",
  "inactive",
  "active"
)

export interface SessionPlayerControlBarProps extends BoxProps {}

const SPCRoot = styled(Box, { name: "SessionPlayerControlBar" })(
  ({ theme }) => ({
    [hasCls(classNames.root)]: {
      backgroundColor: theme.palette.background.session,
      // backgroundImage: theme.palette.background.sessionImage,
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
  const winfo = detail?.info?.weekendInfo
  if (!winfo) {
    return <></>
  }
  
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
          sharedAppSelectors.isLiveSessionAvailable
    ),
    isActive = activeSessionType === "LIVE",
    sessionManagerClient = useService(SessionManagerClient),
    text = match([isAvailable, isActive])
      .with([false, P.any], () => "Not Running")
      .with([true, false], () => "Connect")
      .with([true, true], () => "Disconnect")
      .otherwise(() => "unknown"),
    onClick = useCallback(() => {
      sessionManagerClient.setLiveSessionActive(
        isActive || !isAvailable ? false : true
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
  const diskSession = useAppSelector(sharedAppSelectors.selectDiskSession),
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
  timeAndDuration: ISessionTimeAndDuration

  type: ActiveSessionType

  session: SessionDetail

  showHours?: boolean
}

function SessionTimingView({
  type,
  session,
  timeAndDuration,
  showHours = true// timeAndDuration.currentTimeMillis >= MILLIS_IN_HR
}: SessionTimingViewProps) {
  //sampleIndex
  const { sampleCount, isLive } = timeAndDuration

  return (
    <FlexScaleZeroBox>
      {/*<DurationView*/}
      {/*    //timeAndDuration.currentTimeMillis*/}
      {/*  millis={0}*/}
      {/*  showHours={showHours}*/}
      {/*/>*/}
      {/*{!isLive && timeAndDuration.totalTimeMillis > 0 && (*/}
      {/*  <>*/}
      {/*    &nbsp;of&nbsp;*/}
      {/*    <DurationView*/}
      {/*      millis={timeAndDuration.totalTimeMillis}*/}
      {/*      showHours={showHours}*/}
      {/*    />*/}
      {/*  </>*/}
      {/*)}*/}
    </FlexScaleZeroBox>
  )
}

export function SessionPlayerControlBar({className,...other}: SessionPlayerControlBarProps) {
  const theme = useTheme(),
    hasAvailableSession = useAppSelector(
        sharedAppSelectors.hasAvailableSession
    ),
    isLiveSessionAvailable = useAppSelector(
        sharedAppSelectors.isLiveSessionAvailable
    ),
    liveSession = useAppSelector(sharedAppSelectors.selectLiveSession),
    diskSession = useAppSelector(sharedAppSelectors.selectDiskSession),
    activeSession = useAppSelector(sharedAppSelectors.selectActiveSession),
    activeSessionType = useAppSelector(
        sharedAppSelectors.selectActiveSessionType
    ),
      activeSessionTimeAndDuration = useAppSelector(
        sharedAppSelectors.selectActiveSessionTimeAndDuration
    )

  return (
    <SPCRoot
      className={clsx(classNames.root, {
        [classNames.active]: hasAvailableSession,
        [classNames.inactive]: !hasAvailableSession
      }, className)}
      {...other}
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
              <>Active Session ({activeSessionType})</>
              {/*<SessionTimingView*/}
              {/*  type={activeSessionType}*/}
              {/*  session={activeSession}*/}
              {/*  timeAndDuration={activeSessionTimeAndDuration}*/}
              {/*/>*/}
            </>
          ) : (
            <>No Active Session</>
          )}
        </FlexScaleZeroBox>
        
        
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
