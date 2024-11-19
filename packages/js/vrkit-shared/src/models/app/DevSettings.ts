export type NativeImageSequenceFormat = "raw" | "png"

export const NativeImageSequenceFormats: NativeImageSequenceFormat[] = ["raw", "png"]

export type NativeImageSeqSettings =
  | false
  | {
      format: NativeImageSequenceFormat
      outputPath?: string
    }

export interface DevSettings {
  imageSequenceCapture: NativeImageSeqSettings | false

  alwaysOpenDevTools: boolean
}

