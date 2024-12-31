// REACT
import React, { ErrorInfo } from "react"

// CLSX
import clsx from "clsx"

// 3FV
import { getLogger } from "@3fv/logger-proxy"

// MUI
import Box, {type BoxProps} from "@mui/material/Box"
import { styled } from "@mui/material/styles"

// APP
import {
  child,
  ClassNamesKey,
  createClassNames, Fill,
  FlexColumnCenter,
  FlexRowCenterBox,
  hasCls
} from "@vrkit-platform/shared-ui"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const classPrefix = "errorBoundary"
export const errorBoundaryClasses = createClassNames(classPrefix, "root")
const classes = errorBoundaryClasses

export type ErrorBoundaryClassKey = ClassNamesKey<typeof errorBoundaryClasses>


const ErrorBoundaryRoot = styled(Box, {
  name: "ErrorBoundaryRoot",
  label: "ErrorBoundaryRoot"
})(({theme: {dimen,palette, shape, customShadows, shadows, components, colors, transitions, typography, insetShadows, mixins, zIndex, spacing }}) => ({
  // root styles here
  [hasCls(errorBoundaryClasses.root)]: {
    ...FlexColumnCenter,
    ...Fill
  }
}))


/**
 * ErrorBoundary Component Properties
 */
export interface ErrorBoundaryProps extends BoxProps {

}

export interface ErrorBoundaryState {
  hasError: boolean
  err?: Error
}

/**
 * ErrorBoundary Component
 *
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props:ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, err: null };
  }
  
  static getDerivedStateFromError(err: Error) {
    return { hasError: true, err };
  }
  
  componentDidCatch(err: Error, errInfo: ErrorInfo) {
    // You can also log the error to an error reporting service
    log.error(`Caught error: ${err.message}`, errInfo);
  }
  
  render() {
    const {children, className, ...other} = this.props,
        {hasError, err} = this.state
    if (!hasError) {
      return children
    }
    
    return <ErrorBoundaryRoot
        className={clsx(classes.root, {},className)}
        {...other}
    >
      <FlexRowCenterBox>
        An error occurred:  {err?.message}
      </FlexRowCenterBox>
      <If condition={!!err.stack}>
        <FlexRowCenterBox>
          Stack<br/>
          {err.stack}
        </FlexRowCenterBox>
      </If>
      <If condition={!!err.cause}>
        <FlexRowCenterBox>
          Cause<br/>
          {err.cause?.toString?.()}
        </FlexRowCenterBox>
      </If>
    </ErrorBoundaryRoot>
  }
}

export default ErrorBoundary
