import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { useTheme } from '@mui/material/styles';
import Grid from '@mui/material/Unstable_Grid2';
import { AppContent } from "vrkit-app-renderer/layouts/app"
import React from "react"
import { SessionPlayerControlBar } from "vrkit-app-renderer/components/session-player-controls"

export function AppView() {
  const theme = useTheme();
  
  return (
      <AppContent>
        {/*<SessionPlayerControlBar />*/}
      </AppContent>
  );
}