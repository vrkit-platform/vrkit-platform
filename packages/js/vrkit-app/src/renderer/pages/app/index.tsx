import React from "react"
import { Helmet } from 'react-helmet-async';

import { DefaultConfig } from 'vrkit-app-renderer/config-global';
import { AppView } from "vrkit-app-renderer/sections/app"


// ----------------------------------------------------------------------

const metadata = { title: `${DefaultConfig.app.name}` };

export default function AppPage() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <AppView />
    </>
  );
}
