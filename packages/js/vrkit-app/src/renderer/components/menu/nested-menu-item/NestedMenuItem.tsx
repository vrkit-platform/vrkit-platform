import React, {
	useState,
	useRef,
	useImperativeHandle, HTMLAttributes
} from "react"

// CUSTOM COMPONENTS
import { IconMenuItem } from './IconMenuItem'

// MUI
import { Menu } from '@mui/material'
import type {
	MenuItemProps as MuiMenuItemProps
} from "@mui/material/MenuItem/MenuItem"

// MUI ICONS
import ArrowRight from '@mui/icons-material/ChevronRightRounded'

export interface NestedMenuItemProps extends MuiMenuItemProps {
	leftIcon?: React.ReactNode
	rightIcon?: React.ReactNode
	label?: React.ReactNode | string
	onClick?: React.MouseEventHandler<any>
	MenuItemProps?: MuiMenuItemProps
	className?: string
	parentMenuOpen?: boolean
	ContainerProps?: HTMLAttributes<HTMLDivElement> & {
		ref?: React.Ref<HTMLDivElement>
	}
}

// export type NestedMenuItemRefType =

export const NestedMenuItem = React.forwardRef<HTMLLIElement, NestedMenuItemProps>(function NestedMenuItem(props, ref) {
	const {
		parentMenuOpen,
		label,
		rightIcon = <ArrowRight />,
		leftIcon = null,
		children,
		className,
		tabIndex: tabIndexRequested,
		ContainerProps = {},
		...MenuItemProps
	} = props

	const { ref: containerExternalRef, ...containerHTMLProps } = ContainerProps

	const menuItemRef = useRef<HTMLLIElement>(null)
	useImperativeHandle(ref, () => menuItemRef.current)

	const containerRef = useRef<HTMLDivElement>(null)
	useImperativeHandle(containerExternalRef, () => containerRef.current)

	const menuContainerRef = useRef(null)

	const [isSubMenuOpen, setIsSubMenuOpen] = useState(false)

	const handleMouseEnter = (event) => {
		setIsSubMenuOpen(true)

		if (ContainerProps.onMouseEnter) {
			ContainerProps.onMouseEnter(event)
		}
	}
	const handleMouseLeave = (event) => {
		setIsSubMenuOpen(false)

		if (ContainerProps.onMouseLeave) {
			ContainerProps.onMouseLeave(event)
		}
	}

	// Check if any immediate children are active
	const isSubmenuFocused = () => {
		const active = containerRef.current.ownerDocument.activeElement
		for (const child of menuContainerRef.current.children) {
			if (child === active) {
				return true
			}
		}
		return false
	}

	const handleFocus = (event) => {
		if (event.target === containerRef.current) {
			setIsSubMenuOpen(true)
		}

		if (ContainerProps.onFocus) {
			ContainerProps.onFocus(event)
		}
	}

	const handleKeyDown = (event) => {
		if (event.key === 'Escape') {
			return
		}

		if (isSubmenuFocused()) {
			event.stopPropagation()
		}

		const active = containerRef.current.ownerDocument.activeElement

		if (event.key === 'ArrowLeft' && isSubmenuFocused()) {
			containerRef.current.focus()
		}

		if (
			event.key === 'ArrowRight' &&
			event.target === containerRef.current &&
			event.target === active
		) {
			const firstChild = menuContainerRef.current.children[0]
			firstChild.focus()
		}
	}

	const open = isSubMenuOpen && parentMenuOpen

	// Root element must have a `tabIndex` attribute for keyboard navigation
	let tabIndex
	if (!props.disabled) {
		tabIndex = tabIndexRequested !== undefined ? tabIndexRequested : -1
	}

	return (
		<div
			{...ContainerProps}
			ref={containerRef}
			onFocus={handleFocus}
			tabIndex={tabIndex}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
			onKeyDown={handleKeyDown}
		>
			<IconMenuItem {...{
				MenuItemProps,
				className,
				ref: menuItemRef,
				leftIcon,
				rightIcon,
				label,
			}}/>

			<Menu
				// Set pointer events to 'none' to prevent the invisible Popover div
				// from capturing events for clicks and hovers
				style={{ pointerEvents: 'none' }}
				anchorEl={menuItemRef.current}
				anchorOrigin={{
					vertical: 'top',
					horizontal: 'right',
				}}
				transformOrigin={{
					vertical: 'top',
					horizontal: 'left',
				}}
				open={open}
				autoFocus={false}
				disableAutoFocus
				disableEnforceFocus
				onClose={() => {
					setIsSubMenuOpen(false)
				}}
			>
				<div ref={menuContainerRef} style={{ pointerEvents: 'auto' }}>
					{children}
				</div>
			</Menu>
		</div>
	)
})
