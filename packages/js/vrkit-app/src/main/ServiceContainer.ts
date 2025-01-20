import { Deferred } from "@3fv/deferred"
import { Container } from '@3fv/ditsy';
import { assert, ClassConstructor, isDefined, isFunction, isPromise, isString } from "@3fv/guard"
import {Option} from "@3fv/prelude-ts"

let serviceContainer: Container = null
let serviceContainerShutdown: Deferred<void> = null

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

export async function shutdownServiceContainer(container: Container = serviceContainer) {
  
  if (!container) {
    console.warn(`No service container to shutdown`)
    return
  }
  
  let deferred: Deferred<void> = null
  if (Object.is(serviceContainer, container)) {
    if (serviceContainerShutdown) {
      await serviceContainerShutdown.promise
      return
    }
    deferred = serviceContainerShutdown = new Deferred()
    setServiceContainer(null)
  }
  
  try {
    const keys = [...container.allKeys],
      keyNames = keys.map(key => (
        isFunction(key) && isString(key.name)
      ) ? key.name : isString(key) ? key : "N/A")
    
    const services = keys
      .map((key, idx) => Option.try(() => container.get(key))
        .map(service => [key, service, keyNames[idx]])
        .getOrNull())
      .filter(isDefined)
    
    await Promise.all(services.map(async ([key, service, keyName]) => {
      try {
        const disposeFn:Function = service[Symbol.dispose] ?? service["unload"]
        if (disposeFn) {
          console.info(`Invoking dispose (key=${keyName})`)
          const res = disposeFn.call(service)
          if (isPromise(res)) {
            await res
          }
        }
      } catch (err) {
        console.error(`${key} >> Shutdown Error`, err)
      }
    }))
    if (deferred && !deferred.isSettled()) {
      deferred.resolve()
    }
  } catch (err) {
    console.error(`Failed to cleanly shutdown service container`,err)
    if (deferred && !deferred.isSettled()) {
      deferred.reject(err)
    }
    
  } finally {
    if (Object.is(deferred, serviceContainerShutdown)) {
      serviceContainerShutdown = null
    }
  }
  
}