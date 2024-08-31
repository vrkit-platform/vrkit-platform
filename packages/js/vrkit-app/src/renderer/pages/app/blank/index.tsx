import { Helmet } from 'react-helmet-async';

import { DefaultConfig } from 'vrkit-app-renderer/config-global';

import { BlankView } from 'vrkit-app-renderer/sections/blank/view';

// ----------------------------------------------------------------------

const metadata = { title: `Blank | Dashboard - ${DefaultConfig.site.name}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <BlankView />
    </>
  );
}
