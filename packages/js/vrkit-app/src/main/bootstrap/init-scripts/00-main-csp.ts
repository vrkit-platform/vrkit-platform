import { session } from "electron"

export default async function configureCSP() {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders, // 'Content-Security-Policy': "*"
        "Content-Security-Policy": [
          "default-src * 'unsafe-inline' 'unsafe-eval'; script-src * 'unsafe-inline' 'unsafe-eval'; connect-src * 'unsafe-inline'; img-src * data: blob: 'unsafe-inline'; frame-src *; style-src * 'unsafe-inline';"
        ],
        "Access-Control-Allow-Origin": ["*"]
      }
    })
  })
}
