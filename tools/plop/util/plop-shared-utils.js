const { asOption } = require("@3fv/prelude-ts")
const { isArray } = require("@3fv/guard")
const Fs = require("fs")
const JSON5 = require("json5")

module.exports.plopReadJsonFile = filename => {
  return JSON5.parse(Fs.readFileSync(filename, "utf8"))
}

module.exports.plopFileWriter =
  outputs => (filename, content) => {
    asOption(outputs)
      .orElse(() =>
        asOption(require("../PlopContext").outputs)
      )
      .filter(isArray)
    outputs.push({ filename, content })
  }

//
