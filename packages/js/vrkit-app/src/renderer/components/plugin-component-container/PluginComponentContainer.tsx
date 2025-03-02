// REACT
import React from "react"

// CLSX

// 3FV
import { getLogger } from "@3fv/logger-proxy"

// MUI

// APP
import { ClassNamesKey, createClassNames } from "@vrkit-platform/shared-ui"
import { IPluginComponentProps, PluginClientEventType, type SessionInfoMessage } from "@vrkit-platform/plugin-sdk"
import { Bind } from "@vrkit-platform/shared"
import { Theme } from "../../theme"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const classPrefix = "pluginComponentContainer"
export const pluginComponentContainerClasses = createClassNames(classPrefix, "root", "child1")
export type PluginComponentContainerClassKey = ClassNamesKey<typeof pluginComponentContainerClasses>

/**
 * PluginComponentContainer Component Properties
 */
export interface PluginComponentContainerProps extends IPluginComponentProps {
  Component: React.ComponentType<IPluginComponentProps>
  // theme: Theme
}

export interface PluginComponentContainerState {
  sessionId?: string
}

/**
 * PluginComponentContainer Component
 *
 * @param { PluginComponentContainerProps } props
 * @returns {JSX.Element}
 */
export class PluginComponentContainer extends React.Component<
  PluginComponentContainerProps,
  PluginComponentContainerState
> {
  @Bind
  private onSessionIdChanged(sessionId: string, info: SessionInfoMessage) {
    log.info(`onSessionIdChanged(${sessionId})`)
    this.setState(prevState => ({
      ...prevState,
      sessionId
    }))
  }

  constructor(props: PluginComponentContainerProps) {
    super(props)

    this.state = {
      sessionId: null
    }
  }

  get client() {
    return this.props.client
  }

  componentDidMount(): void {
    this.client?.on(PluginClientEventType.SESSION_ID_CHANGED, this.onSessionIdChanged)
  }

  componentWillUnmount(): void {
    this.client?.off(PluginClientEventType.SESSION_ID_CHANGED)
  }

  render() {
    const { Component, ...other } = this.props,
      { sessionId } = this.state
    
    if (log.isDebugEnabled())
      log.debug(`Rendering with session id`, sessionId)
    
    return !Component ? null : (
      <Component
        sessionId={sessionId}
        {...other}
      />
    )
  }
}

export default PluginComponentContainer
