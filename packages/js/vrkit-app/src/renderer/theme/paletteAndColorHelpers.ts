import { padStart, range } from "lodash"
import { add } from "lodash/fp"
import { darken, lighten } from "@mui/material/styles"
import type { Theme } from "./ThemeTypes"
import { linearGradient } from "vrkit-shared-ui"
import { createPaletteChannel } from "./styles"


export const darkPrimaryAndSecondaryPalettes = {
  primary: createPaletteChannel({
    contrastText: "#ffffff",
    main: "#0a8af3"
  }),
  secondary: createPaletteChannel({
    contrastText: "#ffffff",
    main: "#8544da"
  })
}

export const lightPrimaryAndSecondaryPalettes = {
  primary: {
    contrastText: "#ffffff",
    main: "#299eff"
  },
  secondary: {
    contrastText: "#ffffff",
    main: "#8544da"
  }
}


export function createContainedPrimaryButtonRule(theme: Theme) {
  return {
    backgroundSize: "100% 150%",
    backgroundRepeat: "no-repeat",
    backgroundPositionY: "0",
    backgroundColor: theme.palette.mode === "light" ? "white" : "black",
    transition: `background-position-y 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,
              background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,
              box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,
              border-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,
              color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms`,

    backgroundOrigin: "top left",
    backgroundImage: [
      linearGradient(
        "to bottom",
        "rgba(10, 138, 243,0.8) 0%",
        "rgba(10, 138, 243,1) 5%",
        "rgba(10, 138, 243,0.9) 45%",
        "rgba(10, 138, 243,0.85) 50%",
        "rgba(10, 138, 243,0.7) 75%",
        "rgba(10, 138, 243,0.65) 90%",
        "rgba(10, 138, 243,0.55) 100%"
      )
      // "black"
    ].join(","),

    "&:hover": {
      backgroundPositionY: "50%"
    }
  }
}

export function paneBackgrounds(fromColor: string, count: number, factor: number) {
  return range(0, count, 1)
    .map(add(1))
    .reduce((map, i) => {
      return {
        ...map,
        [`pane${padStart("" + i, 2, "0")}`]: (factor < 0 ? darken : lighten)(
          fromColor,
          i * Math.abs(factor)
        )
      }
    }, {})
}
