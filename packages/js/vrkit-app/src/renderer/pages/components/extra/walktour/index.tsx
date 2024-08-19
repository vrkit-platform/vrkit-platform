import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'vrkit-app-renderer/config-global';

import { WalktourView } from 'vrkit-app-renderer/sections/_examples/extra/walktour-view';

// ----------------------------------------------------------------------

const metadata = { title: `Walktour | Components - ${CONFIG.site.name}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <WalktourView />
    </>
  );
}
