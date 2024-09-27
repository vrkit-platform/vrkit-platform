import { m } from 'framer-motion';

import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { RouterLink } from 'vrkit-app-renderer/routes/components';

import { AppLayout } from 'vrkit-app-renderer/layouts/app';


import { varBounce, MotionContainer } from 'vrkit-app-renderer/components/animate';

// ----------------------------------------------------------------------

export function View500() {
  return (
    <AppLayout>
      <Container component={MotionContainer}>
        <m.div variants={varBounce().in}>
          <Typography variant="h3" sx={{ mb: 2 }}>
            500 Internal server error
          </Typography>
        </m.div>

        <m.div variants={varBounce().in}>
          <Typography sx={{ color: 'text.secondary' }}>
            There was an error, please try again later.
          </Typography>
        </m.div>

        <m.div variants={varBounce().in}>

        </m.div>

        <Button component={RouterLink} href="/" size="large" variant="contained">
          Go to home
        </Button>
      </Container>
    </AppLayout>
  );
}
