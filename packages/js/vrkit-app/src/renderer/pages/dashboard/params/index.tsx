import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'vrkit-app-renderer/config-global';

import { BlankView } from 'vrkit-app-renderer/sections/blank/view';

// ----------------------------------------------------------------------

const metadata = { title: `Item params | Dashboard - ${CONFIG.site.name}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <BlankView title="Item active has params" />
    </>
  );
}
