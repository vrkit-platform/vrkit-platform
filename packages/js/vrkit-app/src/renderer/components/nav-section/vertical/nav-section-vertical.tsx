import { useCallback, useState } from "react"

import Stack from "@mui/material/Stack"
import Collapse from "@mui/material/Collapse"
import { useTheme } from "@mui/material/styles"

import { NavList } from "./nav-list"
import { navSectionClasses } from "../classes"
import { navSectionCssVars } from "../css-vars"
import { NavLi, NavUl, Subheader } from "../styles"



import {
  isNavDataGroupWithItems,
  isNavDataItem,
  NavGroupProps,
  NavRootItemProps,
  NavSectionProps
} from "../types"
import { NavItem } from "./nav-item"

// ----------------------------------------------------------------------

export function NavSectionVertical({
  sx,
  data,
  render,
  slotProps,
  enabledRootRedirect,
  cssVars: overridesVars
}: NavSectionProps) {
  const theme = useTheme()

  const cssVars = {
    ...navSectionCssVars.vertical(theme),
    ...overridesVars
  }

  return (
    <Stack
      component="nav"
      className={navSectionClasses.vertical.root}
      sx={{ ...cssVars, ...sx }}
    >
      <NavUl sx={{ flex: "1 1 auto", gap: "var(--nav-item-gap)" }}>
        {data.map(item => {
          if (isNavDataGroupWithItems(item)) {
            const group = item
            return (
              <Group
                key={group.subheader ?? group.items[0].title}
                subheader={group.subheader}
                items={group.items}
                render={render}
                slotProps={slotProps}
                enabledRootRedirect={enabledRootRedirect}
              />
            )
          } else if (isNavDataItem(item)) {
            return (
              <RootItem
                item={item}
                render={render}
                slotProps={slotProps}
                enabledRootRedirect={enabledRootRedirect}
                key={item.path}
              />
            )
          }

          return null
        })}
      </NavUl>
    </Stack>
  )
}

// ----------------------------------------------------------------------

function Group({
  items,
  render,
  subheader,
  slotProps,
  enabledRootRedirect
}: NavGroupProps) {
  const [open, setOpen] = useState(true)

  const handleToggle = useCallback(() => {
    setOpen(prev => !prev)
  }, [])

  const renderContent = (
    <NavUl sx={{ gap: "var(--nav-item-gap)" }}>
      {items.map(list => (
        <NavList
          key={list.title}
          data={list}
          render={render}
          depth={1}
          slotProps={slotProps}
          enabledRootRedirect={enabledRootRedirect}
        />
      ))}
    </NavUl>
  )

  return (
    <NavLi>
      {subheader ? (
        <>
          <Subheader
            data-title={subheader}
            open={open}
            onClick={handleToggle}
            sx={slotProps?.subheader}
          >
            {subheader}
          </Subheader>

          <Collapse in={open}>{renderContent}</Collapse>
        </>
      ) : (
        renderContent
      )}
    </NavLi>
  )
}

function RootItem({
  item,
  render,
  slotProps,
  enabledRootRedirect,
    ...other
}: NavRootItemProps) {
  return (
    <NavLi>
      <NavUl sx={{ gap: "var(--nav-item-gap)" }}>
        <NavItem
            {...item}
            {...other}
            //{/*, minHeight: `3rem`, [`& *`]:{fontSize: `1rem !important`,fontWeight: `700 !important`}*/}
            sx={{marginTop: `1rem`}}
            key={item.title}
          
          render={render}
          depth={1}
          //slotProps={slotProps}
          
          
          enabledRootRedirect={enabledRootRedirect}
        />
      </NavUl>
    </NavLi>
  )
}
