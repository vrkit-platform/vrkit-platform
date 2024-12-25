import type { BoxProps } from "@mui/material/Box"
import Box from "@mui/material/Box"
import { styled, useTheme } from "@mui/material/styles"
import clsx from "clsx"
import {
  createClassNames,
  FillHeight,
  flexAlign,
  FlexColumn,
  FlexScaleZero, hasCls,
  OverflowAuto,
  OverflowHidden
} from "@vrkit-platform/shared-ui"

const appContentClassPrefix = "AppContent"
const appContentClasses = createClassNames(appContentClassPrefix, "root", "top", "bottom", "left", "center", "right")

const AppContentRoot = styled(Box)(({ theme }) => (
    {
      [hasCls(appContentClasses.root)]: {
        ...FlexColumn,
        ...FlexScaleZero,
        ...OverflowAuto,
      }
    }))

export interface AppContentProps extends BoxProps {}

export function AppContent({ className, ...other }: AppContentProps) {
  
  return (
    <AppContentRoot
      className={clsx(appContentClasses.root, className)}
      {...other}
    />
  )
}

export default AppContent