// import {dialog} from "@electron/remote"
import Box from "@mui/material/Box"
import Button, { ButtonProps } from "@mui/material/Button"
import { styled, useTheme } from "@mui/material/styles"
import { Grid2Props } from "@mui/material/Unstable_Grid2"
import {
  alpha,
  createClassNames,
  FillWidth,
  flex,
  FlexColumnCenter,
  FlexRow,
  FlexRowCenter,
  hasCls,
  heightConstraint,
  paddingRem,
  rem
} from "../../styles"
import clsx from "clsx"
import { useAppSelector } from "../../services/store"
import {
  LiveSessionId,
  SessionDetail,
  sessionManagerSelectors
} from "vrkit-app-renderer/services/store/slices/session-manager"
import React from "react"
import { FlexRowBox, FlexRowCenterBox, FlexScaleZeroBox } from "../box"
import { match, P } from "ts-pattern"
import { getLogger } from "@3fv/logger-proxy"
import { useShowOpenDialog } from "vrkit-app-renderer/hooks/useShowOpenDialog"
import { isEmpty } from "vrkit-app-common/utils"
import SessionManager from "vrkit-app-renderer/services/session-manager"
import { useService } from "../service-container"

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

export interface LiveSessionButtonProps extends ButtonProps {}

export function LiveSessionButton({ sx, ...other }: LiveSessionButtonProps) {
  const
    activeSession = useAppSelector(sessionManagerSelectors.selectActiveSession),
    isAvailable = useAppSelector(
      sessionManagerSelectors.isLiveSessionAvailable
    ),
    isActive = activeSession?.id === LiveSessionId,
    text = match([isAvailable, isActive])
      .with([false, P.any], () => "Not Running")
      .with([true, false], () => "Connect")
      .with([true, true], () => "Disconnect")
      .otherwise(() => "unknown")

  return (
    <Button
      disabled={!isAvailable}
      sx={{
        ...FlexRowCenter,
        ...sx
      }}
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

export interface DiskSessionButtonProps extends ButtonProps {}

export function DiskSessionButton({ sx, ...other }: DiskSessionButtonProps) {
  const
      diskSession = useAppSelector(sessionManagerSelectors.selectDiskSession),
      isAvailable = diskSession?.isAvailable === true,
      sessionManager = useService(SessionManager),
      onClick = useShowOpenDialog(res => {
        const {filePaths} = res
        if (res.canceled || isEmpty(filePaths)) {
          log.info(`Open file was cancelled or no file paths`, filePaths, res.canceled)
          return
        }
        
        const [filePath] = filePaths
        sessionManager.createDiskPlayer(filePath)
        
      })
  
  return (
      <Button
          sx={{
            ...FlexRowCenter,
            ...sx
          }}
          variant={"outlined"}
          color={"secondary"}
          onClick={onClick}
          {...other}
      >
        <Box
            sx={{
              ...FlexColumnCenter
            }}
        >
          Open Session File
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
      activeSession = useAppSelector(sessionManagerSelectors.selectActiveSession)

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
        <FlexScaleZeroBox></FlexScaleZeroBox>
        <DiskSessionBox>
          <DiskSessionButton />
          {diskSession?.isAvailable && <SessionDetailBox detail={diskSession} />}
        </DiskSessionBox>
        <LiveSessionBox>
          <LiveSessionButton />
          {isLiveSessionAvailable && <SessionDetailBox detail={liveSession} />}
        </LiveSessionBox>
      </FlexRowBox>
    </SPCRoot>
  )
}

export const sessionPlayerControlBarClasses = classNames
