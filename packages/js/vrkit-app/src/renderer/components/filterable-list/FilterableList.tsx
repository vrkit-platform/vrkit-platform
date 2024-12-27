// REACT
import React, { useState } from "react"

// CLSX
import clsx from "clsx"

// 3FV
import { getLogger } from "@3fv/logger-proxy"

// MUI
import SearchIcon from "@mui/icons-material/Search"
import Box, { type BoxProps } from "@mui/material/Box"
import { darken, lighten, styled } from "@mui/material/styles"

// APP
import {
  child,
  ClassNamesKey,
  createClassNames,
  FillWidth,
  flexAlign,
  FlexAuto,
  FlexColumn,
  FlexRow,
  FlexScaleZero,
  hasCls,
  OverflowHidden, padding,
  PositionRelative
} from "@vrkit-platform/shared-ui"
import TextField from "@mui/material/TextField"
import List, { ListProps } from "@mui/material/List"
import { isEmpty } from "@vrkit-platform/shared"
import Input from "@mui/material/Input"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const classPrefix = "filterableList"
export const filterableListClasses = createClassNames(
  classPrefix,
  "root",
  "filter",
  "filterQueryField",
  "list",
  "listItem"
)
const classes = filterableListClasses

export type FilterableListClassKey = ClassNamesKey<typeof filterableListClasses>

const FilterableListRoot = styled(Box, {
  name: "FilterableListRoot",
  label: "FilterableListRoot"
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
      ...FlexColumn,
      ...flexAlign("stretch", "stretch"),
      ...FlexScaleZero,
      ...OverflowHidden,
      ...PositionRelative,
      [child(classes.filter)]: {
        ...FlexRow,
        ...FlexAuto,
        ...FillWidth,
        ...flexAlign("center","stretch"),
        ...padding(spacing(0.5),spacing(1)),
        gap: spacing(1),
        backgroundColor: lighten(palette.background.appBarSearch,0.025),
        [child(classes.filterQueryField)]: {}
      },
      [child(classes.list)]: {
        ...FlexScaleZero,
        ...FillWidth, // ...FlexColumn,
        backgroundColor: palette.background.appBarSearch,
        overflowX: "hidden",
        overflowY: "auto",
        [child(classes.listItem)]: {
        
        }
      }
    }
  })
)

export interface FilterableListItemProps {
  className: string

  onClick: (ev: React.SyntheticEvent) => any
}

/**
 * FilterableList Component Properties
 */
export interface FilterableListProps<T> extends BoxProps {
  listProps?: Partial<ListProps>
  filterProps?: Partial<BoxProps>
  items: T[]

  itemRenderer: (item: T, itemProps: FilterableListItemProps) => React.ReactNode

  itemFilter: (item: T, query: string) => boolean

  onItemSelected?: (item: T) => any
}

/**
 * FilterableList Component
 *
 * @param { FilterableListProps } props
 */
export function FilterableList<T>(props: FilterableListProps<T>) {
  const { listProps:{className: listClassName, ...otherListProps}, filterProps:{className: filterClassName, ...otherFilterProps}, items, itemRenderer, itemFilter, onItemSelected, className, ...other } = props,
    [filterQuery, setFilterQuery] = useState<string>("")

  return (
    <FilterableListRoot
      className={clsx(classes.root, {}, className)}
      {...other}
    >
      <Box className={clsx(classes.filter, filterClassName)} {...otherFilterProps}>
        <SearchIcon fontSize={"small"}/>
        <Input
            disableUnderline
          className={clsx(classes.filterQueryField)}
          placeholder={"Search..."}
          value={filterQuery}
          onChange={ev => {
            setFilterQuery(ev.target.value)
          }}
        />
      </Box>
      <List className={clsx(classes.list, listClassName)} {...otherListProps}>
        {items
          .filter(it => isEmpty(filterQuery) || itemFilter(it, filterQuery))
          .map(item =>
            itemRenderer(item, {
              className: classes.listItem,
              onClick: ev => {
                ev.preventDefault()
                ev.stopPropagation()
                onItemSelected?.(item)
              }
            })
          )}
      </List>
    </FilterableListRoot>
  )
}

export default FilterableList
