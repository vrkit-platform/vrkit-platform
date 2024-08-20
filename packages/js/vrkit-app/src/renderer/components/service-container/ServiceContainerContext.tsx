import {
  Container,
  InjectableId,
  ClassConstructor,
  AbstractConstructor
} from "@3fv/ditsy"
import * as React from "react"
import { useContext, HTMLAttributes } from "react"
import { asOption } from "@3fv/prelude-ts"

export const ServiceContainerContext = React.createContext<Container>(null)

/**
 * Use the service container
 */
export function useServiceContainer(): Container {
  return useContext(ServiceContainerContext)
}

/**
 * Use one or more services
 *
 * @param constructorOrId
 */
export function useService<T>(constructorOrId: InjectableId<T>): T
export function useService<Args extends InjectableId<any>[]>(
  ...constructorOrIds: Args
): [...(Args extends [...infer AT] ? AT : never)]
export function useService(...constructorOrIds: any[]) {
  const container = useContext(ServiceContainerContext),
    useFirst = constructorOrIds.length === 1

  return constructorOrIds.length === 0
    ? container
    : asOption(constructorOrIds.map(idOrCtor => container.get(idOrCtor)))
        .map(services => (useFirst ? services[0] : services))
        .getOrThrow()
}

export interface ContainerProps {
  container: Container
  children?: HTMLAttributes<Element>["children"]
}

export type PropsOfContainer<C> = C extends React.ComponentType<infer P>
  ? P extends ContainerProps
    ? P
    : never
  : never

export type PropsOfContainerOut<C> = PropsOfContainer<C> extends never
  ? never
  : Omit<PropsOfContainer<C>, "container">

export function withServiceContainer<
  InProps extends ContainerProps,
  C extends React.ComponentType<InProps>
>(Component: C): React.ComponentType<PropsOfContainerOut<C>> {
  return props => {
    const { ...other } = props,
      container = useServiceContainer()

    return <Component container={container} {...(other as any)} />
  }
}

export type UseServiceContainerResult<C> = () => C extends ClassConstructor<
  infer T
>
  ? T
  : C extends AbstractConstructor<infer T>
  ? T
  : C

export function createUseService<
  C extends ClassConstructor<any> | AbstractConstructor<any> | any
>(injectableId: InjectableId<C>): UseServiceContainerResult<C>
export function createUseService<C>(
  factory: ClassConstructor<C>
): UseServiceContainerResult<C>
export function createUseService(factoryOrId) {
  return () => useService(factoryOrId)
}
