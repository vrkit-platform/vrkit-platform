import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'vrkit-app-renderer/config-global';

import { TextfieldView } from 'vrkit-app-renderer/sections/_examples/mui/textfield-view';

// ----------------------------------------------------------------------

const metadata = { title: `Textfield | MUI - ${CONFIG.site.name}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <TextfieldView />
    </>
  );
}
