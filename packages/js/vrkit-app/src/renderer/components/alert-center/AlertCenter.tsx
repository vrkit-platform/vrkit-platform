import { toast, useToaster } from "react-hot-toast"
import React from "react"
import { getLogger } from "@3fv/logger-proxy"
import clsx from "clsx"
import {
  alpha,
  child,
  ClassNamesKey,
  createClassNames,
  Ellipsis,
  FillWindow,
  FlexAuto,
  FlexRow,
  FlexScaleZero,
  flexAlign,
  padding,
  widthConstraint,
  OverflowHidden,
  PositionAbsolute,
  rem
} from "vrkit-shared-ui/styles"
import { AlertType } from "../../services/alerts"
import { styled } from "@mui/material/styles"
import { Box, Button, IconButton, useTheme } from "@mui/material"
import { Icon } from "../icon"
import {
  faTimes as falTimes,
  faInfoSquare as falInfoSquare,
  faCheck as falCheck,
  faExclamationTriangle as falExclamationTriangle
} from "@awesome.me/kit-79150a3eed/icons/sharp/light"
import {
  faTimes as fasTimes,
  faExclamationTriangle as fasExclamationTriangle
} from "@awesome.me/kit-79150a3eed/icons/sharp/solid"
import { faSpinner as fadSpinner } from "@awesome.me/kit-79150a3eed/icons/duotone/solid"
const log = getLogger(__filename)

const classPrefix = "AlertCenter"
export const alertCenterClasses = createClassNames(
  classPrefix,
  "root",
  "notification",
  ...(Object.keys(AlertType) as (keyof typeof AlertType)[])
)

export type AlertCenterClassKey = ClassNamesKey<typeof alertCenterClasses>

const AlertCenterRoot = styled<typeof Box>(Box, {
  name: classPrefix
})(({ theme }) => {
  const { palette, spacing, dimen: dimen, transitions, shape, shadows } = theme

  const createTypeRule = (
    color: AlertType,
    bgColor?: string,
    fgColor?: string,
    iconColor?: string
  ) => {
    bgColor = bgColor ?? palette[color].main
    fgColor = fgColor ?? theme.palette.getContrastText(bgColor)
    iconColor = iconColor ?? fgColor
    return {
      [`&.${alertCenterClasses[color]}, & .${alertCenterClasses[color]}`]: {
        textTransform: "uppercase",
        backgroundColor: bgColor,
        boxShadow: shadows[6],
        color: fgColor,
        fontSize: rem(0.8),
        "& button.dismissButton": {
          "& svg": {
            color: alpha(fgColor, 0.5),
            fill: alpha(fgColor, 0.5)
          },
          "&:hover svg": {
            transition: transitions.create(["color", "fill"]),
            color: fgColor,
            fill: fgColor
          }
        },
        "& svg:not(.dismissButton)": {
          color: iconColor,
          fill: iconColor,
          fontWeight: 500,
          fontSize: rem(1.3)
        }
      }
    }
  }

  return {
    [`&, &.${alertCenterClasses.root}`]: {
      ...FillWindow,
      ...PositionAbsolute,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: "none",
      zIndex: 4000,

      [child(alertCenterClasses.notification)]: {
        ...OverflowHidden,
        transition: transitions.create(["all"]),
        position: "absolute",
        minHeight: rem(3),
        width: "40vw",
        maxWidth: "40vw",

        "&:not(.visible)": {
          opacity: 0
        },
        "&.visible": {
          opacity: 1
        },

        ...createTypeRule(AlertType.error),
        ...createTypeRule(
          AlertType.success,
          "black",
          "white",
          palette.success.main
        ),
        ...createTypeRule(
          AlertType.warning,
          "black",
          "white",
          palette.warning.main
        ),
        ...createTypeRule(AlertType.info, "black", "white", palette.info.main),
        ...createTypeRule(
          AlertType.loading,
          "black",
          "white",
          palette.info.main
        )
      }
    }
  }
})

const AlertCenterRow = styled<typeof Box>(Box, {
  name: "AlertCenterRow"
})(({ theme }) => ({
  ...FlexRow,
  ...flexAlign("center", "stretch"),
  pointerEvents: "auto",
  borderRadius: theme.shape.borderRadius
}))

const AlertCenterIcon = styled<typeof Box>(Box, {
  name: "AlertCenterIcon"
})(({ theme: { spacing, palette, shape } }) => ({
  ...FlexAuto,
  ...padding(spacing(), 0, spacing(), spacing(2)),
  ...widthConstraint(rem(2.5))
}))

const AlertCenterMessage = styled<typeof Box>(Box, {
  name: "AlertCenterMessage"
})(({ theme: { spacing, palette, shape } }) => ({
  ...FlexScaleZero,
  ...Ellipsis,
  ...padding(spacing(), spacing(2))
}))

const AlertCenterActions = styled<typeof Box>(Box, {
  name: "AlertCenterActions"
})(({ theme: { spacing, palette } }) => ({
  ...FlexAuto
}))

export interface AlertCenterProps {
  className?: string
}

export function AlertCenter(props: AlertCenterProps) {
  const { className, ...other } = props
  const { toasts, handlers } = useToaster()
  const { startPause, endPause, calculateOffset, updateHeight } = handlers
  const theme = useTheme()

  return (
    <AlertCenterRoot
      className={clsx(alertCenterClasses.root, className, {})}
      onMouseEnter={startPause}
      onMouseLeave={endPause}
    >
      {toasts.map(t => {
        const offset = calculateOffset(t, {
            reverseOrder: false,
            defaultPosition: "bottom-center"
          }),
          ref = el => {
            if (el && !t.height) {
              const height = el.getBoundingClientRect().height
              updateHeight(t.id, height)
            }
          },
          alertType = (t as any).alertType as AlertType
        return (
          <AlertCenterRow
            key={t.id}
            className={clsx(
              alertCenterClasses.notification,
              alertCenterClasses[t.type],
              alertCenterClasses[alertType],
              t.type,
              {
                visible: t.visible
              }
            )}
            ref={ref}
            style={{
              position: "absolute",
              bottom: theme.spacing(2), //document.body.clientHeight,
              left: document.body.clientWidth / 2,
              transform: `translate(-50%, -${offset}px)`
            }}
          >
            <AlertCenterIcon>
              <Icon
                fa
                spin={alertType === "loading"}
                icon={
                  alertType === "error"
                    ? fasExclamationTriangle
                    : alertType === "warning"
                    ? falExclamationTriangle
                    : t.type === "loading"
                    ? fadSpinner
                    : alertType === "success"
                    ? falCheck
                    : falInfoSquare
                }
              />
            </AlertCenterIcon>
            <AlertCenterMessage>{(t as any).message}</AlertCenterMessage>
            {t.type !== "loading" && t.duration === Infinity && (
              <AlertCenterActions>
                <Button
                  variant="text"
                  sx={{}}
                  className="dismissButton"
                  onClick={() => {
                    toast.dismiss(t.id)
                  }}
                >
                  <Icon fa icon={t.type === "error" ? fasTimes : falTimes} />
                </Button>
              </AlertCenterActions>
            )}
          </AlertCenterRow>
        )
      })}
    </AlertCenterRoot>
  )
}

export default AlertCenter
