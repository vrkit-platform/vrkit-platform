import ReactDOM from "react-dom/client"

import renderRoot from "./renderRoot"

import globalStyles from "!!raw-loader!sass-loader!assets/css/global-electron.scss"

const headEl = document.head || document.getElementsByTagName("head")[0],
  styleEl = document.createElement("style")

headEl.appendChild(styleEl)

// styleEl.type = 'text/css';

styleEl.appendChild(document.createTextNode(globalStyles as any))

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement)
renderRoot(root).catch(err => console.error("failed to render root", err))

export {}
