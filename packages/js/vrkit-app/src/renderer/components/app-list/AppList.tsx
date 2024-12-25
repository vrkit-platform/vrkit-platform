import { isFunction } from "@3fv/guard"
import { getLogger } from "@3fv/logger-proxy"
import AddIcon from "@mui/icons-material/Add"
import RemoveIcon from "@mui/icons-material/Remove"
import EditIcon from "@mui/icons-material/Edit"
import { Box, List, SxProps } from "@mui/material"
import { styled, Theme } from "@mui/material/styles"
import {
  child,
  ClassNamesKey,
  createClassNames,
  FlexAuto,
  FlexColumn,
  FlexScaleZero,
  flexAlign,
  PositionRelative
} from "@vrkit-platform/shared-ui/styles"
import { propEqualTo } from "@vrkit-platform/shared/utils"
import React, { useCallback, useRef } from "react"
import { ListNavHelper } from "@vrkit-platform/shared-ui"
import ListActionFooter from "../list-action-footer"
import ListActionFooterButton from "../list-action-footer-button"
import { AppListItemProps } from "./AppListItem"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const listBorder = `1px solid rgba(0, 0, 0, 0.23)`

const classPrefix = "AppList"
export const appListClasses = createClassNames(classPrefix, "item", "toolbar")
export type AppListClassKey = ClassNamesKey<typeof appListClasses>

const AppListRoot = styled<typeof Box>(Box)(({ theme }) => ({
  ...FlexColumn,
  ...PositionRelative,
  ...FlexScaleZero,
  ...flexAlign("center", "stretch"),
  background: theme.palette.background.filledInput,
  borderRadius: theme.shape.borderRadius,
  border: listBorder,

  [child(appListClasses.item)]: {},
  [child(appListClasses.toolbar)]: {
    ...FlexAuto,

    alignSelf: "stretch",
    alignItems: "center"
  }
}))

export type RenderAppListItemProps<
  T extends {},
  IdProp extends keyof T = keyof T
> = Pick<AppListItemProps<T, IdProp>, "value" | "idProp" | "selected"> & {
  key: string
  index: number
  onSelect: React.EventHandler<any>
}

export interface AppListProps<T extends {}, IdProp extends keyof T = keyof T> {
  // extends ListProps {
  id: string
  idProp: IdProp
  value: T
  items: T[]
  className?: string
  sx?: SxProps<Theme>
  onAdd?: (e: React.SyntheticEvent) => any
  onEdit?: (value: T, e: React.SyntheticEvent) => any
  onRemove?: (value: T, e: React.SyntheticEvent) => any
  onChange: (value: T) => any
  renderItem: (itemProps: RenderAppListItemProps<T, IdProp>) => React.ReactNode
}

export function AppList<T extends {}, IdProp extends keyof T = keyof T>({
  id,
  idProp,
  value: selectedValue,
  onAdd: propOnAdd,
  onRemove: propOnRemove,
  onEdit: propOnEdit,
  onChange,
  items,
  renderItem,
  ...other
}: AppListProps<T, IdProp>) {
  const selectedValueId = selectedValue?.[idProp],
    selectedItem = items.find(propEqualTo(idProp, selectedValueId)),
    listRef = useRef<HTMLUListElement>(null),
    handleSelect = useCallback(
      (newValue: T) =>
        (() => {
          onChange(newValue)
        }) as React.EventHandler<any>,
      [onChange]
    ),
    onListMove = ListNavHelper.handleElementWithDataAttribute(
      "data-item-id",
      (newSelectedId, event) => {
        //setFocusedId(nextId)
        if ([" ", "Space", "Enter"].includes(event.key)) {
          const newSelectedItem = items.find(
            propEqualTo(idProp, newSelectedId as any)
          )
          onChange(newSelectedItem)
        }
      }
    ),
    handleKeyDown = ListNavHelper.handleKeyDown(listRef, onListMove),
    onAdd = useCallback(
      (e: React.SyntheticEvent<any>) => {
        propOnAdd?.(e)
      },
      [propOnAdd]
    ),
    onEdit = useCallback(
      (e: React.SyntheticEvent<any>) => {
        propOnEdit?.(selectedItem, e)
      },
      [propOnEdit]
    ),
    onRemove = useCallback(
      (e: React.SyntheticEvent<any>) => {
        if (selectedItem) propOnRemove?.(selectedItem, e)
      },
      [propOnRemove, selectedItem]
    )

  return (
    <AppListRoot {...other}>
      <List
        onKeyDown={handleKeyDown}
        ref={listRef}
        sx={theme => ({
          ...FlexScaleZero,
          ...PositionRelative,

          justifySelf: "stretch",
          alignSelf: "stretch",
          mx: 0,
          my: 0
        })}
      >
        {items.map((value, index) => {
          const id = value[idProp],
            selected = id === selectedValueId

          return renderItem({
            value,
            selected,
            key: `item-${id}`,
            idProp,
            onSelect: handleSelect(value),
            index
          })
        })}
      </List>

      {[propOnAdd, propOnRemove].some(isFunction) && (
        <ListActionFooter className={appListClasses.toolbar}>
          {propOnAdd && (
            <ListActionFooterButton onClick={onAdd}>
              <AddIcon />
            </ListActionFooterButton>
          )}
          {propOnEdit && (
            <ListActionFooterButton disabled={!selectedItem} onClick={onEdit}>
              <EditIcon />
            </ListActionFooterButton>
          )}
          {propOnRemove && (
            <ListActionFooterButton onClick={onRemove}>
              <RemoveIcon />
            </ListActionFooterButton>
          )}
          <Box sx={{ ...FlexScaleZero }} />
        </ListActionFooter>
      )}
    </AppListRoot>
  )
}
