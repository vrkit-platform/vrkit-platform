import { isArray } from "@3fv/guard"
import {
  actionOptionsWithTuple,
  ActionOptionsTuple,
  ActionRegistry,
  ActionOptions,
  Action
} from "@vrkit-platform/shared"
import { get } from "lodash/fp"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  useService,
  useServiceContainer
} from "../components/service-container"
import { match } from "ts-pattern"
import { WebActionContainer } from "vrkit-app-renderer/services/actions-web"

export interface UseActionConfig {}

export type UseActionOptions = Partial<UseActionConfig>

export function useActionContainer(
  containerId: string,
  ...actionTemplates: Array<Action | ActionOptions | ActionOptionsTuple>
) {
  const registry = useService(ActionRegistry),
    actions = actionTemplates
      .map(
        template =>
          match(template)
            .when(isArray, (tuple: ActionOptionsTuple) =>
              actionOptionsWithTuple(tuple)
            )
            .otherwise((action: Action | ActionOptions) =>
              action instanceof Action ? action : new Action(action)
            ) as Action
      )
      .reduce(
        (map, action) => ({ ...map, [action.id]: action }),
        {} as Record<string, ActionOptions>
      ),
    [elementRef, setElementRef] = useState<HTMLElement>(),
    containerRef = useRef<WebActionContainer>()

  useEffect(() => {
    const container = (containerRef.current = new WebActionContainer(
      containerId,
      actions,
      elementRef
    ))
    registry.addContainer(container)
    return () => {
      registry.removeContainer(container)
    }
  }, [elementRef, containerId])

  return [containerRef.current, setElementRef, elementRef]
}
