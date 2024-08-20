import { useRef } from "react"


export function useConstant<T>(producer: () => T) {
  const ref = useRef<T>(null)
  
  if (!ref.current) {
    ref.current = producer()
  }
  
  return ref.current
}