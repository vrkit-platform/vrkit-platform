import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'vrkit-app-renderer/config-global';

import { AccordionView } from 'vrkit-app-renderer/sections/_examples/mui/accordion-view';

// ----------------------------------------------------------------------

const metadata = { title: `Accordion | MUI - ${CONFIG.site.name}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <AccordionView />
    </>
  );
}
