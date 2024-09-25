
export type NativeImageSequenceFormat = "raw" | "png"

export const NativeImageSequenceFormats:NativeImageSequenceFormat[] = ["raw", "png"]

export type NativeImageSeqSettings = false | {
  format: NativeImageSequenceFormat
  outputPath?: string
}

export interface DevSettings {
  imageSequenceCapture: NativeImageSeqSettings | false
}

export function newDevSettings(state: Partial<DevSettings> = {}): DevSettings {
  return {
    imageSequenceCapture: false
  }
}