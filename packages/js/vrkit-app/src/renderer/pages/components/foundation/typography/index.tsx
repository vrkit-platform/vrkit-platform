import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'vrkit-app-renderer/config-global';

import { TypographyView } from 'vrkit-app-renderer/sections/_examples/foundation/typography-view';

// ----------------------------------------------------------------------

const metadata = { title: `Typography | Foundations - ${CONFIG.site.name}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <TypographyView />
    </>
  );
}
