import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'vrkit-app-renderer/config-global';

import { PickerView } from 'vrkit-app-renderer/sections/_examples/mui/picker-view';

// ----------------------------------------------------------------------

const metadata = { title: `Date picker | MUI - ${CONFIG.site.name}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <PickerView />
    </>
  );
}
