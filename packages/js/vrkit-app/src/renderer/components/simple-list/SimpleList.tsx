// REACT
import React, { ReactElement, useCallback, useMemo, useState } from "react"

// CLSX
import clsx from "clsx"

// 3FV
import { getLogger } from "@3fv/logger-proxy"

// MUI
import Box, { type BoxProps } from "@mui/material/Box"
import { styled } from "@mui/material/styles"

// APP
import {
  child,
  ClassNamesKey,
  createClassNames,
  FlexAuto, FlexColumn,
  FlexProperties,
  hasCls,
  OverflowHidden
} from "@vrkit-platform/shared-ui"
import { KeysWithValueType } from "@vrkit-platform/shared"
import { isFunction, isString } from "@3fv/guard"
import { match } from "ts-pattern"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const classPrefix = "simpleList"
export const simpleListClasses = createClassNames(classPrefix, "root", "item", "itemSelected")
const classes = simpleListClasses

export type SimpleListClassKey = ClassNamesKey<typeof simpleListClasses>

const SimpleListRoot = styled(Box, {
  name: "SimpleListRoot",
  label: "SimpleListRoot"
})(
  ({
    theme: {
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
    }
  }) => ({
    // root styles here
    [hasCls(classes.root)]: {
      ...OverflowHidden,
      ...FlexAuto,
      ...FlexColumn,

      transition: transitions.create([...FlexProperties]),

      [child(classes.item)]: {
        [hasCls(classes.itemSelected)]: {}
      }
    }
  })
)

export type SimpleListItemProps<T, ExtraProps extends {} = {}> = {
  key: string
  item: T
  className?: string
  selected?: boolean
  onSelect: (id: string) => any
} & ExtraProps

export type SimpleListItemIdProp<T> = KeysWithValueType<T, string>

/**
 * SimpleList Component Properties
 */
export interface SimpleListProps<T, ExtraProps extends {}  = {}> extends BoxProps {
  items: T[]
  itemIdProp: SimpleListItemIdProp<T> | ((item:T) => string)
  itemComponent: React.ElementType<SimpleListItemProps<T,ExtraProps>> | React.ComponentType<SimpleListItemProps<T,ExtraProps>>
  itemExtraProps?: ExtraProps
  selectedId?: string
  
  onItemSelect?: (id: string) => any
}

/**
 * SimpleList Component
 *
 * @param { SimpleListProps } props
 */
export function SimpleList<T, ExtraProps extends {} = {}>(props: SimpleListProps<T, ExtraProps>) {
  const { className, items, itemIdProp, itemComponent,
        onItemSelect,
        itemExtraProps = {},
        selectedId: selectedIdIn,
        ...other } = props,
      isControlled = isString(selectedIdIn),
      [localSelectedId, setLocalSelectedId] = useState<string>(""),
      selectedId = useMemo(() => {
        return isControlled ? selectedIdIn : localSelectedId
      }, [selectedIdIn, localSelectedId, isControlled]),
      onSelect = useCallback((id: string) => {
        match(isControlled)
            .with(true, () => {
        log.assert(isFunction(onItemSelect), "Controlled selection requires onItemSelect property")
          onItemSelect(id)
          
        })
            .otherwise(() => setLocalSelectedId(id))
          
      }, [isControlled, onItemSelect]),
      renderItem = useCallback((item: T, itemId: string, selected: boolean) => {
        const itemProps = {key: itemId, item, selected, onSelect, className: classes.item, ...itemExtraProps } as SimpleListItemProps<T,ExtraProps>
        if (isFunction(itemComponent)) {
          const renderItem = itemComponent as React.FC<SimpleListItemProps<T,ExtraProps>>
          return renderItem(itemProps)
        } else {
          const ItemComponent = itemComponent as unknown as React.ComponentType<SimpleListItemProps<T,ExtraProps>>
          return <ItemComponent {...itemProps}/>
        }
      }, [itemComponent, onSelect])

  return (
    <SimpleListRoot
      className={clsx(classes.root, {
        [classes.itemSelected]: !!localSelectedId
      }, className)}
      {...other}
    >
      {items.map((item) => {
        const itemId: string = isFunction(itemIdProp) ?
            itemIdProp(item) : item[itemIdProp] as string
            
        return renderItem(item, itemId, itemId === selectedId)
      })}
    </SimpleListRoot>
  )
}

export default SimpleList
