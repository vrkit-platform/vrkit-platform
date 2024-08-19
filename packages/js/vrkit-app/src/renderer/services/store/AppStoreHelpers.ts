import { AsyncThunk, AsyncThunkOptions, AsyncThunkPayloadCreator, createAsyncThunk } from "@reduxjs/toolkit"
import type { AppRootState } from "./AppRootState"


export type AppThunkConfig = {
  state: AppRootState
}


export type AppThunkOptions<Arg> = AsyncThunkOptions<Arg, AppThunkConfig>

export type AppThunkCreator<Result, Arg = void> = AsyncThunkPayloadCreator<Result, Arg, AppThunkConfig>

export type AppThunk<Result, Arg> = AsyncThunk<Result, Arg, AppThunkConfig>

export function createAppAsyncThunk<Result = void, Arg  = void>(typePrefix: string, payloadCreator: AppThunkCreator<Result, Arg>, options?: AppThunkOptions<Arg>): AppThunk<Result,Arg> {
  return createAsyncThunk<Result, Arg, AppThunkConfig>(typePrefix, payloadCreator)
}
