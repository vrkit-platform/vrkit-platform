import { Container } from '@3fv/ditsy';
import { assert, ClassConstructor } from "@3fv/guard"


let serviceContainer: Container = null

/**
 * Get the current service container
 * @returns
 */
export function getServiceContainer() {
  assert(!!serviceContainer,`Service container is not yet set`)
  return serviceContainer
}

export function getService<T>(id: string | ClassConstructor<T>): T {
  return serviceContainer?.get<T>(id)
}


/**
 * Set the service container
 *
 * @param container
 * @returns
 */
export function setServiceContainer(container: Container) {
  serviceContainer = container
  
  if (import.meta.webpackHot)
    import.meta.webpackHot.addDisposeHandler(() => {
      serviceContainer = null
    })
  return serviceContainer
}

