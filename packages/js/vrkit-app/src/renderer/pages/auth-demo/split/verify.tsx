import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'vrkit-app-renderer/config-global';

import { SplitVerifyView } from 'vrkit-app-renderer/sections/auth-demo/split';

// ----------------------------------------------------------------------

const metadata = { title: `Verify | Layout split - ${CONFIG.site.name}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <SplitVerifyView />
    </>
  );
}
