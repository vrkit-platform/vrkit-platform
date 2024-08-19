import { SharedWorkerInfo, WebContents, webContents } from "electron"
import { first, isEmpty } from "lodash"

export function inspectSharedWorker() {
  const allWebContent = webContents.getAllWebContents(),
    allWorkerInfo = allWebContent?.flatMap(
      content =>
        content.getAllSharedWorkers()?.map(info => [content, info]) ?? []
    )

  if (allWorkerInfo?.length > 0) {
    const [content, workerInfo] = first(allWorkerInfo) as [
        WebContents,
        SharedWorkerInfo
      ],
      workerId = workerInfo?.id

    content.inspectSharedWorkerById(workerId)
    return true
  } else {
    return false
  }
  
}
