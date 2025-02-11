import StackTrace, { StackFrame } from "stacktrace-js"
import { isArray, isDefined, isString } from "@3fv/guard"
import { pick } from "lodash"
import { match, P } from "ts-pattern"
import { isError } from "./Guards"
import { ClassConstructor } from "@3fv/guard"
import { asOption } from "@3fv/prelude-ts"
import { isNotEmptyString } from "./ObjectUtil"
import { Logger } from "@3fv/logger-proxy"

export const toError = (err: Error | string) =>
  isString(err) ? Error(err) : err

export interface ErrorShape {
  name?: string
  message: string
  stack?: string
  code?: string | number
  statusCode?: number
  retryable?: boolean
  time?: Date
  hostname?: string
  region?: string
  cause?: ErrorShape
}
export type ErrorKind = ErrorShape

/**
 * AWS Error defined in NodeJS SDK spec
 *
 * @see https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Response.html#error-property
 *
 * (Error) —
 * code [String] a unique short code representing the error that was emitted.
 * message [String] a longer human-readable error message
 * retryable [Boolean] whether the error message is retryable.
 * statusCode [Numeric] in the case of a request that reached the service, this value contains the response status code.
 * time [Date] the date time object when the error occurred.
 * hostname [String] set when a networking error occurs to easily identify the endpoint of the request.
 * region [String] set when a networking error occurs to easily identify the region of the request.
 */
export type AWSErrorKind = Omit<ErrorKind, "code"> & {
  code: string
}

//Error |

export function isErrorKind(err: any): err is ErrorKind {
  return isError(err) || (isString(err?.message) && isString(err?.stack))
}

export interface ThrowErrorLogOptions {
  logger?: Logger
  msg?: string
}

export function throwError(
  messageOrError: string | ErrorKind,
  cause: ErrorKind = null,
  opts: ThrowErrorLogOptions = {}
): never {
  if (opts.logger) {
    const logArgs = (
      isNotEmptyString(opts.msg)
        ? [opts.msg, messageOrError, cause]
        : isString(messageOrError)
        ? [messageOrError, cause]
        : [messageOrError.toString(), messageOrError, cause]
    ).filter(isDefined) as [string, ...any[]]
    opts.logger.error(...logArgs)
  }

  throw match(messageOrError)
    .when(isErrorKind, (err: ErrorKind) => err as Error)
    .with(P.string, message => Error(message))
    .otherwise(() =>
      Error(messageOrError?.toString?.() ?? "UNKNOWN")
    )
}

export const throwErrorInline = (
  messageOrError: string | ErrorKind
) => throwError(messageOrError)

export function thrower(
  messageOrError: string | ErrorKind
): () => never {
  return () => {
    return throwError(messageOrError)
  }
}


export function notImplemented(): never {
  throw new Error("Not implemented")
}

export function stackFramesSyncAsString(): string {
  return stackFramesToString(stackFramesSync())
}

export function stackFramesSync(): Array<StackFrame> {
  return StackTrace.getSync()
}

export function stackFramesToString(
  frames: Array<StackFrame>
): string {
  return frames.map(frame => frame.toString()).join("\n")
}

export function errorToJson(err: any) {
  return asOption(
    err?.toJSON?.() ??
      err?.toObject?.() ??
      pick(err, [
        "stack",
        "name",
        "message",
        "path",
        "providedStack",
        "code",
        "statusCode"
      ])
  )
    .map(json => ({
      ...json,
      stack: asOption(json.stack ?? err.stack)
        .map(stack => isArray(stack) ? stackFramesToString(stack) : stack)
        .filter(isNotEmptyString)
        .getOrElse("No stack available")
    }))
    .get()
}

export function catcher<
  T,
  Type extends ClassConstructor<Error>,
  Err extends InstanceType<Type>
>(
  promise: Promise<T>,
  errorType: Type,
  handler: (err: Error | Err) => any,
  predicate: (err: Err | Error) => boolean = undefined
): Promise<T> {
  return promise.catch((err: Error) => {
    if (
      !!errorType &&
      !!err &&
      err! instanceof errorType &&
      (!predicate || !predicate(err))
    ) {
      throw err
    }

    return handler(err)
  }) as Promise<T>
}
