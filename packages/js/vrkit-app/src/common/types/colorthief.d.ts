
declare module "colorthief" {
  /**
   * Represents a color as an RGB array.
   * Example: [255, 255, 255] for white.
   */
  export type RGBColor = [number, number, number]
  
  class ColorThief {
    /**
     * Extracts the dominant color from an image.
     * @param img - The image to process. This can be a file path, URL, Buffer,
     *     or anything compatible with the underlying image loading library.
     * @returns A Promise that resolves to an RGB array representing the dominant
     *     color.
     */
    getColor(img:HTMLImageElement):RGBColor
    
    /**
     * Extracts a palette of dominant colors from an image.
     * @param img - The image to process. Similar to `getColor`, this can be a
     *     file path, URL, Buffer, etc.
     * @param colorCount - Optional. The number of colors to include in the
     *     palette. Must be between 2 and 20. Defaults to 10.
     * @param quality - Optional. The sampling quality. Defaults to 10.
     * @returns A Promise that resolves to an array of RGB arrays, each
     *     representing a dominant color in the palette.
     */
    getPalette(
        img:HTMLImageElement,
        colorCount?:number,
        quality?:number
    ):RGBColor[]
    
  }
  
  export default ColorThief
}
