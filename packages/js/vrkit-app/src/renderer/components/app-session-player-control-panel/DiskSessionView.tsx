// import {dialog} from "@electron/remote"
import {
  child,
  ClassNamesKey,
  createClassNames,
  Ellipsis,
  FillWidth,
  flexAlign,
  FlexAuto,
  FlexColumn,
  FlexRowCenter,
  FlexScaleZeroBox,
  hasCls,
  padding
} from "@vrkit-platform/shared-ui"
import React from "react"
import { getLogger } from "@3fv/logger-proxy"
import { styled, useTheme } from "@mui/material/styles"
import Box from "@mui/material/Box"

import { DiskSessionButton } from "./DiskSessionButton"
import { useAppSelector } from "../../services/store"
import { sharedAppSelectors } from "../../services/store/slices/shared-app"
import { SessionTimingView } from "./SessionTimingView"

const log = getLogger(__filename)

const classNamePrefix = "diskSessionView"

const classes = createClassNames(classNamePrefix, "root", "controls", "details")

export const DiskSessionViewClasses = classes
export type DiskSessionViewClasses = ClassNamesKey<typeof classes>

const DiskSessionViewRoot = styled(Box, { name: "DiskSessionViewRoot" })(
  ({ theme: { palette, zIndex, transitions, spacing, shape, dimen, typography } }) => ({
    [hasCls(classes.root)]: {
      ...FlexColumn,
      ...FillWidth,
      ...FlexAuto,
      ...flexAlign("flex-start", "stretch"),
      [child(classes.controls)]: {
        ...FlexRowCenter,
        ...FillWidth,
        ...FlexAuto,
        ...padding(spacing(0.5), spacing(2)),
        gap: spacing(1)
      }
    }
  })
)

export interface DiskSessionViewProps {}

export function DiskSessionView({ ...other }: DiskSessionViewProps) {
  const theme = useTheme(),
      activeSession = useAppSelector(sharedAppSelectors.selectActiveSession),
      activeSessionType = useAppSelector(sharedAppSelectors.selectActiveSessionType)

  return (
    <DiskSessionViewRoot className={classes.root}>
      <Choose>
        <When condition={activeSessionType === "NONE"}>
          <Box className={classes.controls}>
            <DiskSessionButton />
          </Box>
        </When>
        <When condition={activeSessionType === "DISK"}>
          <Box className={classes.controls}>
            <FlexScaleZeroBox sx={{...Ellipsis}}>{activeSession.id}</FlexScaleZeroBox> <DiskSessionButton />
          </Box>
          <Box className={classes.details}>
            {/*<SessionTimingView*/}
            {/*  type={activeSessionType}*/}
            {/*  session={activeSession}*/}
            {/*/>*/}
          </Box>
        </When>
        <Otherwise>
          <></>
        </Otherwise>
      </Choose>
      
    </DiskSessionViewRoot>
  )
}
