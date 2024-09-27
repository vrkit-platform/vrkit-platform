import { WebPaths } from '../routes/WebPaths';
import { DefaultConfig } from 'vrkit-app-renderer/config-global';
import { SvgColor } from 'vrkit-app-renderer/components/svg-color';

// ----------------------------------------------------------------------

const icon = (name: string) => (
  <SvgColor src={`${DefaultConfig.app.basePath}/assets/icons/navbar/${name}.svg`} />
);

const Icons = {
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
    title: "Dashboards",
    path: WebPaths.app.dashboards,
    icon: Icons.dashboard
  },
  
  // {
  //   subheader: 'Data',
  //   items: [
  //     {
  //       title: 'Tracks',
  //       path: WebPaths.app.tracks,
  //       icon: Icons.dashboard
  //     },
  //     { title: 'Laps', path: WebPaths.app.laps, icon: Icons.folder },
  //     { title: 'Games', path: WebPaths.app.games, icon: Icons.folder },
  //
  //   ],
  // }
];
