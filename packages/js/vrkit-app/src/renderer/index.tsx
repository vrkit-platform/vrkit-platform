// import * as React from "react"
// import { createRoot } from "react-dom/client"
// import App from "./App"
// import type { Models } from "vrkit-native-interop"
// // import { VRKitClient, VRKitPing, Models } from "vrkit-native-interop"
// //
//
// let pingCountSeq = 0
//
// window["VRKitNativeTest"] = async function() {
//   const { VRKitClient, VRKitPing, Models } = await import("vrkit-native-interop")
//   console.log("VRKitPing", VRKitPing())
//
//   const client = new VRKitClient()
//   const pingRequest = Models.Ping.create({
//     count: ++pingCountSeq
//   })
//
//   client.executeRequest<Models.Ping, Models.Pong>(
//           "/ping",
//           Models.Ping,
//           Models.Pong,
//           pingRequest
//       )
//       .then(res => {
//         console.log("Received pong message", res)
//       })
//       .catch(err => console.error("ping failed", err))
// }
// const container = document.getElementById("root") as HTMLElement
// const root = createRoot(container)
// root.render(<App />)
// //
// // // calling IPC exposed from preload script
// // window.electron.ipcRenderer.once('ipc-example', (arg) => {
// //   // eslint-disable-next-line no-console
// //   console.log(arg);
// // });
// // window.electron.ipcRenderer.sendMessage('ipc-example', ['ping']);
//
// export {}

import ReactDOM from 'react-dom/client';
import { Suspense, StrictMode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

import App from './App';
import { CONFIG } from './config-global';

// ----------------------------------------------------------------------

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
    <StrictMode>
      <HelmetProvider>
        <BrowserRouter basename={CONFIG.site.basePath}>
          <Suspense>
            <App />
          </Suspense>
        </BrowserRouter>
      </HelmetProvider>
    </StrictMode>
);

export {}