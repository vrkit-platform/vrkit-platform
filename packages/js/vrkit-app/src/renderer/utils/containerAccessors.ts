import { Deferred } from "@3fv/deferred"
import { Container, InjectableId } from "@3fv/ditsy"

export type DeferredContainer = Deferred<Container>

let resolver: DeferredContainer = null

export function setContainerResolver(newResolver: Deferred<Container>) {
  resolver = newResolver
  
}

/**
 * Resolver not set
 */
export class ResolverNotSetError extends Error {}

/**
 * Resolver was rejected
 */
export class ResolverRejectedError extends Error {
  constructor(readonly resolver: DeferredContainer) {
    super(resolver.error?.message ?? "resolver rejected")
  }
}

export class ResolverNotSettledError extends Error {
  constructor(readonly resolver: DeferredContainer) {
    super("resolver not settled")
  }
}

/**
 * Get container if immediately available
 *
 * @returns {Container}
 */
export function getContainer(ignoreUnresolved: boolean = false): Container {
  if (!resolver || !resolver.isSettled()) {
    if (!ignoreUnresolved) {
      throw !resolver
        ? new ResolverNotSetError()
        : !resolver.isSettled()
        ? new ResolverNotSettledError(resolver)
        : new ResolverRejectedError(resolver)
    }
    return null
  }

  return resolver.value
}

export function withContainer<T = unknown>(
  id: InjectableId<T>,
  ignoreUnresolved: boolean = false
): T {
  return getContainer(ignoreUnresolved).get(id) as T
}
