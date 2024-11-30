// REACT
import React, { useCallback, useEffect, useState } from "react"

// CLSX
import clsx from "clsx"

// 3FV
import { getLogger } from "@3fv/logger-proxy"

// MUI
import Box from "@mui/material/Box"
import type {BoxProps} from "@mui/material/Box"
import { styled } from "@mui/material/styles"

// APP
import { ClassNamesKey, createClassNames, dimensionConstraints, child, hasCls,
  CursorPointer,
  FlexAuto,
  FlexColumnCenter,
  
  PositionRelative,
  PositionAbsolute,
  Fill,
  OverflowHidden,
  flexAlign,
  FlexColumn,
  FillBounds
} from "vrkit-shared-ui"
import {
  AppBuiltinIconComponent,
  AppBuiltinIcons,
  AppFAIcon,
  appIconClasses,
  AppIconKind,
  AppIconProps, AppIconRoot
} from "../app-icon"
import { UIImageResource } from "vrkit-models"
import { match } from "ts-pattern"
import { Predicate } from "@3fv/prelude-ts"
import { isObject, isString } from "@3fv/guard"
import { faCircleCamera } from "@awesome.me/kit-79150a3eed/icons/duotone/solid"
import { ImageExt, isEmpty } from "vrkit-shared"
import { capitalize } from "lodash"
import warning from "warning"
import { get } from "lodash/fp"
import { fileToDataURL } from "../../utils"
import { InputLabel } from "@mui/material"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const classPrefix = "appIconEditor"
// export const appIconEditorClasses = createClassNames(classPrefix, "root", "child1")
// export type AppIconEditorClassKey = ClassNamesKey<typeof appIconEditorClasses>
//
//
// const AppIconEditorRoot = styled(Box, {
//   name: "AppIconEditorRoot",
//   label: "AppIconEditorRoot"
// })(({theme}) => ({
//   // root styles here
//   [hasCls(appIconEditorClasses.root)]: {
//     // child styled here
//     [child(appIconEditorClasses.child1)]: {
//       // child styled here
//     }
//   }
// }))
//


export interface AppIconEditorProps
    extends Omit<AppIconProps, "onChange"> {
  editable?: boolean
  onChange?: (newDataUrl: string) => any
  imageRef?: React.RefCallback<HTMLImageElement>
  onProcessing?: (processing: boolean) => any
  disabled?: boolean
  label?: string
}

const appIconEditorClassPrefix = "AppIconEditor"
export const appIconEditorClasses = createClassNames(
    appIconEditorClassPrefix,
    "root",
    "disabled",
    "input",
    "overlay",
    "overlayIcon",
    "label",
    "icon",
    "iconContainer"
)
export type AppIconEditorClassKey = ClassNamesKey<
    typeof appIconEditorClasses
