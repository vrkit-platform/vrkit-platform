export type NativeImageSequenceFormat = "raw" | "png"

export const NativeImageSequenceFormats: NativeImageSequenceFormat[] = ["raw", "png"]

export type NativeImageSeqSettings =
  | false
  | {
      format: NativeImageSequenceFormat
      outputPath?: string
    }

export type AutoOpenDevToolsTrigger = "never" | "always" | "only-normal" | "only-floating"

export interface DevSettings {
  imageSequenceCapture: NativeImageSeqSettings | false

  autoOpenDevToolsTrigger: AutoOpenDevToolsTrigger
  
  workspaceSourcePaths: string[]
}

