import { isNotEmpty, isURL } from "@vrkit-platform/shared/utils"
import { assert, isNumber, isString } from "@3fv/guard"
import React from "react"
import { SxProps } from "@mui/system"
import { Theme, useTheme } from "@mui/material"
import warning from "warning"

// APP
import { ClassNamesKey, createClassNames, dimensionConstraints, hasCls, margin } from "@vrkit-platform/shared-ui/styles"
import { getLogger } from "@3fv/logger-proxy"
import { styled } from "@mui/material/styles"
import clsx from "clsx"
import { assign, capitalize } from "lodash"
import { asOption } from "@3fv/prelude-ts"
import { Image, UIImageResource, UIResource } from "@vrkit-platform/models"
import { ImageExt } from "@vrkit-platform/shared"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const appIconClassPrefix = "AppIcon"

export type AppIconSize = "sm" | "md" | "lg" | "xl"

export const appIconClasses = createClassNames(
  appIconClassPrefix,
  "root",
  "square",
  "circle",
  "margin",
  "sm",
  "md",
  "lg",
  "xl"
)
export type AppIconClassKey = ClassNamesKey<typeof appIconClasses>

export interface AppIconImgProps extends Omit<React.HTMLAttributes<HTMLImageElement>, "src"> {
  sx?: SxProps<Theme>
}

export const AppIconRoot = styled("img", {
  label: appIconClassPrefix
})(({ theme }) => {
  const [sm, md, lg, xl] = theme.dimen.appIconSizes
  return {
    [`&, &.${appIconClasses.root}`]: {
      objectFit: "contain",
      pointerEvents: "none",

      [hasCls(appIconClasses.sm)]: {
        ...dimensionConstraints(sm)
      },
      [hasCls(appIconClasses.md)]: {
        ...dimensionConstraints(md)
      },
      [hasCls(appIconClasses.lg)]: {
        ...dimensionConstraints(lg)
      },
      [hasCls(appIconClasses.xl)]: {
        ...dimensionConstraints(xl)
      },
      [hasCls(appIconClasses.margin)]: {
        ...margin(theme.spacing(0.5))
      },
      [hasCls(appIconClasses.square)]: {
        borderRadius: theme.shape.borderRadius
      },
      [hasCls(appIconClasses.circle)]: {
        borderRadius: "50%"
      }
    }
  }
})

const appIconCtx = require.context(
  "vrkit-app-renderer/assets/builtin-icons",
  true,
  /\.png$/
  // "lazy"
)
const appIconKeys = appIconCtx.keys()

export type AppBuiltinIconComponent = React.ComponentType<AppIconImgProps> & {
  iconName: string
  iconUrl: string
}

function createAppBuiltinIcon(name: string) {
  const key = appIconKeys.find(key => key.includes(name))
  assert(isNotEmpty(key), `unable to find key ${name}`)
  const src = appIconCtx(key)
  const iconComponent = React.forwardRef<HTMLImageElement, AppIconImgProps>(({ className, ...other }, ref) => (
    <AppIconRoot
      ref={ref}
      className={clsx(appIconClasses.root, className)}
      src={src}
      {...other}
    />
  ))

  return assign(iconComponent, {
    iconName: name,
    iconUrl: src
  }) as AppBuiltinIconComponent
}

export const AlienIcon = createAppBuiltinIcon("Alien.png")
export const BirdIcon = createAppBuiltinIcon("Bird.png")
export const CloudIcon = createAppBuiltinIcon("Cloud.png")
export const CodeIcon = createAppBuiltinIcon("Code.png")
export const CoffeeIcon = createAppBuiltinIcon("Coffee.png")
export const DesignIcon = createAppBuiltinIcon("Design.png")
export const DiscIcon = createAppBuiltinIcon("Disc.png")
export const DrillIcon = createAppBuiltinIcon("Drill.png")
export const FlagIcon = createAppBuiltinIcon("Flag.png")
export const FoodIcon = createAppBuiltinIcon("Food.png")
export const KoalaIcon = createAppBuiltinIcon("Koala.png")
export const MobileIcon = createAppBuiltinIcon("Mobile.png")
export const MoneyIcon = createAppBuiltinIcon("Money.png")
export const NatureIcon = createAppBuiltinIcon("Nature.png")
export const NotesIcon = createAppBuiltinIcon("Notes.png")
export const PlaneIcon = createAppBuiltinIcon("Plane.png")
export const PowerIcon = createAppBuiltinIcon("Power.png")
export const RefreshIcon = createAppBuiltinIcon("Refresh.png")
export const RocketIcon = createAppBuiltinIcon("Rocket.png")
export const SettingsIcon = createAppBuiltinIcon("Settings.png")
export const ScienceIcon = createAppBuiltinIcon("Science.png")
export const SpannerIcon = createAppBuiltinIcon("Spanner.png")
export const StormIcon = createAppBuiltinIcon("Storm.png")
export const SupportIcon = createAppBuiltinIcon("Support.png")
export const WebsiteIcon = createAppBuiltinIcon("Website.png")
export const YetiIcon = createAppBuiltinIcon("Yeti.png")

