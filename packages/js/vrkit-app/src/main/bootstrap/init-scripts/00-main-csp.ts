// import { session } from "electron"

export default async function configureCSP() {
  // NOTE: This has been moved to `launch.ts` which will itself be moved to a
  //   WindowManager once implemented
  //
  // session.defaultSession.webRequest.onBeforeSendHeaders(
  //     (details, callback) => {
  //       callback({ requestHeaders: { Origin: '*', ...details.requestHeaders } });
  //     },
  // )
  // session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
  //   callback({
  //     responseHeaders: {
  //       "Access-Control-Allow-Origin": ["*"],
  //       ...details.responseHeaders,
  //       "Content-Security-Policy": [
  //         "default-src * 'unsafe-inline' 'unsafe-eval'; script-src * 'unsafe-inline' 'unsafe-eval'; connect-src * 'unsafe-inline'; img-src * data: blob: 'unsafe-inline'; frame-src *; style-src * 'unsafe-inline';"
  //       ],
  //
  //     }
  //   })
  // })
}
