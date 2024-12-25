// REACT
import React from "react"

// CLSX

// 3FV
import { getLogger } from "@3fv/logger-proxy"

// MUI
import { lighten, styled } from "@mui/material/styles"
import type { Theme } from "@mui/material"
import MuiPopper, { PopperProps as MuiPopperProps } from "@mui/material/Popper"

// APP
import { ClassNamesKey, createClassNames } from "@vrkit-platform/shared-ui/styles"
import { PopperProps } from "@mui/material/Popper/Popper"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const classPrefix = "PopoverMenu"
export const PopoverMenuClasses = createClassNames(classPrefix, "root")
export type PopoverMenuClassKey = ClassNamesKey<typeof PopoverMenuClasses>

/**
 * PopoverMenu Component Properties
 */
export interface PopoverMenuProps extends MuiPopperProps {
  arrow?: boolean
  anchorRef: React.RefObject<HTMLElement> | HTMLElement
}


/**
 * Simplifies the addition of the arrow prop (from mui docs)
 *
 * @type {React.ForwardRefExoticComponent<PopperProps & {arrow?:boolean} &
 *   React.RefAttributes<HTMLDivElement>>}
 */
const MuiCustomPopper = MuiPopper as React.ForwardRefExoticComponent<
  MuiPopperProps & { arrow?: boolean } & React.RefAttributes<HTMLDivElement>
>

const arrowDim = "1rem"

/**
 * Customized popper
 *
 * @type {StyledComponent<PropsOf<React.ForwardRefExoticComponent<PopperProps &
 *   {arrow?:boolean} & React.RefAttributes<HTMLDivElement>>> &
 *   MUIStyledCommonProps<Theme>, {}, {}>}
 */
const PopperRoot = styled(MuiCustomPopper, {
  shouldForwardProp: prop => prop !== "arrow"
})(({ theme, arrow }) => {
  const arrowBorderColor = lighten(theme.palette.background.paper, 0.1),
    {spacing, palette} = theme
    
  
  return {
    zIndex: theme.zIndex.appBar + 1,
    
    "& > div": {
      position: "relative"
    },
    '&[data-popper-placement*="bottom"]': {
      "& > div, & > ul": {
        marginTop: arrow ? arrowDim : 0
      },
      "& .MuiPopper-arrow": {
        top: `calc(${arrowDim} * -1)`,
        left: spacing(2),
        width: "3rem",
        height: arrowDim,
        "&::before": {
          borderWidth: "0 1rem 1rem 1rem",
          borderColor: `transparent transparent ${arrowBorderColor} transparent`
        }
      }
    },
    '&[data-popper-placement*="top"]': {
      "& > div": {
        marginBottom: arrow ? arrowDim : 0
      },
      "& .MuiPopper-arrow": {
        bottom: `calc(${arrowDim} * -1)`,
        left: 0,
        width: "3rem",
        height: arrowDim,
        "&::before": {
          borderWidth: "1rem 1rem 0 1rem",
          borderColor: `${arrowBorderColor} transparent transparent transparent`
        }
      }
    },
    '&[data-popper-placement*="right"]': {
      "& > div": {
        marginLeft: arrow ? arrowDim : 0
      },
      "& .MuiPopper-arrow": {
        left: `calc(${arrowDim} * -1)`,
        height: "3rem",
        width: arrowDim,
        "&::before": {
          borderWidth: "1rem 1rem 1rem 0",
          borderColor: `transparent ${arrowBorderColor} transparent transparent`
        }
      }
    },
    '&[data-popper-placement*="left"]': {
      "& > div": {
        marginRight: arrow ? arrowDim : 0
      },
      "& .MuiPopper-arrow": {
        right: `calc(${arrowDim} * -1)`,
        height: "3rem",
        width: arrowDim,
        "&::before": {
          borderWidth: "1rem 0 1rem 1rem",
          borderColor: `transparent transparent transparent ${arrowBorderColor}`
        }
      }
    }
  }
})

const Arrow = styled("div")(({theme}) => ({
  position: "absolute",
  fontSize: 7,
  zIndex: theme.zIndex.modal + 1,
  width: "3rem",
  height: "3rem",
  "&::before": {
    content: '""',
    margin: "auto",
    display: "block",
    width: 0,
    height: 0,
    borderStyle: "solid"
  }
}))

/**
 * PopoverMenu Component
 *
 * @param { PopoverMenuProps } props
 * @returns {JSX.Element}
 */
export const PopoverMenu = React.forwardRef<HTMLDivElement,PopoverMenuProps>(function PopoverMenu(props: PopoverMenuProps, ref) {
  const {
      arrow = false,
      children,
      id,
      open,
      anchorRef,
      placement = "bottom",
      ...other
    } = props,
    [arrowRef, setArrowRef] = React.useState(null)

  return (
    <PopperRoot
      id={id}
      ref={ref}
      open={open}
      arrow={arrow}
      anchorEl={
        anchorRef instanceof HTMLElement ? anchorRef : anchorRef?.current
      }
      placement={placement}
      // disablePortal={disablePortal}
      modifiers={[
        // {
        //   name: 'flip',
        //   enabled: flip.enabled,
        //   options: {
        //     altBoundary: flip.altBoundary,
        //     rootBoundary: flip.rootBoundary,
        //     padding: 8,
        //   },
        // },
        // {
        //   name: 'preventOverflow',
        //   enabled: preventOverflow.enabled,
        //   options: {
        //     altAxis: preventOverflow.altAxis,
        //     altBoundary: preventOverflow.altBoundary,
        //     tether: preventOverflow.tether,
        //     rootBoundary: preventOverflow.rootBoundary,
        //     padding: 8,
        //   },
        // },
        {
          name: "arrow",
          enabled: arrow,
          options: {
            element: arrowRef
          }
        }
      ]}
      {...other}
    >
      {arrow ? <Arrow ref={setArrowRef} className="MuiPopper-arrow" /> : null}

      {children as any}
    </PopperRoot>
  )
})

export default PopoverMenu
