import "jest"
import { action, makeAutoObservable } from "mobx"
import { faker } from "@faker-js/faker"

import {
  CachedStateComputation, CachedStateComputationEventType
} from "./CachedStateComputation"
import { isNumber } from "@3fv/guard"

function newRawState() {
  return {
    value1: true,
    value2: "0",
    nestedObj: {
      nested1: true,
      nested2: "2"
    },
    id: 1
  }
}

type RawState1 = ReturnType<typeof newRawState>

describe("CachedStateComputationSelector", () => {
  // mock the dependencies

  it("should only fire onChanged when predicate passes", () => {
    const observableState = makeAutoObservable(newRawState())

    const selector = new CachedStateComputation<RawState1, [id: number, nested1: boolean], number, Set<number>>(
      observableState,
      state => [state.id, state.nestedObj?.nested1],
      newValue => newValue[0],
      {
        predicate: (values, oldValues, selectorState) => {
          if (selectorState.customCache! instanceof Set) {
            selectorState.customCache = new Set<number>()
          }

          expect(isNumber(values.target)).toBeTruthy()
          expect(values.target).toBe(observableState.id)
          const exists = selectorState.customCache.has(values.target)
          if (!exists) selectorState.customCache.add(values.target)

          return !exists
        }
      }
    )

    const changedFn = jest.fn()
    selector.on(CachedStateComputationEventType.CHANGED, changedFn)

    const incrementId = action(() => {
      observableState.id++
    })

    const changeNested = action(() => {
      observableState.nestedObj.nested1 = !observableState.nestedObj.nested1
      observableState.nestedObj.nested2 = faker.word.words(1)
    })

    incrementId()
    incrementId()
    expect(changedFn).toBeCalledTimes(2)

    changeNested()
    expect(changedFn).toBeCalledTimes(2)
    
    incrementId()
    expect(changedFn).toBeCalledTimes(3)
  })
})
