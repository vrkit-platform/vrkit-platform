export enum IconSize {
  sm = "sm",
  md = "md",
  lg = "lg",
  xl = "xl"
}

export type IconSizeKind = `${IconSize}`

export const IconSizes:IconSizeKind[] = Object.values(IconSize)