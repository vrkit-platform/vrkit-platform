import { Helmet } from 'react-helmet-async';

import { DefaultConfig } from 'vrkit-app-renderer/config-global';

import { View500 } from 'vrkit-app-renderer/sections/error';

// ----------------------------------------------------------------------

const metadata = { title: `500 Internal server error! | Error - ${DefaultConfig.site.name}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <View500 />
    </>
  );
}
