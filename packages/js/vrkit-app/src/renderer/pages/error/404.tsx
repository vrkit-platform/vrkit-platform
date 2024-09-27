import { Helmet } from 'react-helmet-async';

import { DefaultConfig } from 'vrkit-app-renderer/config-global';

import { NotFoundView } from 'vrkit-app-renderer/sections/error';

// ----------------------------------------------------------------------

const metadata = { title: `${DefaultConfig.app.name}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <NotFoundView />
    </>
  );
}
