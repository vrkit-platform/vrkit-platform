import { Helmet } from 'react-helmet-async';

import { DefaultConfig } from 'vrkit-app-renderer/config-global';

import { MaintenanceView } from 'vrkit-app-renderer/sections/maintenance/view';

// ----------------------------------------------------------------------

const metadata = { title: `Maintenance - ${DefaultConfig.site.name}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <MaintenanceView />
    </>
  );
}
