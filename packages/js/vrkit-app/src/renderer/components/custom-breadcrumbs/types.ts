import type { Theme, SxProps } from '@mui/material/styles';
import type { BreadcrumbsProps } from '@mui/material/Breadcrumbs';
import React from "react"

// ----------------------------------------------------------------------

export type BreadcrumbsLinkProps = {
  name?: string;
  href?: string;
  icon?: React.ReactElement;
};

export type CustomBreadcrumbsProps = BreadcrumbsProps & {
  heading?: string;
  moreLink?: string[];
  activeLast?: boolean;
  action?: React.ReactNode;
  links: BreadcrumbsLinkProps[];
  sx?: SxProps<Theme>;
  slotProps?: {
    action: SxProps<Theme>;
    heading: SxProps<Theme>;
    moreLink: SxProps<Theme>;
    breadcrumbs: SxProps<Theme>;
  };
};
