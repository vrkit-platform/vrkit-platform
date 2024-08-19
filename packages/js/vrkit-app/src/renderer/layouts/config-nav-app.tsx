import { WebPaths } from '../routes/WebPaths';

import { CONFIG } from 'vrkit-app-renderer/config-global';

import { Label } from 'vrkit-app-renderer/components/label';
import { Iconify } from 'vrkit-app-renderer/components/iconify';
import { SvgColor } from 'vrkit-app-renderer/components/svg-color';

// ----------------------------------------------------------------------

const icon = (name: string) => (
  <SvgColor src={`${CONFIG.site.basePath}/assets/icons/navbar/${name}.svg`} />
);

const ICONS = {
  job: icon('ic-job'),
  blog: icon('ic-blog'),
  chat: icon('ic-chat'),
  mail: icon('ic-mail'),
  user: icon('ic-user'),
  file: icon('ic-file'),
  lock: icon('ic-lock'),
  tour: icon('ic-tour'),
  order: icon('ic-order'),
  label: icon('ic-label'),
  blank: icon('ic-blank'),
  kanban: icon('ic-kanban'),
  folder: icon('ic-folder'),
  course: icon('ic-course'),
  banking: icon('ic-banking'),
  booking: icon('ic-booking'),
  invoice: icon('ic-invoice'),
  product: icon('ic-product'),
  calendar: icon('ic-calendar'),
  disabled: icon('ic-disabled'),
  external: icon('ic-external'),
  menuItem: icon('ic-menu-item'),
  ecommerce: icon('ic-ecommerce'),
  analytics: icon('ic-analytics'),
  dashboard: icon('ic-dashboard'),
  parameter: icon('ic-parameter'),
};

// ----------------------------------------------------------------------

export const navData = [
  {
    title: "Overview",
    path: WebPaths.app.overview,
    icon: ICONS.dashboard
  },
    /**
   * Overview
   */
  {
    subheader: 'Data',
    items: [
      {
        title: 'Tracks',
        path: WebPaths.app.tracks,
        icon: ICONS.dashboard
      },
      { title: 'Laps', path: WebPaths.app.laps, icon: ICONS.folder },
      { title: 'Games', path: WebPaths.app.games, icon: ICONS.folder },
      
    ],
  },
  /**
   * Management
   */
  // {
  //   subheader: 'Management',
  //   items: [
  //     {
  //       title: 'User',
  //       path: paths.data.user.root,
  //       icon: ICONS.user,
  //       children: [
  //         { title: 'Profile', path: paths.data.user.root },
  //         { title: 'Cards', path: paths.data.user.cards },
  //         { title: 'List', path: paths.data.user.list },
  //         { title: 'Create', path: paths.data.user.new },
  //         { title: 'Edit', path: paths.data.user.demo.edit },
  //         { title: 'Account', path: paths.data.user.account },
  //       ],
  //     },
  //     { title: 'File manager', path: paths.data.fileManager, icon: ICONS.folder },
  //     { title: 'Calendar', path: paths.data.calendar, icon: ICONS.calendar },
  //     { title: 'Kanban', path: paths.data.kanban, icon: ICONS.kanban },
  //   ],
  // },
];
