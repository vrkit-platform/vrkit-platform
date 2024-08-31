import { Helmet } from 'react-helmet-async';

import { DefaultConfig } from 'vrkit-app-renderer/config-global';

import { ComingSoonView } from 'vrkit-app-renderer/sections/coming-soon/view';

// ----------------------------------------------------------------------

const metadata = { title: `Coming soon - ${DefaultConfig.site.name}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <ComingSoonView />
    </>
  );
}
