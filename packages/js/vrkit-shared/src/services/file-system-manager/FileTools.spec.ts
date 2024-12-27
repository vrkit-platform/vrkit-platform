import "jest"
import { faker } from "@faker-js/faker"
import { isNumber } from "@3fv/guard"
import Fsx from "fs-extra"
import * as Sh from "shelljs"
import Path from "path"
import { unzipFile } from "./FileTools"
import { tmpdir } from "node:os"

describe("FileZipTools", () => {
  let workingDir:string = null
  beforeEach(() => {
    workingDir = Fsx.mkdtempSync(Path.join(tmpdir(), "FileZipTools-tests"))
    console.log(`working dir ${workingDir}`)
  })

  it("Should unzip", async () => {
    const
        srcDir = Path.join(workingDir, "src"),
        destDir = Path.join(workingDir, "dest"),
        zipFile = Path.join(workingDir, "test.zip"),
        zipContentFile = Path.join(srcDir, "content.txt"),
        unzipContentFile = Path.join(destDir, "content.txt")
    
    Fsx.mkdirpSync(srcDir)
    Fsx.mkdirpSync(destDir)
    
    expect(Fsx.pathExistsSync(zipFile)).toBeFalsy()
    
    Sh.ShellString("test123").to(zipContentFile)
    
    const res = Sh.exec(`zip -r "${zipFile}" "."`, {
      cwd: srcDir
    })
    expect(res.code).toBe(0)
    
    expect(Fsx.pathExistsSync(zipFile)).toBeTruthy()
    expect(Fsx.pathExistsSync(unzipContentFile)).toBeFalsy()
    
    await unzipFile(zipFile, destDir, {
      onProgress: (totalBytes, byteCount, entry) => {
        console.info(`${entry}: ${byteCount} of ${totalBytes} (${((byteCount/ totalBytes) * 100.0).toFixed(0)}%)`)
      }
    })
    
    expect(Fsx.pathExistsSync(unzipContentFile)).toBeTruthy()
  })
})
