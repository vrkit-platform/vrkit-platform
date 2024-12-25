// import {dialog} from "@electron/remote"
import Box, { BoxProps } from "@mui/material/Box"
import Button, { ButtonProps } from "@mui/material/Button"
import { darken, styled, useTheme } from "@mui/material/styles"
import {
  alpha,
  child,
  createClassNames,
  EllipsisBox,
  flex,
  flexAlign,
  FlexAuto,
  FlexColumn,
  FlexColumnCenter,
  FlexProperties,
  FlexRow,
  FlexRowBox,
  FlexRowCenter,
  FlexRowCenterBox,
  FlexScaleZero,
  FlexScaleZeroBox,
  hasCls,
  heightConstraint,
  HeightProperties,
  notHasCls, OverflowAuto,
  OverflowHidden,
  padding,
  paddingRem,
  PositionAbsolute,
  PositionRelative,
  rem,
  widthConstraint,
  WidthProperties
} from "@vrkit-platform/shared-ui"
import clsx from "clsx"
import DownIcon from "@mui/icons-material/ArrowDownwardSharp"
import CircleIcon from "@mui/icons-material/CircleSharp"
import { useAppSelector } from "../../services/store/AppStoreHooks"
import React, { useCallback, useState } from "react"
import { match, P } from "ts-pattern"
import { getLogger } from "@3fv/logger-proxy"
import { SessionManagerClient } from "../../services/session-manager-client"
import { useService } from "../service-container"
import type { ActiveSessionType, SessionDetail } from "@vrkit-platform/shared"
import { sharedAppSelectors } from "../../services/store/slices/shared-app"
import { ISessionTimeAndDuration } from "@vrkit-platform/plugin-sdk"
import Typography from "@mui/material/Typography"

const log = getLogger(__filename)

const classNamePrefix = "sessionPlayerControlBar"

const classNames = createClassNames(classNamePrefix, "root", "inactive", "active", "expanded", "top", "content")

export interface AppSessionPlayerControlBarProps extends BoxProps {}

const SPCRoot = styled(Box, { name: "SessionPlayerControlBar" })(
  ({ theme: { palette, zIndex, transitions, spacing, shape, dimen, typography } }) => ({
    [hasCls(classNames.root)]: {
      ...PositionAbsolute,
      ...FlexColumn,
      ...OverflowHidden,
      right: 100,
      bottom: 0,
      zIndex: zIndex.modal - 1,
      transition: transitions.create(["border", ...HeightProperties, ...WidthProperties]),
      backgroundColor: palette.background.session,
      borderTopLeftRadius: `calc(${shape.borderRadius} * 2)`,
      borderTopRightRadius: `calc(${shape.borderRadius} * 2)`,
      minHeight: dimen.appBarHeight,
      maxHeight: dimen.appBarHeight,
      [notHasCls(classNames.expanded)]: {
        ...widthConstraint("max(30vw,100px)"),
        [child(classNames.content)]: {
          ...OverflowHidden,
          maxHeight: 0
        }
      },
      [hasCls(classNames.expanded)]: {
        maxHeight: "max(50vh,400px)",
        ...widthConstraint("max(30vw,200px)"),
        [child(classNames.content)]: {
          ...OverflowAuto,
          maxHeight: `calc(max(50vh,400px) - ${dimen.appBarHeight})`,
        }
      },
      [hasCls(classNames.active)]: {
        border: `1px solid ${palette.success.main}`,
        boxShadow: `0 0 4px ${palette.success.main}`,
        [child(classNames.top)]: {
          backgroundColor: palette.success.main,
          color: palette.success.contrastText,
          [child(".indicator")]: {
            color: palette.error.main,
            fill: palette.error.main
          }
        }
        // ...heightConstraint(rem(6)) // backgroundColor:
        // theme.palette.background.session,
      },
      [hasCls(classNames.inactive)]: {
        border: `1px solid ${palette.action.disabled}`,
        boxShadow: `0 0 4px ${palette.action.disabled}`,
        [child(classNames.top)]: {
          backgroundColor: darken(palette.action.disabledBackground, 0.4),
          color: palette.info.contrastText,
          [child(".indicator")]: {
            color: palette.action.disabled,
            fill: palette.action.disabled
          }
        }
        //...heightConstraint(rem(3))
      },
      [child(classNames.top)]: {
        ...FlexRow,
        ...heightConstraint(dimen.appBarHeight),
        ...flexAlign("center", "stretch"),
        borderRadius: 0,
        "&, & > div": {
          gap: spacing(1)
        }
      },
      [child(classNames.content)]: {
        transition: transitions.create(["border", ...HeightProperties, ...WidthProperties, ...FlexProperties]),
        ...FlexColumn,
        ...FlexAuto,
        ...flexAlign("stretch", "flex-start"),
        ...padding(spacing(1))
      }
    }
  })
)

