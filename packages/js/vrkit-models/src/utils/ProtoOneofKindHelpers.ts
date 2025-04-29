

export type OneofKindType<T extends {}, O> =
    Exclude<Extract<T, { oneofKind: O }>, {oneofKind: undefined}>