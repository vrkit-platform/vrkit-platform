import { Helmet } from 'react-helmet-async';

import { DefaultConfig } from 'vrkit-app-renderer/config-global';

import { AboutView } from 'vrkit-app-renderer/sections/about/view';

// ----------------------------------------------------------------------

const metadata = { title: `About us - ${DefaultConfig.site.name}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <AboutView />
    </>
  );
}
