import useSWR from 'swr';
import { useMemo } from 'react';

import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';

import { fetcher } from 'vrkit-app-renderer/utils/axios';

import { CONFIG } from 'vrkit-app-renderer/config-global';

import { Label } from 'vrkit-app-renderer/components/label';
import { SvgColor } from 'vrkit-app-renderer/components/svg-color';
import { NavSectionVertical } from 'vrkit-app-renderer/components/nav-section';

// ----------------------------------------------------------------------

function useGetNavItems() {
  const URL = '/api/navbar';

  const { data, isLoading, error, isValidating } = useSWR(URL, fetcher);

  const memoizedValue = useMemo(
    () => ({
      data: data?.navItems ?? [],
      isLoading,
      error,
      isValidating,
      isEmpty: !isLoading && !data?.navItems.length,
    }),
    [data?.navItems, error, isLoading, isValidating]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

export function NavAPI() {
  const navItems = useGetNavItems();

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        width: 1,
        mx: 'auto',
        maxWidth: 320,
        borderRadius: 2,
      }}
    >
      {navItems.isLoading ? (
        [...Array(8)].map((i, index) => (
          <Skeleton key={index} variant="rounded" height={48} sx={{ borderRadius: 1, my: 0.5 }} />
        ))
      ) : (
        <NavSectionVertical
          data={navItems.data}
          render={{
            navIcon: NAV_ICONS,
            navInfo: (val: string) => ({
              'info.landing': <Label color="error">{val}</Label>,
              'info.blog': <Label color="info">{val}</Label>,
              'info.blog.item1': <>{val}</>,
            }),
          }}
        />
      )}
    </Paper>
  );
}

// ----------------------------------------------------------------------

const NAV_ICONS = {
  'icon.landing': <SvgColor src={`${CONFIG.site.basePath}/assets/icons/navbar/ic-dashboard.svg`} />,
  'icon.services': (
    <SvgColor src={`${CONFIG.site.basePath}/assets/icons/navbar/ic-analytics.svg`} />
  ),
  'icon.blog': <SvgColor src={`${CONFIG.site.basePath}/assets/icons/navbar/ic-blog.svg`} />,
  'icon.about': <SvgColor src={`${CONFIG.site.basePath}/assets/icons/navbar/ic-user.svg`} />,
  'icon.tour': <SvgColor src={`${CONFIG.site.basePath}/assets/icons/navbar/ic-tour.svg`} />,
  'icon.menu': <SvgColor src={`${CONFIG.site.basePath}/assets/icons/navbar/ic-menu-item.svg`} />,
  'icon.level2a': <SvgColor src={`${CONFIG.site.basePath}/assets/icons/navbar/ic-chat.svg`} />,
  'icon.level2b': <SvgColor src={`${CONFIG.site.basePath}/assets/icons/navbar/ic-mail.svg`} />,
  'icon.level2c': <SvgColor src={`${CONFIG.site.basePath}/assets/icons/navbar/ic-calendar.svg`} />,
};
