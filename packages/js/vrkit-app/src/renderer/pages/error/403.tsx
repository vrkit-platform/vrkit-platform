import { Helmet } from 'react-helmet-async';

import { DefaultConfig } from 'vrkit-app-renderer/config-global';

import { View403 } from 'vrkit-app-renderer/sections/error';

// ----------------------------------------------------------------------

const metadata = { title: `403 forbidden! | Error - ${DefaultConfig.app.name}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <View403 />
    </>
  );
}
