import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'vrkit-app-renderer/config-global';

import { FaqsView } from 'vrkit-app-renderer/sections/faqs/view';

// ----------------------------------------------------------------------

const metadata = { title: `Faqs - ${CONFIG.site.name}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <FaqsView />
    </>
  );
}
