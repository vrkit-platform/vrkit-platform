import { ComponentPreview, Previews } from "@react-buddy/ide-toolbox"
import { PaletteTree } from "./palette"
import { AsyncImage } from "../renderer/components/async-image"

const ComponentPreviews = () => {
  return (
    <Previews palette={<PaletteTree />}>
      <ComponentPreview path="/Page">
        {/*<Page title={'Hello'}/>*/}
        <AsyncImage src="https://imageio.forbes.com/specials-images/imageserve/647f8116232e9b434557b386/0x0.jpg?format=jpg&crop=5272,2964,x0,y272,safe&height=900&width=1600&fit=bounds" />
      </ComponentPreview>
    </Previews>
  )
}

export default ComponentPreviews
