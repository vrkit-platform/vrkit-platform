import {asOption} from "@3fv/prelude-ts"

export function fatalError(msg, exitCode = 1) {
  msg = `ERROR: ${msg}`
  process.stderr.write(`${msg}\n`);
  process.exit(exitCode)
  
  throw Error(msg)
}

export function isMainScript(url) {
  return url === `file://${process.argv[1]}`
}

export function inGithubActions() {
  return asOption(process.env.GITHUB_ACTIONS)
    .filter(val => typeof val === "string" && val.length > 0)
    .match({
      Some: () => true,
      None: () => false
    })
}