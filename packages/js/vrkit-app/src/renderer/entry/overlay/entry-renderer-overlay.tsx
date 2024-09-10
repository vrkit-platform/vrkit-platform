
async function start() {
  const
      rootEl = document.getElementById("root") as HTMLElement,
      {resolveContainer} = await import("./overlayContainerFactory")
  
  if (import.meta.webpackHot) {
    import.meta.webpackHot.addDisposeHandler(() => {
      rootEl.innerHTML = ''
    })
    
    import.meta.webpackHot.accept(err => {
      console.error("failed to render overlay", err)
    })
  }
  
  await resolveContainer().promise
}

start()
    .catch(err => console.error("failed to start", err))

export {}