>
const AppIconEditorRoot = styled<typeof Box>(Box, {
  name: appIconEditorClassPrefix,
  label: appIconEditorClassPrefix
})(({ theme }) => ({
  [hasCls(appIconEditorClasses.root)]: {
    ...PositionRelative,
    ...FlexColumnCenter,
    ...CursorPointer,
    // ...OverflowHidden,
    
    [hasCls(appIconEditorClasses.disabled)]: {
      [child(appIconEditorClasses.iconContainer)]: {
        "&::after": {
          pointerEvents: "none",
          opacity: 0.2
        }
      }
    },
    [child(appIconEditorClasses.input)]: {
      // display: "none"
      ...PositionAbsolute,
      ...FillBounds,
      ...CursorPointer,
      opacity: 0,
      zIndex: 4,
      
    },
    
    [child(appIconEditorClasses.iconContainer)]: {
      ...PositionRelative,
      ...FlexAuto,
      ...CursorPointer,
      filter: "drop-shadow(0px 5px 5px rgba(0,0,0, 0.25))",
      borderRadius: theme.shape.borderRadius,
      backgroundColor: `rgba(0,0,0,0.1)`,
      pointerEvents: "none",
      
      [child(appIconEditorClasses.overlay)]: {
        ...PositionAbsolute,
        ...FillBounds,
        ...FlexColumnCenter,
        borderRadius: theme.shape.borderRadius,
        backgroundColor: `rgba(0,0,0,0.0)`,
        transition: theme.transitions.create(["opacity","background-color"]),
        pointerEvents: "none",
        opacity: 0,
        zIndex: 2,
        
        [child(appIconEditorClasses.overlayIcon)]: {
          // transform: "translate(25%,25%)"
          border: "0.3rem dashed rgba(255,255,255,0.35)",
          padding: theme.spacing(8),
          borderRadius: theme.shape.borderRadius,
        },
        
        [child(appIconEditorClasses.label)]: {
          ...PositionAbsolute,
          left: "50%",
          top: "50%",
          zIndex: 2,
          transform: "translate(-50%,-50%)"
        }
      },
      
      [child(appIconEditorClasses.icon)]: {
        ...OverflowHidden,
        objectFit: "contain",
        borderRadius: theme.shape.borderRadius,
      },
      
      "&::after": {
        ...PositionAbsolute,
        ...Fill,
        ...OverflowHidden,
        ...CursorPointer,
        content: "' '",
        pointerEvents: "none",
        opacity: 0,
        zIndex: 3,
        backgroundColor: "black",
        borderRadius: theme.shape.borderRadius,
        transition: theme.transitions.create("opacity")
      }
    },
    
    "&:hover": {
      ...CursorPointer,
      [`& .${appIconEditorClasses.iconContainer}`]: {
        backgroundColor: `rgba(0,0,0,0.15)`,
        [`& .${appIconEditorClasses.overlay}`]: {
          opacity: 1,
          color: "white",
          backgroundColor: `rgba(0,0,0,0.65)`,
        }
      }
    }
  }
}))

/**
 * Determine the icon url
 *
 * @param icon
 */
function getIconUrl(icon: UIImageResource | AppIconKind) {
  let iconUrl = match(icon)
      .when(
          Predicate.of(isString).or(icon => ImageExt.isPresetUrl(icon.url)),
          icon => {
            const presetIcon = capitalize(
                isString(icon) ? icon : ImageExt.getPresetUrlPathname(icon.url)
            )
            
            let Component: AppBuiltinIconComponent = AppBuiltinIcons[presetIcon]
            if (!Component) {
              warning(!Component, `Invalid project icon name (${presetIcon})`)
              Component = AppBuiltinIcons.Code
            }
            return Component.iconUrl
          }
      )
      .when(isObject, get("url"))
      .otherwise(() => null)
  
  if (isEmpty(iconUrl)) {
    iconUrl = null
  }
  return iconUrl
}

export const AppIconEditor = React.forwardRef<
    HTMLDivElement,
    AppIconEditorProps
