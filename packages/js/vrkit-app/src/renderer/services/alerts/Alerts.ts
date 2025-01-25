import { getLogger } from "@3fv/logger-proxy"
import type { Renderable } from "react-hot-toast"
import toast, { ToastOptions } from "react-hot-toast"
import {
  ErrorKind,
  invoke,
  isErrorKind,
  isNotEmpty,
  isNotEmptyString,
  pairOf,
  throwError,
  valuesOf
} from "@vrkit-platform/shared/utils"
import { AlertType, AlertTypeKind } from "./AlertType"
import { get } from "lodash/fp"
import { AlertErrorConfig, AlertOptions } from "./AlertErrorConfigTypes"
import { asOption } from "@3fv/prelude-ts"
import { isAlertRenderable } from "./isAlertRenderable"
import { isFunction, isString } from "@3fv/guard"

import { isEmpty, omit } from "lodash"
import { useMemo, useState } from "react"
import { match } from "ts-pattern"
import { isDev } from "../../renderer-constants"

const log = getLogger(__filename)
const { debug, trace, info, error, warn } = log

export const APP_ALERTS_ID = "APP_ALERTS_ID"

export const AlertErrorConfigs: AlertErrorConfig<any>[] = [
  // GENERIC ERROR CONFIG
  [isErrorKind, get("message")]
]

export function alertErrorFormatter(err: ErrorKind, opts: AlertOptions) {
  return asOption(AlertErrorConfigs.find(([guard]) => guard(err)))
    .map(([, formatter]: AlertErrorConfig<any>) => formatter(err, opts))
    .getOrCall(() => `Unknown error type ${err.toString()}`)
}

type ToHotToast = (msg: Renderable, opts?: ToastOptions) => string

const makeHotToast =
  (type: AlertTypeKind): ToHotToast =>
  (msg: Renderable, opts: AlertOptions = {}) =>
    asOption(toast[type])
      .map(toaster => toaster(msg, { ...opts, alertType: type } as any))
      .getOrCall(() =>
        toast.custom(msg, {
          className: `hotToastAlert-${type}`,
          alertType: type as any,
          ...opts
        } as any)
      )

const alertToastMapping = Object.fromEntries(
  valuesOf(AlertType).map(type => pairOf(type, makeHotToast(type)))
) as Record<AlertTypeKind, ToHotToast>

function Alert(type: AlertType, errorOrMessage: ErrorKind | Renderable, errOrOpts: ErrorKind | AlertOptions = {}, opts: AlertOptions = {}): string {
  let err: ErrorKind = null
  
  if (isErrorKind(errOrOpts)) {
    err = errOrOpts
    opts.cause = err
  } else {
    opts = Object.assign(opts, {
      ...errOrOpts
    })
  }
  let msg = isErrorKind(errorOrMessage)
    ? alertErrorFormatter(errorOrMessage, opts)
      : isAlertRenderable(errorOrMessage)
      ? errorOrMessage
      : throwError(`Message is not renderable or error kind: ${(errorOrMessage as any)?.toString()}`)

  if (isErrorKind(opts.cause)) {
    msg = `${msg}\nDetails:${alertErrorFormatter(opts.cause, opts)}\nStack:\n${opts.cause.stack}`
  }
  
  if (isDev) {
    const msgStr = isFunction(msg?.toString) && msg.toString()
    if (isNotEmptyString(msgStr)) {
      const logFn = (log[type] ?? log.info).bind(log)
      logFn(msgStr)
    }
  }
  
  
  
  // GET THE TOASTER BASED ON MESSAGE TYPE
  return asOption(alertToastMapping[type])
    .filter(isFunction)
    .map(invoke(msg, omit(opts, "formatPrefix")))
    .tapIf(
      () => isDev,
      toast => info(`Created hot toast`, toast)
    )
    .getOrThrow(`unknown toast type ${type}`)
}

export interface Alerter {
  type: AlertType

  (errorOrMessage: ErrorKind | Renderable, opts?: AlertOptions): string

  (errorOrMessage: ErrorKind | Renderable, err: ErrorKind, opts?: AlertOptions): string
}

function createAlertFactory(type: AlertType): Alerter {
  const alerter = ((
    errorOrMessage: ErrorKind | Renderable,
    errOrOpts: ErrorKind | AlertOptions = {},
    opts: AlertOptions = {}
  ) => Alert(type, errorOrMessage, errOrOpts, opts)) as Alerter

  alerter.type = type

  return alerter
}

namespace Alert {
  export const errorFormatter = alertErrorFormatter

  export const [info, error, success, warning, loading] = Array<AlertTypeKind>(
    "info",
    "error",
    "success",
    "warning",
    "loading"
  ).map(createAlertFactory)

