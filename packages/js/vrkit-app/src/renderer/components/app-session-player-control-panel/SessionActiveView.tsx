import type { } from "@vrkit-platform/shared"
// import {dialog} from "@electron/remote"
import { styled } from "@mui/material/styles"
import React from "react"
import { getLogger } from "@3fv/logger-proxy"
import Box, { BoxProps } from "@mui/material/Box"
import { useAppSelector } from "../../services/store"
import { sharedAppSelectors } from "../../services/store/slices/shared-app"
import {
  createClassNames, FlexAutoBox,
  FlexRowBox,
  hasCls
} from "@vrkit-platform/shared-ui"
import clsx from "clsx"
import { SessionType } from "@vrkit-platform/models"

const log = getLogger(__filename)
const classPrefix = "SessionActiveView"
const classes = createClassNames(classPrefix,"root", "timing", "info", "diskControls")
export const sessionActiveViewClasses = classes

const SessionActiveViewRoot = styled(
    Box, 
    { name: "SessionActiveView" })(({ theme }) => ({
  [hasCls(classes.root)]: {
  
  }
}))

export interface SessionActiveViewProps extends BoxProps {

}


export function SessionActiveViewBox({ className, ...other }: SessionActiveViewProps) {
  const
      activeSession = useAppSelector(sharedAppSelectors.selectActiveSession),
      detail = activeSession?.info,
      winfo = detail?.weekendInfo
  if (!winfo) {
    return <></>
  }

  return (
    <SessionActiveViewRoot
      className={clsx(classes.root, className)}
    >
      <Box className={clsx(classes.timing)}>
      
      </Box>
      <Box className={clsx(classes.info)}>
        <FlexRowBox>
          <FlexAutoBox>Track</FlexAutoBox>
          <FlexAutoBox>{winfo.trackDisplayName}</FlexAutoBox>
        </FlexRowBox>
        <FlexRowBox>
          <FlexAutoBox>Length</FlexAutoBox>
          <FlexAutoBox>{winfo.trackLength}</FlexAutoBox>
        </FlexRowBox>
      </Box>
      <If condition={[SessionType.DISK,"DISK"].includes(activeSession.type)}>
        <Box className={clsx(classes.diskControls)}>
        
        </Box>
      </If>
    </SessionActiveViewRoot>
  )
}

export default SessionActiveViewBox