>(function AppIconEditor(
    {
      icon,
      label,
      className,
      disabled = false,
      size = "xl",
      imageRef: imageRefArg,
      editable = false,
      onChange,
      onProcessing,
      ...imgProps
    },
    ref
) {
  const iconUrlArg = getIconUrl(icon),
      [iconUrl, setIconUrl] = useState<string>(iconUrlArg),
      [imageElem, setImageElem] = useState<HTMLImageElement>(null),
      [uploadFileRef, setUploadFileRef] = useState<HTMLInputElement>(),
      [isProcessing, setProcessing] = useState(false),
      // onClick = useCallback(
      //   (e: React.SyntheticEvent) => {
      //     !isProcessing && (uploadFileRef as any)?.click(e.nativeEvent)
      //     // e.preventDefault()
      //     e.stopPropagation()
      //     return false
      //   },
      //   [uploadFileRef]
      // ),
      imageRef = useCallback(
          (elem: HTMLImageElement) => {
            setImageElem(elem)
            imageRefArg?.(elem)
          },
          [imageRefArg, setImageElem]
      ),
      processFileList = (list: FileList | DataTransfer) => {
        if (isProcessing) {
          warn(`Already processing`)
          return
        }
        
        setProcessing(true)
        const file = (list as any)?.item?.(0) as File
        if (!file) {
          warn(`Did not find matching file`)
          return
        }
        
        fileToDataURL<string>(file)
            .then(
                newIconUrl => {
                  setIconUrl(newIconUrl)
                  debug(`Icon URL has changed from`, iconUrl, "to", newIconUrl)
                  onChange?.(newIconUrl)
                },
                err => {
                  error(`Unable to get data url from file`, err)
                }
            )
            .finally(() => {
              setProcessing(false)
            })
      },
      onDrop = useCallback(
          (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault()
            processFileList(e.dataTransfer)
            
            // const item = e.dataTransfer?.items?.[0]
            // if (!/^image\//.test(item?.type)) {
            //   warn(`Only supports dropping images.  You dropped (${item?.type})`)
            //   return
            // }
            
            // const file = e.dataTransfer?.files?.item?.(0)
            // if (!file) {
            //   warn(`Did not find matching file`)
            //   return
            // }
            
            // fileToDataURL<string>(file).then(
            //   newIconUrl => {
            //     setIconUrl(newIconUrl)
            //     debug(`Icon URL has changed from`, iconUrl, "to", newIconUrl)
            //     onChange?.(newIconUrl)
            //   },
            //   err => {
            //     error(`Unable to get data url from file`, err)
            //   }
            // )
          },
          [setIconUrl]
      ),
      onDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        debug("onDragEnter: %O", e.dataTransfer)
      }, []),
      onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        debug("onDragOver: %O", e.dataTransfer)
      }, []),
      onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        debug("onDragLeave: %O", e.dataTransfer)
      }, []),
      onUploadFileChange = useCallback(
          (e: React.ChangeEvent<HTMLInputElement>) => {
            processFileList(uploadFileRef?.files)
          },
          [uploadFileRef, setIconUrl]
      )
  
  // Update the element owner that a
  // new icon is being processed
  useEffect(() => {
    onProcessing?.(isProcessing)
  }, [isProcessing, onProcessing])
  
  // Update the icon url on value change
  useEffect(() => {
    if (iconUrlArg !== iconUrl) {
      setIconUrl(iconUrlArg)
    }
  }, [iconUrlArg])
  
  return (
      <AppIconEditorRoot
          ref={ref}
          onDrop={onDrop}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDragOver={onDragOver}
          className={clsx(appIconEditorClasses.root, {
            [appIconEditorClasses.disabled]: disabled
          })}
      >
        {label && <InputLabel sx={{
          alignSelf: "flex-start"
        }}>
          {label} Icon
        </InputLabel>}
        <Box
            className={appIconEditorClasses.iconContainer}
            sx={theme => {
              const sizes = theme.dimen.appIconSizes
              return {
                ...dimensionConstraints(
                    size === "sm"
                        ? sizes[0]
                        : size === "md"
                            ? sizes[1]
                            : size === "lg"
                                ? sizes[2]
                                : sizes[3]
                )
              }
            }}
        >
          <AppIconRoot
              ref={imageRef}
              src={iconUrl}
              className={clsx(
                  appIconClasses.root,
                  appIconEditorClasses.icon,
                  appIconClasses[size],
                  className
              )}
              {...imgProps}
          />
          
          {/* OVERLAY */}
          <Box className={appIconEditorClasses.overlay}>
            <AppFAIcon
                className={appIconEditorClasses.overlayIcon}
                size="3x"
                icon={faCircleCamera}
            />
          </Box>
        </Box>
        {/* FILE INPUT */}
        <input
            type="file"
            disabled={disabled}
            ref={setUploadFileRef}
            className={appIconEditorClasses.input}
            onChangeCapture={onUploadFileChange}
            accept="image/png, image/jpeg, image/svg"
        />
      </AppIconEditorRoot>
  )
})

export default AppIconEditor
