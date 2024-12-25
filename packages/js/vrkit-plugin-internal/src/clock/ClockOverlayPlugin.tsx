import "@vrkit-platform/plugin-sdk"
import type { BoxProps } from "@mui/material/Box"

import { getLogger } from "@3fv/logger-proxy"

import { IPluginComponentProps } from "@vrkit-platform/plugin-sdk"
import React, { useEffect, useState } from "react"
import { useInterval } from "usehooks-ts"


import { padStart } from "lodash"
import clsx from "clsx"
import { styled } from "@mui/material/styles"
import {
  alpha, createClassNames,
  FillWidth,
  FlexAuto,
  FlexRow,
  FlexRowCenter,
  FlexRowCenterBox,
  hasCls,
  rem
} from "@vrkit-platform/shared-ui"
import { getLocalTimeParts, TimeParts } from "@vrkit-platform/shared"

const log = getLogger(__filename)

const classNamePrefix = "clockOverlayPlugin"

const classNames = createClassNames(classNamePrefix, "root")

const ClockTimeViewRoot = styled(FlexRowCenterBox, { name: "ClockTimeView" })(({ theme }) => {
  return {
    [hasCls(classNames.root)]: {
      borderRadius: rem(1),
      backgroundColor: alpha(theme.palette.grey.A700, 0.9),
      color: theme.palette.getContrastText(theme.palette.grey.A700),
      ...FillWidth,
      ...FlexRowCenter,
      "& > time": {
        ...FlexAuto
      }
    }
  }
})


interface ClockTimeViewProps extends BoxProps {
  showMillis?: boolean
}

function ClockTimeView({ showMillis = false, className, ...other }: ClockTimeViewProps) {
  const [timeParts, setTimeParts] = useState<TimeParts>(getLocalTimeParts()),
    updateLocalTimeParts = () => {
      setTimeParts(getLocalTimeParts())
    },
    { hrs, mins, secs, ms } = timeParts

  useInterval(updateLocalTimeParts, showMillis ? 10 : 1000)

  return (
    <ClockTimeViewRoot className={clsx(classNames.root,className)}>
      <time>
        {padStart(hrs.toString(), 2, "0")}:{padStart(mins.toString(), 2, "0")}:{padStart(secs.toString(), 2, "0")}
        {showMillis && <>.{padStart(ms.toString(), 3, "0")}</>}
      </time>
    </ClockTimeViewRoot>
  )
}

function ClockOverlayPlugin(props: IPluginComponentProps) {
  const { client, width, height } = props

  return (
    <ClockTimeView showMillis={false}/>
  )
}

export default ClockOverlayPlugin as React.ComponentType<IPluginComponentProps>
