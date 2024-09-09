import { Timestamp } from "../google/protobuf/timestamp"

export function millisToTimestamp(millis: bigint): Timestamp {
  return Timestamp.create({
    seconds: millis / BigInt(1000),
    nanos: Number((millis * 1000000n) % 1000000000n)
    
  })
}