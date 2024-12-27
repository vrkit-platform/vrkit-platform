import yauzl, {Entry} from "yauzl"
import Fsx from "fs-extra"
import { Transform } from "stream"
import Path from "path"
import { getLogger } from "@3fv/logger-proxy"
import { Deferred } from "@3fv/deferred"
import { tmpdir } from "node:os"

const log = getLogger(__filename)

export interface UnzipFileOptions {
  onProgress?: (totalBytes: number, byteCount: number, entry: string) => any
}

export async function unzipFile(file: string, dest: string, opts: UnzipFileOptions = {}): Promise<void> {
  const deferred = new Deferred<void>()
  
  let handleCount = 0;
  function incrementHandleCount() {
    handleCount++;
  }
  function decrementHandleCount() {
    handleCount = Math.max(0,handleCount - 1)
    if (handleCount === 0) {
      log.info("all input and output handles closed");
      if (!deferred.isSettled()) {
        deferred.resolve()
      }
    }
  }
  
  incrementHandleCount();
  try {
    yauzl.open(file, { lazyEntries: true }, function(err, zipfile) {
      if (err) {
        deferred.reject(err)
        throw err
      }
      
      zipfile.on("close", function() {
        log.info(`Closed input file @ ${file}`);
        decrementHandleCount();
      })
      
      zipfile.readEntry();
      zipfile.on("entry", function(entry:Entry) {
        const destFile = `${dest}/${entry.fileName}`
        if (/\/$/.test(entry.fileName)) {
          const destFileDir = Path.dirname(destFile)
          Fsx.mkdirp(destFileDir, () => {
            log.info(`created dest dir ${destFileDir}`)
            zipfile.readEntry();
          })
        } else {
          // file entry
          zipfile.openReadStream(entry, function(err, readStream) {
            if (err) {
              deferred.reject(err)
              throw err;
            }
            // report progress through large files
            let byteCount = 0;
            const totalBytes = entry.uncompressedSize;
            
            // report progress at 60Hz
            const progressInterval = setInterval(function() {
              opts.onProgress?.(totalBytes, byteCount, entry.fileName);
            }, 1000 / 60);
            const filter = new Transform();
            filter._transform = function(chunk, _encoding, cb) {
              byteCount += chunk.length;
              cb(null, chunk);
            };
            filter._flush = function(cb) {
              clearInterval(progressInterval);
              cb();
              zipfile.readEntry();
            };
            
            // pump file contents
            const writeStream = Fsx.createWriteStream(destFile)
            incrementHandleCount()
            writeStream.on("close", decrementHandleCount);
            readStream.pipe(filter).pipe(writeStream);
          });
          
        }
      });
    })
    await deferred.promise
  } catch (err) {
    log.error(`Failed to unzip ${file}`, err)
    if (!deferred.isSettled()) {
      deferred.reject(err)
    }
  }
  
  return deferred.promise
}

export async function createTempDirectory(prefix: string): Promise<string> {
  const tmpRoot = tmpdir(),
      tmpDirPrefix = Path.join(tmpRoot, prefix),
      tmpDir = await Fsx.mkdtemp(tmpDirPrefix)
  
  await Fsx.mkdirp(tmpDir)
  return tmpDir
}