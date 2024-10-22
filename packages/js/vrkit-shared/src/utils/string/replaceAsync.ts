/**
 * Async match & replace
 *
 * @param {string} str
 * @param {RegExp} regex
 * @param {Function} asyncFn
 * @returns
 */
export async function replaceAsync(str, regex, asyncFn) {
  const promises = []
  // @ts-ignore
  str.replace(regex, (match, ...args) => {
    const promise = asyncFn(match, ...args)
    promises.push(promise)
  })
  const data = await Promise.all(promises)
  return str.replace(regex, () => data.shift())
}
