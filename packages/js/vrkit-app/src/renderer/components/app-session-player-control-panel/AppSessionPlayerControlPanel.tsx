// import {dialog} from "@electron/remote"
// import "swc-plugin-jsx-control-statements"
import Box, { BoxProps } from "@mui/material/Box"
import Button from "@mui/material/Button"
import { darken, styled, useTheme } from "@mui/material/styles"
import {
  child,
  createClassNames, CursorPointer,
  Ellipsis,
  EllipsisBox,
  flexAlign,
  FlexAuto,
  FlexColumn,
  FlexProperties,
  FlexRow,
  FlexRowBox,
  FlexScaleZero,
  FlexScaleZeroBox,
  hasCls,
  heightConstraint,
  HeightProperties,
  notHasCls,
  OverflowAuto,
  OverflowHidden,
  padding,
  PositionAbsolute,
  rem,
  widthConstraint,
  WidthProperties
} from "@vrkit-platform/shared-ui"
import clsx from "clsx"
import DownIcon from "@mui/icons-material/ArrowDownwardSharp"
import { useAppSelector } from "../../services/store/AppStoreHooks"
import React, { useState } from "react"
import { getLogger } from "@3fv/logger-proxy"
import type { ActiveSessionType, SessionDetail } from "@vrkit-platform/shared"
import { sharedAppSelectors } from "../../services/store/slices/shared-app"
import Typography from "@mui/material/Typography"
import { SessionActiveIndicator } from "./SessionActiveIndicator"
import { DiskSessionView } from "./DiskSessionView"
import { DiskSessionButton } from "./DiskSessionButton"
import LiveSessionButton from "./LiveSessionButton"

const log = getLogger(__filename)

const classNamePrefix = "appSessionPlayerControlPanel"

const classNames = createClassNames(classNamePrefix, "root", "inactive", "active", "expanded", "top", "content")

const SPCRoot = styled(Box, { name: "AppSessionPlayerControlPanelRoot" })(
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
      ...widthConstraint(`min(400px,80vw)`),
      [notHasCls(classNames.expanded)]: {
        [child(classNames.content)]: {
          ...OverflowHidden,
          maxHeight: 0
        }
      },
      [hasCls(classNames.expanded)]: {
        maxHeight: "max(50vh,400px)",
        [child(classNames.content)]: {
          ...OverflowAuto,
          maxHeight: `calc(max(50vh,400px) - ${dimen.appBarHeight})`
        }
      },
      [hasCls(classNames.active)]: {
        ...widthConstraint("min(70vw,500px)"),
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
            transform: "translateY(-2px)",
            opacity: 0.6
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

export interface AppSessionPlayerControlBarProps extends BoxProps {}

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
        component={Box}
        className={clsx(classNames.top)}
        sx={{
          ...CursorPointer
        }}
        onClick={e => {
          e.preventDefault()
          e.stopPropagation()
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
              sx={{ opacity: 0.65, ...Ellipsis, ...FlexScaleZero }}
              fontStyle="italic"
              textAlign="left"
            >
              No active game session
            </Typography>
          )}

          <Choose>
            <When condition={("NONE" === activeSessionType && isLiveSessionAvailable) || activeSessionType === "LIVE"}>
              <LiveSessionButton sx={{ ...FlexAuto }} />
            </When>
            <When condition={["NONE", "DISK"].includes(activeSessionType)}>
              <DiskSessionButton sx={{ ...FlexAuto }} />
            </When>
            <Otherwise>
              <></>
            </Otherwise>
          </Choose>
        </FlexScaleZeroBox>

        <DownIcon
          fontSize="small"
          sx={{
            transition: theme.transitions.create(["transform"]),
            transform: !expanded ? "rotate(180deg)" : "none"
          }}
        />
      </Button>
      <Box className={clsx(classNames.content)}>
        <Choose>
          <When condition={activeSessionType === "NONE"}>
            <Typography
                color="action.disabled"
                sx={{ opacity: 0.65, ...Ellipsis }}
                fontStyle="italic"
                textAlign="center"
            >
              Disconnected
            </Typography>
          </When>
          <When condition={activeSessionType === "DISK"}>
            <DiskSessionView />
          </When>
        </Choose>
      </Box>
    </SPCRoot>
  )
}

export const sessionPlayerControlBarClasses = classNames
