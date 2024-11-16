import React, { JSXElementConstructor } from "react"

export type ReactChild = string | number | boolean | React.ReactElement<any, string | JSXElementConstructor<any>> | React.ReactNodeArray | React.ReactPortal
export type ReactChildren = ReactChild | ReactChild[]

export type ReactInstanceOrType<P extends {} = {}> = React.ComponentType<P> | React.ReactNode | React.ReactInstance
