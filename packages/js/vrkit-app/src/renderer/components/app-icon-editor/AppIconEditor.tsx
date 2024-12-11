// REACT
import React, { useCallback, useEffect, useState } from "react"
import {useDropzone} from "react-dropzone"
// CLSX
import clsx from "clsx"

// 3FV
import { getLogger } from "@3fv/logger-proxy"

// MUI
import Box from "@mui/material/Box"
import { styled } from "@mui/material/styles"

// APP
import {
  child,
  ClassNamesKey,
  createClassNames,
  CursorPointer,
  dimensionConstraints,
  Fill,
  FillBounds,
  FlexAuto,
  FlexColumnCenter,
  hasCls,
  OverflowHidden,
  PositionAbsolute,
  PositionRelative,
  rem
} from "vrkit-shared-ui"
import {
  AppBuiltinIconComponent,
  AppBuiltinIcons,
  AppFAIcon,
  appIconClasses,
  AppIconKind,
  AppIconProps,
  AppIconRoot
} from "../app-icon"
import { UIImageResource } from "vrkit-models"
import { match } from "ts-pattern"
import { Predicate } from "@3fv/prelude-ts"
import { isObject, isString } from "@3fv/guard"
import { faUpload } from "@awesome.me/kit-79150a3eed/icons/duotone/solid"
import { ImageExt, isEmpty, isURL } from "vrkit-shared"
import { capitalize } from "lodash"
import warning from "warning"
import { get } from "lodash/fp"
import { fileToDataURL } from "../../utils"
import { InputLabel } from "@mui/material"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