  /**
   * Alert event handlers
   */
  export const [onInfo, onError, onSuccess, onWarning] = Array<AlertTypeKind>("info", "error", "success", "warning")
    .map(createAlertFactory)
    .map(
      createAlert =>
        (msgFormat: Renderable = undefined, options: AlertOptions = {}, ...args: any[]) =>
        (...eventArgs: any[]) => {
          let firstEventArg = eventArgs[0]
          if (isErrorKind(firstEventArg)) {
            log.error(`Received error`, firstEventArg)
            firstEventArg = eventArgs[0] = firstEventArg.message
          }
          if (!msgFormat || isEmpty(msgFormat) || !isString(msgFormat)) {
            return createAlert(firstEventArg, options)
          } else {
            const message = isString(msgFormat) ? msgFormat : (msgFormat as any)?.toString()
            // ? printf(msgFormat, ...[...args, ...eventArgs].filter(isDefined))
            // : msgFormat
            return createAlert(message, options)
          }
        }
    )

  interface AlertPromiseContext<Args extends any[], Res = any> {
    err: ErrorKind

    args: Args

    result: Res
  }

  type AlertPromiseMessageFactory<Args extends any[], Res = any> = (ctx: AlertPromiseContext<Args, Res>) => Renderable

  type AlertPromiseMessageKind<Args extends any[], Res = any> = AlertPromiseMessageFactory<Args, Res> | Renderable

  export interface AlertPromiseOptions<Args extends any[] = any[], Res = any> {
    loading: AlertPromiseMessageKind<Args, Res>

    success?: AlertPromiseMessageKind<Args, Res>

    error?: AlertPromiseMessageKind<Args, Res>
  }

  export interface AlertUsePromiseOptions<Args extends any[] = any[], Res = any>
    extends AlertPromiseOptions<Args, Res> {
    canExecute?: () => boolean
  }

  export function promise<T, Args extends any[] = any[]>(
    pending: Promise<T>,
    { loading, success, error }: AlertPromiseOptions<Args, T>,
    args?: Args
  ): Promise<T> {
    const ctx: AlertPromiseContext<Args, T> = {
        args,
        err: null,
        result: null
      },
      toMessage = (message: AlertPromiseMessageKind<Args, T>) => (isFunction(message) ? message(ctx) : message)

    const toastId = Alert.loading(toMessage(loading)),
      handleError = (err: ErrorKind) => {
        ctx.err = err
        Alert.error(toMessage(error ?? err.message), {
          id: toastId
        })
      }
    return pending
      .then((res: T) => {
        if (isErrorKind(res)) {
          handleError(res)
        } else {
          if (isFunction(success) || isNotEmpty(success)) {
            ctx.result = res
            Alert.success(toMessage(success), {
              id: toastId
            })
          }
        }
        return res
      })
      .catch(err => {
        handleError(err)
        throw err
      })
  }
  
  export type AlertFunction<
    Fn extends (...args: any[]) => Promise<any>,
    Args extends Parameters<Fn> = Parameters<Fn>,
    T extends Awaited<ReturnType<Fn>> = Awaited<ReturnType<Fn>>
  > = {
    executing: boolean
    execute: (...args:Args) => Promise<T>
  }
  
  export function usePromise<
    Fn extends (...args: any[]) => Promise<any>,
    Args extends Parameters<Fn> = Parameters<Fn>,
    T extends Awaited<ReturnType<Fn>> = Awaited<ReturnType<Fn>>
  >(fn: (...args: Args) => Promise<T>, options: AlertUsePromiseOptions<Args, T>, deps: any[] = []): AlertFunction<Fn, Args, T> {
    const [alertFnState, setAlertFnState] = useState<AlertFunction<Fn, Args, T>>(null),
    alertFn = useMemo(
      
      () => {
        const alertExecute = match(isFunction(options?.canExecute) ? options.canExecute() : true)
          .with(
            true,
            () => (...args:Args): Promise<T> => {
              setAlertFnState(state => ({ ...state, executing: true }))
              //log.assert(!!alertFnState, `AlertFn not set in state`)
              return Alert.promise<T, Args>(fn(...args), options, args)
                .finally(() => {
                  setAlertFnState(state => ({ ...state, executing: false }))
                })
            }
          )
          .otherwise(() => () => Promise.resolve(null)) as Fn
        
        const alertFn:AlertFunction<Fn, Args,T> = {
          execute: alertExecute,
          executing: false
        }
        
        setAlertFnState(alertFn)
        return alertFn
      },
      deps
    )
    
    return alertFnState ?? alertFn
  }
}

if (isDev) {
  Object.assign(global, {
    Alert,
    toast
  })
}

export { Alert }

export default Alert
