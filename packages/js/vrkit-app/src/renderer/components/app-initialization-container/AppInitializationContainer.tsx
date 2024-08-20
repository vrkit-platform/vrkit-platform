import React from "react"
import { Future } from "@3fv/prelude-ts"
import { Container } from "@3fv/ditsy"
import { resolveContainer } from "../../containerFactory"
import { getLogger } from "@3fv/logger-proxy"
import CircularProgress from "@mui/material/CircularProgress"
import { ServiceContainerContext } from "../service-container"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

export interface AppInitializationContainerProps {
  children: React.ReactChildren | React.ReactNode | React.ReactNode[]
}
export interface AppInitializationContainerState {
  containerPromise: Promise<Container>
  container?: Container
}

export class AppInitializationContainer extends React.Component<
  AppInitializationContainerProps,
  AppInitializationContainerState
> {
  // static contextType = AppBridgeContext

  // context: React.ContextType<typeof AppBridgeContext>

  constructor(props) {
    super(props)

    this.state = {
      containerPromise: Future.of(resolveContainer().promise)
        .onSuccess(container => this.setState({ container }))
        .toPromise()
    }
  }

  render() {
    const { props, state } = this
    const { children } = props
    const { container } = state

    return !container ? (
      <CircularProgress />
    ) : (
      <ServiceContainerContext.Provider value={container}>
        {children as any}
      </ServiceContainerContext.Provider>
    )
  }
}
