import { type BoxProps } from "@mui/material/Box"
import { ISessionTimeAndDuration } from "@vrkit-platform/plugin-sdk"
import type { ActiveSessionType, SessionDetail } from "@vrkit-platform/shared"
import { FlexScaleZeroBox } from "@vrkit-platform/shared-ui"

interface SessionTimingViewProps extends BoxProps {
  timeAndDuration: ISessionTimeAndDuration
  
  type: ActiveSessionType
  
  session: SessionDetail
  
  showHours?: boolean
}

export function SessionTimingView({
  type,
  session,
  timeAndDuration,
  showHours = true // timeAndDuration.currentTimeMillis >= MILLIS_IN_HR
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
