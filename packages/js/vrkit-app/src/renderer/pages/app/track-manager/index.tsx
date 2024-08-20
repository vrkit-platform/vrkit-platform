import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'vrkit-app-renderer/config-global';

import { TrackManagerView } from 'vrkit-app-renderer/sections/track-manager/view';

// ----------------------------------------------------------------------

const metadata = { title: `${CONFIG.site.name} | Track Manager` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <TrackManagerView />
    </>
  );
}