export namespace AppBuiltinIcons {
  export const Alien = AlienIcon
  export const Bird = BirdIcon
  export const Cloud = CloudIcon
  export const Code = CodeIcon
  export const Coffee = CoffeeIcon
  export const Design = DesignIcon
  export const Disc = DiscIcon
  export const Drill = DrillIcon
  export const Flag = FlagIcon
  export const Food = FoodIcon
  export const Koala = KoalaIcon
  export const Mobile = MobileIcon
  export const Money = MoneyIcon
  export const Nature = NatureIcon
  export const Notes = NotesIcon
  export const Plane = PlaneIcon
  export const Power = PowerIcon
  export const Refresh = RefreshIcon
  export const Rocket = RocketIcon
  export const Settings = SettingsIcon
  export const Science = ScienceIcon
  export const Spanner = SpannerIcon
  export const Storm = StormIcon
  export const Support = SupportIcon
  export const Website = WebsiteIcon
  export const Yeti = YetiIcon
}

export type AppBuiltinIconName = keyof typeof AppBuiltinIcons

export const AppBuiltinIconKind = Object.fromEntries(Object.keys(AppBuiltinIcons).map(key => [key, key])) as Record<
  AppBuiltinIconName,
  AppBuiltinIconName
>

export type AppIconKind = AppBuiltinIconName | Image

export interface AppIconProps extends AppIconImgProps {
  size?: AppIconSize
  
  fa?: boolean
  
  icon: AppIconKind | UIImageResource | string

  variant?: "circle" | "square"

  noMargin?: boolean

  elevation?: "none" | number
}

export const AppIcon = React.forwardRef<HTMLImageElement, AppIconProps>(function AppIcon(
  { icon, variant = "square", elevation = "none", noMargin = false, size = "sm", className, sx = {}, ...imgProps },
  ref
) {
  const theme = useTheme()
  if (isNumber(elevation)) {
    sx = { ...sx, boxShadow: theme.shadows[elevation] ?? "none" }
  }
  const isUrl = isString(icon) && isURL(icon)
  
  if (!isUrl && (isString(icon) || (isString(icon?.url) &&  ImageExt.isPresetUrl(icon?.url)))) {
    const presetIcon = capitalize(
      isString(icon)
        ? icon
        : asOption(ImageExt.getPresetUrlPathname(icon?.url)).getOrElse(icon?.url ?? AppBuiltinIcons.Code.iconName)
    )

    let Component = AppBuiltinIcons[presetIcon]
    if (!Component) {
      warning(!Component, `Invalid project icon name (${presetIcon})`)
      Component = AppBuiltinIcons.Code
    }
    return (
      <Component
        ref={ref}
        className={clsx(appIconClasses.root, appIconClasses[size], className, {
          [appIconClasses.square]: variant === "square",
          [appIconClasses.circle]: variant === "circle",
          [appIconClasses.margin]: !noMargin
        })}
        sx={sx}
        {...imgProps}
      />
    )
  } else {
    return (
      <AppIconRoot
        ref={ref}
        src={isString(icon) ? icon : icon.url}
        className={clsx(appIconClasses.root, appIconClasses[size], className, {
          [appIconClasses.square]: variant === "square",
          [appIconClasses.circle]: variant === "circle",
          [appIconClasses.margin]: !noMargin
        })}
        sx={sx}
        {...imgProps}
      />
    )
  }
})