export interface AppIconEditorProps extends Omit<AppIconProps, "onChange"> {
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
export type AppIconEditorClassKey = ClassNamesKey<typeof appIconEditorClasses>
const AppIconEditorRoot = styled<typeof Box>(Box, {
  name: appIconEditorClassPrefix,
  label: appIconEditorClassPrefix
})(({ theme }) => ({
  [hasCls(appIconEditorClasses.root)]: {
    ...PositionRelative,
    ...FlexColumnCenter,
    ...CursorPointer,

    ...OverflowHidden,
    

    [hasCls(appIconEditorClasses.disabled)]: {
      [child(appIconEditorClasses.iconContainer)]: {
        // "&::after": {
        //   // pointerEvents: "none",
        //   opacity: 0.2
        // }
      }
    },
    [child(appIconEditorClasses.input)]: {
      // display: "none"
      // ...PositionAbsolute,
      // ...FillBounds,
      // ...CursorPointer,
      // opacity: 0,
      // zIndex: 4,
      // display: "none"
    },

    [child(appIconEditorClasses.iconContainer)]: {
      ...PositionRelative,
      ...FlexAuto,
      // ...CursorPointer,
      // filter: "drop-shadow(0px 5px 5px rgba(0,0,0, 0.25))",
      borderRadius: theme.shape.borderRadius,
      backgroundColor: `rgba(0, 0, 0, 0.1)`,
      pointerEvents: "none",

      [child(appIconEditorClasses.overlay)]: {
        // ...PositionAbsolute,
        // ...FillBounds,
        ...FlexColumnCenter,
        borderRadius: theme.shape.borderRadius,
        backgroundColor: `rgba(0, 0, 0, 0.0)`,
        transition: theme.transitions.create(["opacity", "background-color"]),
        // pointerEvents: "none",
        opacity: 0,
        zIndex: 2,

        [child(appIconEditorClasses.overlayIcon)]: {
          // transform: "translate(25%,25%)"
          // border: "0.3rem dashed rgba(255,255,255,0.35)",
          // padding: theme.spacing(8),
          borderRadius: theme.shape.borderRadius
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
        borderRadius: theme.shape.borderRadius
      },

      // "&::after": {
      //   ...PositionAbsolute,
      //   ...Fill,
      //   ...OverflowHidden,
      //   ...CursorPointer,
      //   content: "' '",
      //   // pointerEvents: "none",
      //   opacity: 0,
      //   zIndex: 3,
      //   backgroundColor: "black",
      //   borderRadius: theme.shape.borderRadius,
      //   transition: theme.transitions.create("opacity")
      // }
    },

    "&:hover": {
      ...CursorPointer,
      [child(appIconEditorClasses.iconContainer)]: {
        backgroundColor: `rgba(0, 0, 0, 0.15)`,
        [child(appIconEditorClasses.overlay)]: {
          opacity: 1,
          color: "white",
          backgroundColor: `rgba(0, 0, 0, 0.85)`
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
function getIconUrl(icon: UIImageResource | AppIconKind | string): string {
  if (!icon || (isString(icon) && isURL(icon) && !ImageExt.isPresetUrl(icon))) {
    return icon as string
  }

  let iconUrl = match(icon)
    .when(
      Predicate.of(isString).or(icon => ImageExt.isPresetUrl(icon.url)),
      icon => {
        const presetIcon = capitalize(isString(icon) ? icon : ImageExt.getPresetUrlPathname(icon.url))

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

// export const AppIconEditor = React.forwardRef<HTMLDivElement, AppIconEditorProps>(function AppIconEditor(
//   {
//     icon,
//     label,
//     className,
//     disabled = false,
//     size = "xl",
//     imageRef: imageRefArg,
//     editable = false,
//     onChange,
//     onProcessing,
//     ...imgProps
//   },
//   ref
// ) {
export function AppIconEditor(
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
    }:AppIconEditorProps
) {
  
  const iconUrlArg = getIconUrl(icon),
    [iconUrl, setIconUrl] = useState<string>(iconUrlArg),
    [imageElem, setImageElem] = useState<HTMLImageElement>(null),
    [uploadFileRef, setUploadFileRef] = useState<HTMLInputElement>(),
    [isProcessing, setProcessing] = useState(false),
    imageRef = useCallback(
      (elem: HTMLImageElement) => {
        setImageElem(elem)
        imageRefArg?.(elem)
      },
      [imageRefArg, setImageElem]
    ),
    processFileList = (listOrFile: File | FileList | DataTransfer) => {
      if (isProcessing) {
        warn(`Already processing`)
        return
      }

      setProcessing(true)
      const file = listOrFile instanceof File ? listOrFile : (listOrFile as any)?.item?.(0) as File
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
      // (e: React.DragEvent<HTMLDivElement>) => {
        (files:File[]) => {
        info("drop", files)
        // e.preventDefault()
        processFileList(files[0])
      },
      [setIconUrl]
    ),
   { getRootProps, getInputProps, isDragActive, isDragReject, fileRejections } = useDropzone({
    onDrop,
     multiple: false,
    disabled,
    accept: { 'image/*': [] },
  }),
  
  onDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      info("onDragEnter: %O", e.dataTransfer)
    }, []),
    onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      info("onDragOver: %O", e.dataTransfer)
    }, []),
    onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      info("onDragLeave: %O", e.dataTransfer)
    }, []),
    onDragStart = useCallback((e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      info("onDragStart: %O", e.dataTransfer)
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
  // onDrop={onDrop}
  //           onDragEnter={onDragEnter}
  //           onDragLeave={onDragLeave}
  //           onDragOver={onDragOver}

  // useEffect(() => {
  //   const pairs = Array<[keyof GlobalEventHandlersEventMap, React.EventHandler<any>]>(
  //     ["drop", onDrop],
  //     ["dragstart",onDragStart],
  //       ["dragenter", onDragEnter],
  //     ["dragleave", onDragLeave],
  //     ["dragover", onDragOver]
  //   )
  //   pairs.forEach(([name, handler]) => {
  //     document.addEventListener(name, handler, true)
  //   })
  //   return () => {
  //     pairs.forEach(([name, handler]) => {
  //       document.removeEventListener(name, handler)
  //     })
  //   }
  // }, [onDrop, onDragEnter, onDragLeave, onDragOver])
  return (
      // <div {...getRootProps()}>
      //   <input {...getInputProps()} />
      //   {isDragActive ?
      //       <p>Drop the files here ...</p> :
      //       <p>Drag 'n' drop some files here, or click to select files</p>}
      // </div>
      <AppIconEditorRoot
        // onDrop={onDrop}
        // onDragEnter={onDragEnter}
        // onDragLeave={onDragLeave}
        // onDragOver={onDragOver}
        {...getRootProps()}
        className={clsx(appIconEditorClasses.root, {
          [appIconEditorClasses.disabled]: disabled
        })}
      >
        <span>{isDragActive ? "Active" : "Inactive"} Drag</span>
        <span>{fileRejections.map(it => it.file.name).join("||")} Rejected</span>
        {label && (
          <InputLabel
            sx={{
              alignSelf: "flex-start"
            }}
          >
            {label} Icon
          </InputLabel>
        )}
        <Box
          className={appIconEditorClasses.iconContainer}
          sx={{ ...dimensionConstraints(rem(2.5)) }}
          // sx={theme => {
          //   const sizes = theme.dimen.appIconSizes
          //   return {
          //     ...dimensionConstraints(
          //         size === "sm"
          //             ? sizes[0]
          //             : size === "md"
          //                 ? sizes[1]
          //                 : size === "lg"
          //                     ? sizes[2]
          //                     : sizes[3]
          //     )
          //   }
          // }}
        >
          <AppIconRoot
            ref={imageRef}
            src={iconUrl}
            sx={{ ...dimensionConstraints(rem(2.5)) }}
            className={clsx(
              appIconClasses.root,
              appIconEditorClasses.icon,
              // appIconClasses[size],
              className
            )}
            {...imgProps}
          />

          {/* OVERLAY */}
          <Box className={appIconEditorClasses.overlay}>
            <AppFAIcon
              className={appIconEditorClasses.overlayIcon}
              icon={faUpload}
            />
          </Box>
        </Box>
        {/* FILE INPUT */}
        <input
          // type="file"
          //disabled={disabled}
          // ref={setUploadFileRef}
          // className={appIconEditorClasses.input}
          //onChangeCapture={onUploadFileChange}
          //accept="image/png, image/jpeg, image/svg"
          {...getInputProps()}
        />
      </AppIconEditorRoot>
  )
}

export default AppIconEditor
