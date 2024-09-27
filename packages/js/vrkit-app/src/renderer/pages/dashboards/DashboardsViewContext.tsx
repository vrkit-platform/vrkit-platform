import React from "react"

export interface DashboardsViewContext {
  selectedConfigId: string
  setSelectedConfigId(id: string):void
}

const context = React.createContext<DashboardsViewContext>(null)

export const {Provider: DashboardsViewContextProvider, Consumer: DashboardsViewContextConsumer} = context

export default context