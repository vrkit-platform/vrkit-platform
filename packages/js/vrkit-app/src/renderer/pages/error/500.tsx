import { Helmet } from 'react-helmet-async';

import { DefaultConfig } from 'vrkit-app-renderer/config-global';

import { m } from 'framer-motion';

import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { RouterLink } from '../../components/app-router-link';

import { PageLayout } from '../../components/page';


import { varBounce, MotionContainer } from 'vrkit-app-renderer/components/animate';

export function View500() {
  return (
      <PageLayout>
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
      </PageLayout>
  );
}

const metadata = { title: `500 Internal server error! | Error - ${DefaultConfig.app.name}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <View500 />
    </>
  );
}
