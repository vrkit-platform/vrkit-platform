import ReactDOM from 'react-dom/client';
import React from "react"
import { importDefault } from "vrkit-app-common/utils"
// import "!!style-loader!css-loader!sass-loader!assets/css/fonts/fonts.global.scss"
// import "react-perfect-scrollbar/dist/css/styles.css"
// import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css"
// import "react-quill/dist/quill.snow.css"
// import "nprogress/nprogress.css"

async function renderRoot(root: ReactDOM.Root) {
  const AppContainer = await importDefault(import("./AppContainer"))
  const AppInitializationContainer = await importDefault(
    import("./components/app-initialization-container")
  )

  function Root() {
    return (
      <AppInitializationContainer>
        <AppContainer />
      </AppInitializationContainer>
    )
  }
  root.render(<Root />)
}

export default renderRoot
