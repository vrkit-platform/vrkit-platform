
export function fatalError(msg, exitCode = 1) {
  msg = `ERROR: ${msg}`
  process.stderr.write(`${msg}\n`);
  process.exit(exitCode)
  
  throw Error(msg)
}

export function isMainScript(url) {
  return url === `file://${process.argv[1]}`
}
