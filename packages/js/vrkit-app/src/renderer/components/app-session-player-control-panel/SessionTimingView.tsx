import { type BoxProps } from "@mui/material/Box"
// import type { ISessionTimeAndDuration } from "@vrkit-platform/plugin-sdk"
import { ActiveSessionType, MILLIS_IN_HR, SessionDetail } from "@vrkit-platform/shared"
import { DurationView, FlexScaleZeroBox } from "@vrkit-platform/shared-ui"
import { useSessionTiming } from "../../hooks"
import { getLogger } from "@3fv/logger-proxy"
import { asOption } from "@3fv/prelude-ts"

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
  const sessionTiming = useSessionTiming()

  const duration = asOption(sessionTiming?.sampleIndex)
      .map(idx => (1000 / 60) * idx)
      .getOrElse(0),
    finalDuration = asOption(sessionTiming?.sampleCount)
      .map(idx => (1000 / 60) * idx)
      .getOrElse(0)

  const showHours = showHoursArg === "AUTO" ? duration >= MILLIS_IN_HR : showHoursArg

  //sampleIndex
  const isLive = sessionTiming?.isLive

  return (
    <FlexScaleZeroBox>
      <If condition={!!sessionTiming}>
        <>
          <DurationView
            //timeAndDuration.currentTimeMillis
            millis={duration}
            showHours={showHours}
          />
          {!isLive && finalDuration > 0 && (
            <>
              &nbsp;of&nbsp;
              <DurationView
                millis={finalDuration}
                showHours={showHours}
              />
            </>
          )}
        </>
      </If>
    </FlexScaleZeroBox>
  )
}
