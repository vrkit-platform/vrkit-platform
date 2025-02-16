import { type BoxProps } from "@mui/material/Box"
// import type { ISessionTimeAndDuration } from "@vrkit-platform/plugin-sdk"
import { ActiveSessionType, MILLIS_IN_HR, SessionDetail } from "@vrkit-platform/shared"
import {
  DurationView,
  EllipsisBox,
  flexAlign,
  FlexColumnBox,
  FlexRowBox,
  FlexRowCenterBox, FlexScaleZero,
  FlexScaleZeroBox
} from "@vrkit-platform/shared-ui"
import { useVRKitSessionTiming } from "../../hooks"
import { getLogger } from "@3fv/logger-proxy"
import { asOption } from "@3fv/prelude-ts"
import { isString } from "@3fv/guard"
import { SessionSubType } from "@vrkit-platform/models"
import { match } from "ts-pattern"

const log = getLogger(__filename)

interface SessionTimingViewProps extends BoxProps {
  type: ActiveSessionType

  session: SessionDetail

  showHours?: boolean | "AUTO"
}

export function SessionTimingView({
  type,
  session,
  showHours: showHoursArg = "AUTO", // timeAndDuration.currentTimeMillis
  // >= MILLIS_IN_HR
  ...others
}: SessionTimingViewProps) {
  const sessionTiming = useVRKitSessionTiming()

  // const duration = asOption(sessionTiming?.sampleIndex)
  //     .map(idx => (1000 / 60) * idx)
  //     .getOrElse(0),
  //   finalDuration = asOption(sessionTiming?.sampleCount)
  //     .map(idx => (1000 / 60) * idx)
  //     .getOrElse(0)
  
  const duration = sessionTiming?.sessionSubTime,
      totalDuration = sessionTiming?.sessionSubTimeTotal
  
  const showHours = showHoursArg === "AUTO" ? duration >= MILLIS_IN_HR : showHoursArg

  //sampleIndex
  const isLive = sessionTiming?.isLive

  return (
    <FlexScaleZeroBox>
      <If condition={!!sessionTiming && sessionTiming.isValid}>
        <FlexColumnBox>
          <FlexRowBox sx={{...flexAlign("center", "stretch")}}>
            <EllipsisBox sx={{...FlexScaleZero}}>
              {match(sessionTiming.sessionSubType)
                  .when(isString, type => type.replace("SESSION_SUB_TYPE_",""))
                  .otherwise(type => SessionSubType[type] ?? SessionSubType[type?.toString?.()])
              }
            </EllipsisBox>
            <DurationView
              millis={duration}
              showHours={showHours}
            />
            {!isLive && totalDuration > 0 && (
              <>
                &nbsp;of&nbsp;
                <DurationView
                  millis={totalDuration}
                  showHours={showHours}
                />
              </>
            )}
          </FlexRowBox>
        </FlexColumnBox>
      </If>
    </FlexScaleZeroBox>
  )
}
