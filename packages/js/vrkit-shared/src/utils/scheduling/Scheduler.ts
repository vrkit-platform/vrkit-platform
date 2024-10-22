import { isNumber } from "@3fv/guard"
import { getLogger } from "@3fv/logger-proxy"

const log = getLogger(__filename)

export type TimerType = "interval" | "timeout"

export class TimerRegistration {
  finished: boolean = false

  rescheduleTimeoutRef: number

  rescheduleInterval = -1

  nextExecution: number
  
  intervalRef: number
  
  updateNextExecution(delay: number = this.interval) {
    this.nextExecution = Date.now() + delay
  }

  constructor(
    readonly type: TimerType,
    public interval: number,
    public handler: (...args: any[]) => void,
    public teardownCallback?: (
      reg: TimerRegistration
    ) => void
  ) {
    this.schedule()
  }

  teardown() {
    this.finished = true
    if (this.teardownCallback) {
      this.teardownCallback(this)
    }
  }

  internalHandler = () => {
    const cleanup = () =>
        this.updateNextExecution(this.interval),
      result = this.handler()

    Promise.resolve(result)
      .catch(err =>
        log.error(`Scheduled timer failed in handler`, err)
      )
      .finally(cleanup)
    // if (this.type === "interval") {
    //   this.updateNextExecution(this.interval)
    // }
  }

  //
  // reschedule(delay: number, newInterval?: number) {
  //   if (this.finished) return
  //
  //   this.cancel()
  //
  //   if (newInterval > 0)
  //     this.interval = newInterval
  //   this.rescheduleTimeoutRef = this.intervalRef = null
  //
  //   this.rescheduleInterval = delay
  //   this.updateNextExecution(delay)
  //
  //
  //   this.rescheduleTimeoutRef = setTimeout(() => {
  //     this.rescheduleInterval = 0
  //
  //     this.handler(this)
  //
  //
  //     if (this.type === "interval") {
  //       this.updateNextExecution(this.interval)
  //       setInterval(this.internalHandler, this.interval)
  //     }
  //   }, delay) as any
  //
  //
  // }

  schedule() {
    const createTimer =
      this.type === "interval" ? setInterval : setTimeout

    this.intervalRef = createTimer(
      this.internalHandler,
      this.interval
    ) as any
  }

  cancel() {
    if (this.rescheduleTimeoutRef) {
      clearTimeout(this.rescheduleTimeoutRef)
    } else if (this.type === "interval") {
      clearInterval(this.intervalRef)
    } else {
      clearTimeout(this.intervalRef)
    }
  }
}

const intervals = Array<TimerRegistration>(),
  timeouts = Array<TimerRegistration>()

function create(
  type: TimerType,
  handler: (...args: any[]) => void,
  timeout: number,
  teardown?: () => void,
  ...args: any[]
): TimerRegistration {
  const [timers, createTimer] =
      type === "interval"
        ? [intervals, setInterval]
        : [timeouts, setTimeout],
    existingTimer = timers.find(
      timer => timer.handler === handler
    )

  if (type === "interval" && existingTimer) {
    log.warn(
      "This handler already has a",
      type,
      existingTimer
    )
    return existingTimer
  }

  const reg = new TimerRegistration(
    type,
    timeout,
    handler,
    teardown
  )

  timers.push(reg)

  return reg
}

export namespace Scheduler {
  export function createInterval(
    handler: (...args: any[]) => void,
    timeout: number,
    teardown?: () => void,
    ...args: any[]
  ): TimerRegistration {
    return create(
      "interval",
      handler,
      timeout,
      teardown,
      ...args
    )
  }

  export function createTimeout(
    handler: TimerHandler & ((...args: any[]) => void),
    timeout: number,
    teardown?: () => void,
    ...args: any[]
  ): TimerRegistration {
    let regRef: TimerRegistration | null = null

    regRef = create(
      "timeout",
      () => {
        handler(...args)
        clear(regRef)
      },
      timeout,
      teardown,
      ...args
    )

    return regRef
  }

  export function clear(reg: TimerRegistration): void
  export function clear(intervalRef: number, type: TimerType): void
  export function clear(
    regOrRef: TimerRegistration | number,
    type?: TimerType | null
  ): void {
    let reg: TimerRegistration | null = null
    if (!type && (isNumber(regOrRef) || !regOrRef.type)) {
      throw Error(
        `If you are providing the number intervalRef (${regOrRef}) to clear, a type (${type}) is required`
      )
    } else if (!isNumber(regOrRef)) {
      reg = regOrRef
      if (!type) type = reg.type
    }

    const [timers, clearFn] =
      type === "timeout"
        ? [timeouts, clearTimeout]
        : [intervals, clearInterval]

    if (!reg && isNumber(regOrRef))
      reg = timers.find(timer => timer.intervalRef === regOrRef)

    if (!reg) {
      log.warn(
        `Unable to find and clear timer`,
        regOrRef,
        type
      )
      return
    }

    const timerIndex = timers.findIndex(
      existingReg => existingReg === reg
    )
    if (timerIndex < 0) {
      log.warn(
        "Could not find ",
        reg,
        " in existing ",
        type,
        timers
      )
      return
    }

    clearFn(reg.intervalRef)

    if (reg.teardown) {
      try {
        reg.teardown()
      } catch (err) {
        log.error("Teardown failed", reg, err)
      }
    }

    timers.splice(timerIndex, 1)
  }

  export function clearAll(): void {
    const timers = [...intervals, ...timeouts]
    timers.forEach(timer => clear(timer))
  }
}

// Object.assign(global,{
//   getScheduler: () => ({
//     intervals,
//     timeouts,
//     all: [...intervals.map(it => ({...it,type: 'interval'})),...timeouts.map(it => ({...it,type: 'timeout'}))],
//     scheduler: Scheduler
//   })
// })
//
//
