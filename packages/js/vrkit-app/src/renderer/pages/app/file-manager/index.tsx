import { Helmet } from 'react-helmet-async';

import { DefaultConfig } from 'vrkit-app-renderer/config-global';

import { FileManagerView } from 'vrkit-app-renderer/sections/file-manager/view';

// ----------------------------------------------------------------------

const metadata = { title: `File manager | Dashboard - ${DefaultConfig.site.name}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <FileManagerView />
    </>
  );
}
