import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { useTheme } from '@mui/material/styles';
import Grid from '@mui/material/Unstable_Grid2';
import SeoIllustration from "vrkit-app-renderer/assets/illustrations/seo-illustration"
import { AppContent } from "vrkit-app-renderer/layouts/app"
import { AppWelcome } from "../app-welcome"

export function OverviewView() {
  const theme = useTheme();
  
  return (
      <AppContent maxWidth="xl">
        <Grid container spacing={3}>
          <Grid xs={12} md={8}>
            <AppWelcome
                title={`Welcome`}
                description="If you are going to use a passage of Lorem Ipsum, you need to be sure there isn't anything."
                img={<SeoIllustration hideBackground />}
                action={
                  <Button variant="contained" color="primary">
                    Go now
                  </Button>
                }
            />
          </Grid>
        </Grid>
      </AppContent>
  );
}