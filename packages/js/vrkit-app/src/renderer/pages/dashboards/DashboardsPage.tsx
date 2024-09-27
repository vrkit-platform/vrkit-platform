import React from "react"
import { Helmet } from 'react-helmet-async';

import { DefaultConfig } from 'vrkit-app-renderer/config-global';
import { DashboardsView } from "./DashboardsView"


// ----------------------------------------------------------------------



export default function DashboardsPage() {
  return (
    <>
      <Helmet>
        <title>{DefaultConfig.app.name}</title>
      </Helmet>

      <DashboardsView />
    </>
  );
}
