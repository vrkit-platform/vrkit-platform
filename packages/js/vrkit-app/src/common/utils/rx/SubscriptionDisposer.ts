import { forOwn } from "lodash"
import { Subscription, SubscriptionLike } from "rxjs"

export type NamedSubscriptions = {
  [name: string]: SubscriptionLike
}

export class SubscriptionDisposer {
  private subscriptions: Subscription
  private namedSubscriptions: NamedSubscriptions

  public add(
    subscription: SubscriptionLike,
    name?: string
  ): void {
    if (name) {
      this.namedSubscriptions[name] = subscription
    } else {
      this.subscriptions.add(subscription)
    }
  }

  public unsubscribe(name?: string): void {
    if (name) {
      if (this.namedSubscriptions[name]) {
        this.namedSubscriptions[name].unsubscribe()
        delete this.namedSubscriptions[name]
      }
    } else {
      this.subscriptions.unsubscribe()
      forOwn(this.namedSubscriptions, subscription => {
        subscription.unsubscribe()
      })
      this.subscriptions = new Subscription()
      this.namedSubscriptions = {}
    }
  }

  constructor() {
    this.subscriptions = new Subscription()
    this.namedSubscriptions = {}
  }
}
