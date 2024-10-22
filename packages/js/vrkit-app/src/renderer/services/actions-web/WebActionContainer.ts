import { identity } from "lodash"
import * as React from 'react'
import { isHTMLElement } from '../../utils/dom'
import { get } from 'lodash/fp'
import { match } from "ts-pattern"
import {
  ActionContainer,
  ActionOptions
} from "vrkit-shared"

export class WebActionContainer extends ActionContainer {

  get element() {
    return match(this.elementRef)
    .when(isHTMLElement, identity)
    .otherwise(get("current"))
  }

  constructor(
    id: string,
    actions: Record<string, ActionOptions>,
    private readonly elementRef: HTMLElement | React.RefObject<HTMLElement> = null
  ) {
    super(id, actions)
  }

}
