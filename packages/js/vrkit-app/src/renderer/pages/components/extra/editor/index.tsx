import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'vrkit-app-renderer/config-global';

import { EditorView } from 'vrkit-app-renderer/sections/_examples/extra/editor-view';

// ----------------------------------------------------------------------

const metadata = { title: `Editor | Components - ${CONFIG.site.name}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <EditorView />
    </>
  );
}
