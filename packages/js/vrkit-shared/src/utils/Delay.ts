export async function delay(millis: number): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, millis))
}
