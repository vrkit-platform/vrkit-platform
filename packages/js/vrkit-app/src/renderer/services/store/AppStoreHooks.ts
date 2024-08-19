import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux"
import type { AppRootState } from "./AppRootState"
import type { AppDispatch } from './AppStore'


export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<AppRootState> = useSelector