interface SessionDetailBoxProps {
  detail: SessionDetail
}

const SessionDetailTable = styled("table", { name: "SessionDetailTable" })(({ theme }) => ({}))

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

const LiveSessionBox = styled(FlexRowCenterBox, { name: "LiveSessionBox" })(({ theme }) => ({
  backgroundColor: alpha(theme.palette.action.active, 0.6), // ...widthConstraint(rem(6)),
  ...flex(0, 0, "auto"),
  ...paddingRem(0, 1),
  gap: rem(1)
}))

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
      sessionManagerClient.setLiveSessionActive(isActive || !isAvailable ? false : true)
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

const DiskSessionBox = styled(FlexRowCenterBox, { name: "DiskSessionBox" })(({ theme }) => ({
  backgroundColor: alpha(theme.palette.secondary.main, 0.2), // ...widthConstraint(rem(6)),
  ...flex(0, 0, "auto"),
  ...paddingRem(0, 1),
  gap: rem(1)
}))

export interface DiskSessionButtonProps extends ButtonProps {
  activeSessionType: ActiveSessionType
}

export function DiskSessionButton({ sx, activeSessionType, ...other }: DiskSessionButtonProps) {
  const diskSession = useAppSelector(sharedAppSelectors.selectDiskSession),
    isActive = activeSessionType === "DISK",
    isAvailable = diskSession?.isAvailable === true,
    sessionManagerClient = useService(SessionManagerClient),
    onCloseClick = useCallback(() => {
      sessionManagerClient.closeDiskSession()
    }, [sessionManagerClient]),
    onOpenClick = useCallback(() => {
      sessionManagerClient.showOpenDiskSession().catch(err => log.error("Failed to create disk player", err))
    }, [sessionManagerClient])

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
  showHours = true // timeAndDuration.currentTimeMillis
  // >= MILLIS_IN_HR
}: SessionTimingViewProps) {
  //sampleIndex
  const { isLive } = timeAndDuration

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

function SessionActiveIndicatorCircle({
  sx = {},
  color,
  className,
  ...other
}: Omit<React.ComponentProps<typeof CircleIcon>, "color"> & { color: string }) {
  return (
    <CircleIcon
      className={clsx("indicator", className)}
      sx={{
        ...PositionAbsolute,
        display: "block",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        animationIterationCount: "infinite",
        fill: color,

        width: "100%",
        height: "100%", // "@keyframes progress": {
        //   "0%": {
        //     transform: "scale(1.0)"
        //   },
        //   "100%": {
        //     transform: "scale(1.3)"
        //   }
        // },
        ...sx
      }}
    />
  )
}

function SessionActiveIndicator({ color, active }: { color: string; active: boolean }) {
  return (
    <Box
      sx={{
        ...FlexAuto,
        ...PositionRelative,
        width: 12,
        height: 12
      }}
    >
      <SessionActiveIndicatorCircle color={color} />
      <SessionActiveIndicatorCircle
        color={darken(color, 0.05)}
        sx={{
          animation: active ? "progress 1s ease-in infinite" : "progress 2s ease-in infinite",
          zIndex: 1, // opacity: 0.5,
          "@keyframes progress": {
            "0%": {
              transform: "scale(0)",
              opacity: 0.3
            },
            "60%": {
              transform: "scale(1.3)",
              opacity: 0.8
            },
            "100%": {
              transform: "scale(1.5)",
              opacity: 0
            }
          },
          fontSize: rem(0.5) as string
        }}
      />
    </Box>
  )
}

function SessionActiveTop({ session, sessionType }: { session: SessionDetail; sessionType: ActiveSessionType }) {
  const theme = useTheme(),
    info = session.info,
    { driverInfo, weekendInfo } = info,
    drivers = driverInfo?.drivers,
    { trackDisplayName: trackName, trackCity, trackCountry, trackConfigName, trackLength } = weekendInfo
  return (
    <FlexScaleZeroBox sx={{ ...FlexColumn, ...flexAlign("stretch", "flex-start") }}>
      <FlexRowBox sx={{ gap: theme.spacing(2), ...flexAlign("flex-end", "stretch") }}>
        <EllipsisBox
          fontSize={rem(1)}
          sx={{ ...FlexScaleZero, textAlign: "left", opacity: 0.75 }}
        >
          {trackName}
        </EllipsisBox>
        <Typography
          sx={{
            ...FlexAuto,
            transform: "translateY(-2px)", opacity: 0.6
          }}
          fontStyle="italic"
          fontSize={rem(0.7)}
        >
          {trackConfigName}
        </Typography>
      </FlexRowBox>
      {/* ROW 2 */}
      <FlexRowBox
        sx={{
          gap: theme.spacing(2),
          ...flexAlign("flex-start", "stretch")
        }}
      >
        <EllipsisBox
          fontSize={rem(0.7)}
          sx={{ ...FlexScaleZero, textAlign: "left", opacity: 0.6 }}
        >
          {trackCity}, {trackCountry}
        </EllipsisBox>
        <Typography
          fontSize={rem(0.7)}
          fontStyle="italic"
          sx={{ ...FlexAuto, opacity: 0.6 }}
        >
          {trackLength}
        </Typography>
      </FlexRowBox>
    </FlexScaleZeroBox>
  )
}

export function AppSessionPlayerControlPanel({ className, ...other }: AppSessionPlayerControlBarProps) {
  const theme = useTheme(),
    [expanded, setExpanded] = useState(false),
    hasAvailableSession = useAppSelector(sharedAppSelectors.hasAvailableSession),
    isLiveSessionAvailable = useAppSelector(sharedAppSelectors.isLiveSessionAvailable),
    liveSession = useAppSelector(sharedAppSelectors.selectLiveSession),
    diskSession = useAppSelector(sharedAppSelectors.selectDiskSession),
    activeSession = useAppSelector(sharedAppSelectors.selectActiveSession),
    activeSessionType = useAppSelector(sharedAppSelectors.selectActiveSessionType),
    activeSessionTimeAndDuration = useAppSelector(sharedAppSelectors.selectActiveSessionTimeAndDuration)

  return (
    <SPCRoot
      className={clsx(
        classNames.root,
        {
          [classNames.expanded]: expanded,
          [classNames.active]: hasAvailableSession,
          [classNames.inactive]: !hasAvailableSession
        },
        className
      )}
      {...other}
    >
      <Button
        className={clsx(classNames.top)}
        onClick={e => {
          e.preventDefault()
          setExpanded(!expanded)
        }}
      >
        <FlexScaleZeroBox sx={{ ...FlexRow, ...flexAlign("center", "stretch") }}>
          <SessionActiveIndicator
            color={activeSession ? darken(theme.palette.info.main, 0.3) : theme.palette.action.disabled}
            active={!!activeSession}
          />

          {/*<SessionTimingView*/}
          {/*  type={activeSessionType}*/}
          {/*  session={activeSession}*/}
          {/*  timeAndDuration={activeSessionTimeAndDuration}*/}
          {/*/>*/}

          {activeSession ? (
            <SessionActiveTop
              session={activeSession}
              sessionType={activeSessionType}
            />
          ) : (
            <Typography
              color="action.disabled"
              sx={{ opacity: 0.65 }}
              fontStyle="italic"
            >
              No active game session
            </Typography>
          )}
        </FlexScaleZeroBox>

        <DownIcon
          fontSize="small"
          sx={{
            transition: theme.transitions.create(["transform"]),
            transform: !expanded ? "rotate(180deg)" : "none"
          }}
        />

        {/*<DiskSessionBox>*/}
        {/*  <DiskSessionButton activeSessionType={activeSessionType} />*/}
        {/*  {diskSession?.isAvailable && (*/}
        {/*    <SessionDetailBox detail={diskSession} />*/}
        {/*  )}*/}
        {/*</DiskSessionBox>*/}
        {/*<LiveSessionBox>*/}
        {/*  <LiveSessionButton activeSessionType={activeSessionType} />*/}
        {/*  {isLiveSessionAvailable && <SessionDetailBox detail={liveSession} />}*/}
        {/*</LiveSessionBox>*/}
      </Button>
      <Box className={clsx(classNames.content)}>content<br/></Box>
    </SPCRoot>
  )
}

export const sessionPlayerControlBarClasses = classNames
