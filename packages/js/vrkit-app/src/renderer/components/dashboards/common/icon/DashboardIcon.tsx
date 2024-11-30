import { isNotEmpty } from "vrkit-shared/utils"
import { assert, isNumber, isString } from "@3fv/guard"
import React from "react"
import { SxProps } from "@mui/system"
import { Theme, useTheme } from "@mui/material"
import warning from "warning"

// APP
import { ClassNamesKey, createClassNames, dimensionConstraints, hasCls, margin } from "vrkit-shared-ui/styles"
import { getLogger } from "@3fv/logger-proxy"
import { styled } from "@mui/material/styles"
// import { Icon } from "@taskx/lib-models"
import clsx from "clsx"
import { assign, capitalize } from "lodash"
//import warning from "warning"
import { asOption } from "@3fv/prelude-ts"
import { Image } from "vrkit-models"
import { ImageExt } from "vrkit-shared"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const dashboardIconClassPrefix = "DashboardIcon"

export type DashboardIconSize = "sm" | "md" | "lg" | "xl"

export const classNames = createClassNames(
  dashboardIconClassPrefix,
  "root",
  "square",
  "circle",
  "margin",
  "sm",
  "md",
  "lg",
  "xl"
)
export type DashboardIconClassKey = ClassNamesKey<typeof classNames>

export interface DashboardIconImgProps extends Omit<React.HTMLAttributes<HTMLImageElement>, "src"> {
  sx?: SxProps<Theme>
}

export const DashboardIconRoot = styled("img", {
  label: dashboardIconClassPrefix
})(({ theme }) => {
  const [sm, md, lg, xl] = theme.dimen.appIconSizes
  return {
    [`&, &.${classNames.root}`]: {
      objectFit: "contain",
      pointerEvents: "none",

      [hasCls(classNames.sm)]: {
        ...dimensionConstraints(sm)
      },
      [hasCls(classNames.md)]: {
        ...dimensionConstraints(md)
      },
      [hasCls(classNames.lg)]: {
        ...dimensionConstraints(lg)
      },
      [hasCls(classNames.xl)]: {
        ...dimensionConstraints(xl)
      },
      [hasCls(classNames.margin)]: {
        ...margin(theme.spacing(0.5))
      },
      [hasCls(classNames.square)]: {
        borderRadius: theme.shape.borderRadius
      },
      [hasCls(classNames.circle)]: {
        borderRadius: "50%"
      }
    }
  }
})

const dashboardIconCtx = require.context(
  "vrkit-app-renderer/assets/builtin-icons",
  true,
  /\.png$/
  // "lazy"
)
const dashboardIconKeys = dashboardIconCtx.keys()

export type DashboardIconPresetComponent = React.ComponentType<DashboardIconImgProps> & {
  iconName: string
  iconUrl: string
}

function createDashboardIcon(name: string) {
  const key = dashboardIconKeys.find(key => key.includes(name))
  assert(isNotEmpty(key), `unable to find key ${name}`)
  const src = dashboardIconCtx(key)
  const iconComponent = React.forwardRef<HTMLImageElement, DashboardIconImgProps>(({ className, ...other }, ref) => (
    <DashboardIconRoot
      ref={ref}
      className={clsx(classNames.root, className)}
      src={src}
      {...other}
    />
  ))

  return assign(iconComponent, {
    iconName: name,
    iconUrl: src
  }) as DashboardIconPresetComponent
}

export const AlienIcon = createDashboardIcon("Alien.png")
export const BirdIcon = createDashboardIcon("Bird.png")
export const CloudIcon = createDashboardIcon("Cloud.png")
export const CodeIcon = createDashboardIcon("Code.png")
export const CoffeeIcon = createDashboardIcon("Coffee.png")
export const DesignIcon = createDashboardIcon("Design.png")
export const DiscIcon = createDashboardIcon("Disc.png")
export const DrillIcon = createDashboardIcon("Drill.png")
export const FlagIcon = createDashboardIcon("Flag.png")
export const FoodIcon = createDashboardIcon("Food.png")
export const KoalaIcon = createDashboardIcon("Koala.png")
export const MobileIcon = createDashboardIcon("Mobile.png")
export const MoneyIcon = createDashboardIcon("Money.png")
export const NatureIcon = createDashboardIcon("Nature.png")
export const NotesIcon = createDashboardIcon("Notes.png")
export const PlaneIcon = createDashboardIcon("Plane.png")
export const PowerIcon = createDashboardIcon("Power.png")
export const RefreshIcon = createDashboardIcon("Refresh.png")
export const RocketIcon = createDashboardIcon("Rocket.png")
export const SettingsIcon = createDashboardIcon("Settings.png")
export const ScienceIcon = createDashboardIcon("Science.png")
export const SpannerIcon = createDashboardIcon("Spanner.png")
export const StormIcon = createDashboardIcon("Storm.png")
export const SupportIcon = createDashboardIcon("Support.png")
export const WebsiteIcon = createDashboardIcon("Website.png")
export const YetiIcon = createDashboardIcon("Yeti.png")

export namespace DashboardIcons {
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

export type DashboardIconPreset = keyof typeof DashboardIcons

export const DashboardIconPresets = Object.fromEntries(Object.keys(DashboardIcons).map(key => [key, key])) as Record<
  DashboardIconPreset,
  DashboardIconPreset
>

export type DashboardIconKind = DashboardIconPreset | Image

export interface DashboardIconProps extends DashboardIconImgProps {
  size?: DashboardIconSize

  icon: DashboardIconKind

  variant?: "circle" | "square"

  noMargin?: boolean

  elevation?: "none" | number
}

export const DashboardIcon = React.forwardRef<HTMLImageElement, DashboardIconProps>(function DashboardIcon(
  { icon, variant = "square", elevation = "none", noMargin = false, size = "sm", className, sx = {}, ...imgProps },
  ref
) {
  const theme = useTheme()
  if (isNumber(elevation)) {
    sx = { ...sx, boxShadow: theme.shadows[elevation] ?? "none" }
  }
  if (isString(icon) || ImageExt.isPresetUrl(icon.url)) {
    const presetIcon = capitalize(
      isString(icon)
        ? icon
        : asOption(ImageExt.getPresetUrlPathname(icon.url)).getOrElse(icon?.url ?? DashboardIcons.Code.iconName)
    )

    let Component = DashboardIcons[presetIcon]
    if (!Component) {
      warning(!Component, `Invalid project icon name (${presetIcon})`)
      Component = DashboardIcons.Code
    }
    return (
      <Component
        ref={ref}
        className={clsx(classNames.root, classNames[size], className, {
          [classNames.square]: variant === "square",
          [classNames.circle]: variant === "circle",
          [classNames.margin]: !noMargin
        })}
        sx={sx}
        {...imgProps}
      />
    )
  } else {
    return (
      <DashboardIconRoot
        ref={ref}
        src={icon.url}
        className={clsx(classNames.root, classNames[size], className, {
          [classNames.square]: variant === "square",
          [classNames.circle]: variant === "circle",
          [classNames.margin]: !noMargin
        })}
        sx={sx}
        {...imgProps}
      />
    )
  }
})
