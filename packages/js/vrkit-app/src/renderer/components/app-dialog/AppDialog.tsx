// REACT
import React from "react"

// CLSX
import clsx from "clsx"

// 3FV
import { getLogger } from "@3fv/logger-proxy"

// MUI
import Dialog, { dialogClasses, DialogProps } from "@mui/material/Dialog"
import CloseIcon from "@mui/icons-material/Close"
import { useTheme } from "@mui/material/styles"

// APP
import {
  alpha,
  child,
  childSelector,
  ClassNamesKey,
  createClassNames,
  Ellipsis,
  Fill,
  FillBounds,
  FillWidth,
  flexAlign,
  FlexAuto,
  FlexColumn,
  FlexRow,
  FlexRowCenter,
  FlexScaleZero,
  heightConstraint,
  margin,
  OverflowHidden,
  padding,
  PositionAbsolute
} from "@vrkit-platform/shared-ui"
import AppDialogTransition from "./AppDialogTransition"
import { backdropClasses } from "@mui/material/Backdrop"
import { Theme } from "../../theme/ThemeTypes"
import GlobalStyles from "@mui/material/GlobalStyles"
import Box from "@mui/material/Box"
import { AppIconButton } from "../app-icon-button"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const classPrefix = "appDialog"
export const appDialogClasses = createClassNames(
  classPrefix,
  "root",
  "paper",
  "header",
  "headerTitle",
  "headerLeft",
  "headerCenter",
  "headerRight",
  "headerAction",
  "content"
)
const classes = appDialogClasses

export type AppDialogClassKey = ClassNamesKey<typeof appDialogClasses>

function appDialogStyles({
  dimen,
  palette,
  shape,
  customShadows,
  shadows,
  components,
  colors,
  transitions,
  typography,
  insetShadows,
  mixins,
  zIndex,
  spacing
}: Theme) {
  return {
    [`div.${appDialogClasses.root}`]: {
      ...FillWidth,
      ...OverflowHidden,
      ...margin(0),
      top: "unset",
      bottom: 0,
      maxHeight: "70vh",
      minHeight: "50vh",
      height: "auto",
      [child(dialogClasses.container)]: {
        ...PositionAbsolute,
        ...FillBounds
      },
      [child(backdropClasses.root)]: {
        backgroundColor: alpha("black", 0.7)
      },

      [child(classes.paper)]: {
        ...FlexColumn,
        ...flexAlign("stretch", "stretch"),
        ...OverflowHidden,
        ...PositionAbsolute,
        ...FillBounds,
        ...margin(0),
        ...Fill,
        borderRadius: 0,
        [child(appDialogClasses.header)]: {
          ...heightConstraint(dimen.appBarHeight),
          ...FlexRow,
          ...FlexAuto,
          ...flexAlign("center", "stretch"),
          ...padding(spacing(1)),
          gap: spacing(1),
          [child(appDialogClasses.headerLeft)]: {
            ...FlexAuto,
            ...FlexRow,
            ...flexAlign("flex-start", "stretch"),
            gap: spacing(1)
          },
          [child(appDialogClasses.headerCenter)]: {
            ...FlexScaleZero,
            ...FlexRowCenter,
            gap: spacing(1),
            [child(appDialogClasses.headerTitle)]: {
              ...typography.h4,
              ...FlexScaleZero,
              ...Ellipsis
            }
          },
          [child(appDialogClasses.headerRight)]: {
            ...FlexAuto,
            ...FlexRow,
            ...flexAlign("flex-end", "stretch")
          },
          [child([appDialogClasses.headerLeft, appDialogClasses.headerCenter, appDialogClasses.headerRight], {
            selectors: [childSelector(appDialogClasses.headerAction)]
          })]: {
            ...FlexAuto
          }
        },
        [child(appDialogClasses.content)]: {
          ...FlexScaleZero,
          minHeight: "30vh"
        }
      }
    }
  }
}

// const AppDialogRoot = styled(Dialog, {
//   name: "AppDialogRoot",
//   label: "AppDialogRoot"
// })(({ theme }) => ({
//   // root styles here
// }))

/**
 * AppDialog Component Properties
 */
export interface AppDialogProps
  extends Omit<
    DialogProps,
    "slots" | "TransitionComponent" | "keepMounted" | "fullscreenable" | "maxWidth" | "fullWidth"
  > {
  slots?: {
    header?: React.ReactNode
    headerLeft?: React.ReactNode
    headerRight?: React.ReactNode
    content?: React.ReactNode
  }

  title: string

  hideCloseButton?: boolean
}

/**
 * AppDialog Component
 *
 * @param { AppDialogProps } props
 */
export function AppDialog(props: AppDialogProps) {
  const { className, title, slots = {}, hideCloseButton = false, open, sx, onClose, children, ...other } = props,
    theme = useTheme()

  return (
    <>
      <GlobalStyles styles={appDialogStyles} />
      <Dialog
        className={clsx(appDialogClasses.root, {}, className)}
        open={open}
        TransitionComponent={AppDialogTransition}
        keepMounted
        onClose={onClose}
        fullWidth={true}
        maxWidth={false}
        PaperProps={{
          className: classes.paper,
          sx: {}
        }}
        sx={{
          ...sx
        }}
        {...other}
      >
        <Box className={classes.header}>
          {slots.header ? (
            slots.header
          ) : (
            <Box className={classes.header}>
              <Box className={classes.headerLeft}>{slots.headerLeft}</Box>
              <Box className={classes.headerCenter}>{title && <Box className={classes.headerTitle}>{title}</Box>}</Box>

              <Box className={classes.headerRight}>
                {slots.headerRight}
                {!hideCloseButton && (
                  <AppIconButton
                    onClick={ev => {
                      ev.preventDefault()
                      ev.stopPropagation()
                      onClose?.(ev, "escapeKeyDown")
                    }}
                  >
                    <CloseIcon />
                  </AppIconButton>
                )}
              </Box>
            </Box>
          )}
        </Box>
        <Box className={classes.content}>
          {slots.content}
          {children}
        </Box>
      </Dialog>
    </>
  )
}

export default AppDialog
