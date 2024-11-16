import { alpha, darken, styled } from "@mui/material/styles"
import { ListItemButton, ListItemButtonProps } from "@mui/material"

// APP
import {
  child,
  ClassNamesKey,
  createClasses,
  createClassNames,
  Ellipsis,
  FlexAuto,
  FlexColumn,
  FlexDefaults,
  FlexRow,
  FlexRowCenter,
  FlexScale,
  FlexScaleZero,
  heightConstraint,
  OverflowHidden,
  PositionRelative,
  rem
} from "vrkit-shared-ui/styles"
import { getLogger } from "@3fv/logger-proxy"
import clsx from "clsx"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const classPrefix = "AppListItem"
export const appListItemClasses = createClassNames(
  classPrefix,
  "root",
  "icon",
  "name",
  "content",
  "description",
  "actions",
  "stats",
  "row1",
  "row2"
)
export type AppListItemClassKey = ClassNamesKey<typeof appListItemClasses>

const AppListItemBase = styled<typeof ListItemButton>(ListItemButton)(({ theme }) =>
  createClasses(classPrefix, {
    root: {
      ...FlexRow,
      ...FlexAuto,
      ...theme.typography.body2,
      padding: theme.spacing(2),

      // color: theme.palette.text.secondary,
      // borderRadius: theme.shape.borderRadius,
      borderTop: `1px solid ${alpha(darken(theme.palette.background.paper, 0.15), 0.55)}`,
      "&:last-child": {
        borderBottom: `1px solid ${alpha(darken(theme.palette.background.paper, 0.15), 0.55)}`
      },
      transition: theme.transitions.create(["background-color", "color"]),
      // "& *": {
      // 	transition: theme.transitions.create(["color"]),
      // },
      [child(appListItemClasses.name)]: {
        color: "inherit"
        //color: theme.palette.primary.contrastText
      },

      [child(appListItemClasses.description)]: {
        color: "inherit"
        //color: theme.palette.primary.contrastText
      },
      // "&:hover, &.Mui-selected": {

      // },

      [child(appListItemClasses.icon)]: {
        ...FlexScaleZero,
        ...PositionRelative,
        ...FlexAuto,
        objectFit: "contain",
        maxWidth: "3rem",
        maxHeight: "3rem",
        margin: theme.spacing(1),
        marginRight: theme.spacing(4),
        boxShadow: theme.shadows[4],
        borderRadius: theme.shape.borderRadius
      },

      [child(appListItemClasses.name)]: {
        ...FlexScaleZero,
        ...Ellipsis
        // transition: theme.transitions.create(["color"])
      },
      [child(appListItemClasses.description)]: {
        ...FlexAuto,
        lineClamp: 2
        // transition: theme.transitions.create(["color"])
      },
      [child(appListItemClasses.content)]: {
        ...FlexColumn,
        ...FlexDefaults.stretch,
        ...PositionRelative,
        ...FlexScale,
        ...OverflowHidden
      },
      [child(appListItemClasses.row1)]: {
        ...FlexRow,
        ...FlexAuto,
        ...heightConstraint(rem(2))
      },
      [child(appListItemClasses.row2)]: {
        ...FlexRow,
        ...FlexDefaults.stretch
      },
      [child(appListItemClasses.actions)]: {
        ...FlexRowCenter,
        ...FlexAuto
      }
    }
  })
)

export interface AppListItemProps<T extends {}, IdProp extends keyof T = keyof T> extends ListItemButtonProps {
  value: T
  idProp: IdProp
  className?: string
}

/**
 * AppListItemProps
 *
 * @param {AppListItemProps} props
 */
export function AppListItem<T extends {}, IdProp extends keyof T = keyof T>({
  value: T,
  idProp: IdProp,
  selected,
  className,
  children,
  ...other
}: AppListItemProps<T, IdProp>) {
  return (
    <AppListItemBase
      className={clsx(appListItemClasses.root, className)}
      selected={selected}
      {...other}
    >
      {children}
    </AppListItemBase>
  )
}
