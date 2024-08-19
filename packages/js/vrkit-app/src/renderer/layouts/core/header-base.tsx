import type { NavSectionProps } from "vrkit-app-renderer/components/nav-section"

import Box from "@mui/material/Box"
import { styled, useTheme } from "@mui/material/styles"

import { Logo } from "vrkit-app-renderer/components/logo"

import type { HeaderSectionProps } from "./header-section"
import { HeaderSection } from "./header-section"
import { MenuButton } from "../components/menu-button"
// import { SignInButton } from '../components/sign-in-button';
import { SettingsButton } from "../components/settings-button"
import type { LanguagePopoverProps } from "../components/language-popover"
import { LanguagePopover } from "../components/language-popover"
import type { NotificationsDrawerProps } from "../components/notifications-drawer"
import { NotificationsDrawer } from "../components/notifications-drawer"

// ----------------------------------------------------------------------

const StyledDivider = styled("span")(({ theme }) => ({
  width: 1,
  height: 10,
  flexShrink: 0,
  display: "none",
  position: "relative",
  alignItems: "center",
  flexDirection: "column",
  marginLeft: theme.spacing(2.5),
  marginRight: theme.spacing(2.5),
  backgroundColor: "currentColor",
  color: theme.vars.palette.divider,
  "&::before, &::after": {
    top: -5,
    width: 3,
    height: 3,
    content: '""',
    flexShrink: 0,
    borderRadius: "50%",
    position: "absolute",
    backgroundColor: "currentColor"
  },
  "&::after": { bottom: -5, top: "auto" }
}))

// ----------------------------------------------------------------------

export type HeaderBaseProps = HeaderSectionProps & {
  onOpenNav: () => void
  data?: {
    nav?: NavSectionProps["data"]
    langs?: LanguagePopoverProps["data"]
    notifications?: NotificationsDrawerProps["data"]
  }
  slots?: {
    navMobile?: {
      topArea?: React.ReactNode
      bottomArea?: React.ReactNode
    }
  }
  slotsDisplay?: {
    settings?: boolean
    menuButton?: boolean
    localization?: boolean
    notifications?: boolean
  }
}

export function HeaderBase({
  sx,
  data,
  slots,
  slotProps,
  onOpenNav,
  layoutQuery,
  slotsDisplay: {
    settings = true,
    menuButton = true,
    localization = true,
    notifications = true
  } = {},
  ...other
}: HeaderBaseProps) {
  const theme = useTheme()

  return (
    <HeaderSection
      sx={sx}
      layoutQuery={layoutQuery}
      slots={{
        ...slots,
        leftAreaStart: slots?.leftAreaStart,
        leftArea: (
          <>
            {slots?.leftAreaStart}

            {/* -- Menu button -- */}
            {menuButton && (
              <MenuButton
                data-slot="menu-button"
                onClick={onOpenNav}
                sx={{
                  mr: 1,
                  ml: -1,
                  [theme.breakpoints.up(layoutQuery)]: { display: "none" }
                }}
              />
            )}

            {/* -- Logo -- */}
            <Logo data-slot="logo" />

            {/* -- Divider -- */}
            <StyledDivider data-slot="divider" />

            {slots?.leftAreaEnd}
          </>
        ),
        rightArea: (
          <>
            {slots?.rightAreaStart}

            <Box
              data-area="right"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: { xs: 1, sm: 1.5 }
              }}
            >
              {/* -- Language popover -- */}
              {localization && (
                <LanguagePopover
                  data-slot="localization"
                  data={data?.langs}
                />
              )}

              {/* -- Notifications popover -- */}
              {notifications && (
                <NotificationsDrawer
                  data-slot="notifications"
                  data={data?.notifications}
                />
              )}

              {/* -- Settings button -- */}
              {settings && <SettingsButton data-slot="settings" />}

              {/*/!* -- Sign in button -- *!/*/}
              {/*{signIn && <SignInButton />}*/}
            </Box>

            {slots?.rightAreaEnd}
          </>
        )
      }}
      slotProps={slotProps}
      {...other}
    />
  )
}
