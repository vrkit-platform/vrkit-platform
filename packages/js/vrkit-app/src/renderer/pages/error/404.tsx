import { Helmet } from 'react-helmet-async';

import { DefaultConfig } from 'vrkit-app-renderer/config-global';

import { m } from 'framer-motion';

import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { RouterLink } from '../../components/app-router-link';

import { AppLayout } from '../../components/app';


import { varBounce, MotionContainer } from 'vrkit-app-renderer/components/animate';

// ----------------------------------------------------------------------

export function NotFoundView() {
  return (
      <AppLayout>
        <Container component={MotionContainer}>
          <m.div variants={varBounce().in}>
            <Typography variant="h3" sx={{ mb: 2 }}>
              Sorry, page not found!
            </Typography>
          </m.div>
          
          <m.div variants={varBounce().in}>
            <Typography sx={{ color: 'text.secondary' }}>
              Sorry, we couldn’t find the page you’re looking for. Perhaps you’ve mistyped the URL? Be
              sure to check your spelling.
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

const metadata = { title: `${DefaultConfig.app.name}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <NotFoundView />
    </>
  );
}
