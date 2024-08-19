import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'vrkit-app-renderer/config-global';

import { TreeView } from 'vrkit-app-renderer/sections/_examples/mui/tree-view';

// ----------------------------------------------------------------------

const metadata = { title: `Tree view | MUI - ${CONFIG.site.name}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <TreeView />
    </>
  );
}
