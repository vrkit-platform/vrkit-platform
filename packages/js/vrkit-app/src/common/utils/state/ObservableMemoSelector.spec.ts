import "jest"
import {
  IValueDidChange,
  makeObservable,
  action,
  observable, makeAutoObservable
} from "mobx"
import { faker } from '@faker-js/faker';

import {
  ObservableMemoSelector
} from "./ObservableMemoSelector"
import { isNumber } from "@3fv/guard"

function newRawState() {
  return {
    value1: true, value2: "0", nestedObj: {
      nested1: true, nested2: "2"
    }, id: 1
  }
}

type RawState1 = ReturnType<typeof newRawState>

describe("ObservableMemoSelector", () => {
  // mock the dependencies
  
  
  it("should only fire onChanged when predicate passes", () => {
    const
        observableState = makeAutoObservable(newRawState())
    
    const selector = new ObservableMemoSelector<RawState1,[id:number, nested1:boolean], number, Set<number>>(
        observableState,
        (state) => [state.id, state.nestedObj?.nested1],
        (newValue) => newValue[0],
        {
          predicate: (values, oldValues, selectorState) => {
            if (selectorState.cache !instanceof Set) {
              selectorState.cache = new Set<number>()
            }
            
            expect(isNumber(values.target)).toBeTruthy()
            expect(values.target).toBe(observableState.id)
            const exists = selectorState.cache.has(values.target)
            if (!exists)
              selectorState.cache.add(values.target)
            
            return !exists
          },
        }
    );
    
    const changedFn = jest.fn()
    selector.on("CHANGED", changedFn)
    
    const incrementId = action(() => {
      observableState.id++
    })
    
    const changeNested1 = action(() => {
      observableState.nestedObj.nested1 = faker.word.words(1)
    })
    
    incrementId()
    incrementId()
    expect(changedFn).toBeCalledTimes(2)
    
    changeNested1()
    expect(changedFn).toBeCalledTimes(2)
  });
})
