import React from "react"
import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'vrkit-app-renderer/config-global';
import { OverviewView } from "vrkit-app-renderer/sections/app/overview"


// ----------------------------------------------------------------------

const metadata = { title: `${CONFIG.site.name} - Overview` };

export default function OverviewAppPage() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <OverviewView />
    </>
  );
}
