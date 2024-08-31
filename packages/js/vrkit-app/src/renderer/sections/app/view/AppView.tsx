import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { useTheme } from '@mui/material/styles';
import Grid from '@mui/material/Unstable_Grid2';
import { AppContent } from "vrkit-app-renderer/layouts/app"

export function AppView() {
  const theme = useTheme();
  
  return (
      <AppContent maxWidth="xl">
        <Grid container spacing={3}  alignContent={"center"}>
          <Grid xs={12} md={8}>
            Hi
          </Grid>
        </Grid>
      </AppContent>
  );
}