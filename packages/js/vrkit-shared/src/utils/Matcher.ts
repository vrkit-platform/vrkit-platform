export type MatchTest<Context> = (
  context?: Context
) => boolean

export type MatchSideEffect<Context> = (
  context?: Context
) => unknown

export type MatchSideEffectInferred<
  Context,
  SideEffect extends MatchSideEffect<Context>
> = SideEffect extends (context?: Context) => infer R
  ? (context?: Context) => R
  : never

export type MatchPair<
  Context,
  Test extends MatchTest<Context>,
  SideEffect extends MatchSideEffect<Context>
> = [Test, MatchSideEffectInferred<Context, SideEffect>]

export type MatchAllReturn<Context, Matchers> =
  Matchers extends [...infer Pairs]
    ? Pairs[number] extends MatchPair<any, any, infer SE>
      ? ReturnType<SE>
      : never
    : never

export function matchAll<
  Context,
  Test extends MatchTest<Context>,
  SideEffect extends MatchSideEffect<Context>,
  Matchers extends MatchPair<
    Context,
    Test,
    MatchSideEffectInferred<Context, SideEffect>
  >[]
>(
  ...matchers: Matchers
): (
  context?: Context
) => MatchAllReturn<Context, Matchers> {
  return (context?: Context) =>
    matchers.map(([test, sideEffect]) => {
      return test(context) ? sideEffect(context) : undefined
    }) as MatchAllReturn<Context, Matchers>
}

export function matchOne<
  Context,
  Test extends MatchTest<Context>,
  SideEffect extends MatchSideEffect<Context>,
  Matchers extends MatchPair<
    Context,
    Test,
    MatchSideEffectInferred<Context, SideEffect>
  >[]
>(
  ...matchers: Matchers
): (
  context?: Context
) => ReturnType<
  MatchSideEffectInferred<Context, SideEffect>
> {
  return (context?: Context) =>
    matchers.find(([test, sideEffect]) => {
      return test(context) ? sideEffect(context) : undefined
    }) as ReturnType<
      MatchSideEffectInferred<Context, SideEffect>
    >
}
