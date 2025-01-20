import Box, { type BoxProps } from "@mui/material/Box"
import { styled } from "@mui/material/styles"
import clsx from "clsx"
import { createClassNames, FlexColumn, FlexScaleZero, hasCls, OverflowAuto } from "@vrkit-platform/shared-ui"

const pageContentClassPrefix = "PageContent"
const pageContentClasses = createClassNames(pageContentClassPrefix, "root", "top", "bottom", "left", "center", "right")

const PageContentRoot = styled(Box)(({ theme }) => ({
  [hasCls(pageContentClasses.root)]: {
    ...FlexColumn,
    ...FlexScaleZero,
    ...OverflowAuto
  }
}))

export interface PageContentProps extends BoxProps {}

export function PageContent({ className, ...other }: PageContentProps) {
  return (
    <PageContentRoot
      className={clsx(pageContentClasses.root, className)}
      {...other}
    />
  )
}

export default PageContent
