// import * as React from "react"
// import { MemoryRouter as Router, Routes, Route } from "react-router-dom"
// import icon from "../assets/icons/icon.svg"
// import "./App.css"
//
// function Hello() {
//   return (
//       <div>
//         <div className="Hello">
//           <img width="200" alt="icon" src={icon}/>
//         </div>
//         <h1>electron-react-boilerplate</h1>
//         <div className="Hello">
//           <a
//               href="https://electron-react-boilerplate.js.org/"
//               target="_blank"
//               rel="noreferrer"
//           >
//             <button type="button">
//             <span role="img" aria-label="books">
//               📚
//             </span>
//               Read our docs
//             </button>
//           </a>
//           <a
//               href="https://github.com/sponsors/electron-react-boilerplate"
//               target="_blank"
//               rel="noreferrer"
//           >
//             <button type="button">
//             <span role="img" aria-label="folded hands">
//               🙏
//             </span>
//               Donate
//             </button>
//           </a>
//         </div>
//       </div>
//   )
// }
//
// export default function App() {
//   return (
//       <Router>
//         <Routes>
//           <Route path="/" element={<Hello/>}/>
//         </Routes>
//       </Router>
//   )
// }

import "vrkit-app-renderer/global.css"

// ----------------------------------------------------------------------
import { Router } from "vrkit-app-renderer/routes/sections"

import { useScrollToTop } from "vrkit-app-renderer/hooks/use-scroll-to-top"
import { LocalizationProvider } from "vrkit-app-renderer/locales"
import { I18nProvider } from "vrkit-app-renderer/locales/i18n-provider"
import { ThemeProvider } from "vrkit-app-renderer/theme/theme-provider"

import { Snackbar } from "vrkit-app-renderer/components/snackbar"
import { ProgressBar } from "vrkit-app-renderer/components/progress-bar"
import { MotionLazy } from "vrkit-app-renderer/components/animate/motion-lazy"
import {
  defaultSettings,
  SettingsDrawer,
  SettingsProvider
} from "vrkit-app-renderer/components/settings"

export default function App() {
  useScrollToTop()

  return (
    <I18nProvider>
      <LocalizationProvider>
        <SettingsProvider settings={defaultSettings}>
          <ThemeProvider>
            <MotionLazy>
              <Snackbar />
              <ProgressBar />
              <SettingsDrawer />
              <Router />
            </MotionLazy>
          </ThemeProvider>
        </SettingsProvider>
      </LocalizationProvider>
    </I18nProvider>
  )
}
