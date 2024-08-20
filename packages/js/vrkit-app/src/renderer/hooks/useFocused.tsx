import React, { useCallback, useState } from "react"

export interface UseFocusedAPI {
  isFocused: boolean
  setIsFocused(isFocused: boolean): void
  onBlur(event: React.FocusEvent<any>): void
  onFocus(event: React.FocusEvent<any>): void
}

export function useFocused(): UseFocusedAPI {
  const [isFocused, setIsFocused] = useState<boolean>(false),
    [onBlur, onFocus] = [false, true].map(focused =>
      useCallback(
        (e: React.FocusEvent<any>) => {
          setIsFocused(focused)
        },
        [setIsFocused]
      )
    ),
    api: UseFocusedAPI = {
      isFocused,
      setIsFocused,
      onBlur,
      onFocus
    }

  return api
}
