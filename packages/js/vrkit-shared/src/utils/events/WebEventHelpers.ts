
export function stopEvent(ev: React.SyntheticEvent<any>) {
  ev?.preventDefault?.()
  ev?.stopPropagation?.()
}

export function newOnClickHandler<Ev = any>(fn: (ev:Ev) => void): ((ev:Ev) => void) {
  return (ev: Ev) => {
    stopEvent(ev as any)
    fn(ev)
  }
}