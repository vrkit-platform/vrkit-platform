import { Helmet } from "react-helmet-async"
import { m } from "framer-motion"

import Button from "@mui/material/Button"
import Container from "@mui/material/Container"
import Typography from "@mui/material/Typography"

import { DefaultConfig } from "vrkit-app-renderer/config-global"
import { MotionContainer, varBounce } from "../../components/animate"
import { RouterLink } from "../../components/app-router-link"
import { PageLayout } from "../../components/page"


const metadata = { title: `403 forbidden! | Error - ${DefaultConfig.app.name}` }

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <PageLayout>
        <Container component={MotionContainer}>
          <m.div variants={varBounce().in}>
            <Typography
              variant="h3"
              sx={{ mb: 2 }}
            >
              No permission
            </Typography>
          </m.div>

          <m.div variants={varBounce().in}>
            <Typography sx={{ color: "text.secondary" }}>
              The page you’re trying to access has restricted access. Please refer to your system administrator.
            </Typography>
          </m.div>

          <m.div variants={varBounce().in}></m.div>

          <Button
            component={RouterLink}
            href="/"
            size="large"
            variant="contained"
          >
            Go to home
          </Button>
        </Container>
      </PageLayout>
    </>
  )
}
