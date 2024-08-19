import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Breadcrumbs from '@mui/material/Breadcrumbs';

import { paths } from 'vrkit-app-renderer/routes/paths';

import { Iconify } from 'vrkit-app-renderer/components/iconify';
import { CustomBreadcrumbs } from 'vrkit-app-renderer/components/custom-breadcrumbs';

import { ComponentHero } from '../../component-hero';
import { ComponentBlock } from '../../component-block';
import { ScrollToViewTemplate } from '../../component-template';

// ----------------------------------------------------------------------

export function BreadcrumbsView() {
  const DEMO = [
    {
      name: 'Text',
      component: (
        <ComponentBlock>
          <Breadcrumbs>
            <Link color="inherit" href="#">
              Material-UI
            </Link>
            <Link color="inherit" href="#">
              Core
            </Link>
            <Typography sx={{ color: 'text.primary' }}>Breadcrumb</Typography>
          </Breadcrumbs>
        </ComponentBlock>
      ),
    },
    {
      name: 'With icon',
      component: (
        <ComponentBlock>
          <Breadcrumbs>
            <Link color="inherit" href="#" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Iconify icon="solar:home-angle-2-bold-duotone" />
              Material-UI
            </Link>
            <Link color="inherit" href="#" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Iconify icon="solar:atom-bold-duotone" />
              Core
            </Link>
            <Typography
              sx={{ gap: 0.5, display: 'flex', alignItems: 'center', color: 'text.primary' }}
            >
              <Iconify icon="solar:bell-bing-bold-duotone" />
              Breadcrumb
            </Typography>
          </Breadcrumbs>
        </ComponentBlock>
      ),
    },
    {
      name: 'Customized',
      component: (
        <Stack spacing={5}>
          <ComponentBlock>
            <CustomBreadcrumbs
              links={[
                {
                  name: 'Home',
                  href: '#',
                  icon: <Iconify icon="solar:home-angle-2-bold-duotone" />,
                },
                { name: 'Link1', href: '#', icon: <Iconify icon="eva:cube-outline" /> },
                { name: 'Link2', href: '#', icon: <Iconify icon="eva:cube-outline" /> },
                { name: 'Link3', icon: <Iconify icon="eva:cube-outline" /> },
              ]}
            />
          </ComponentBlock>

          <ComponentBlock sx={{ flexDirection: 'column', alignItems: 'unset' }}>
            <CustomBreadcrumbs
              heading="Heading"
              links={[
                {
                  name: 'Home',
                  href: '#',
                  icon: <Iconify icon="solar:home-angle-2-bold-duotone" />,
                },
                { name: 'Link1', href: '#', icon: <Iconify icon="eva:cube-outline" /> },
                { name: 'Link2', href: '#', icon: <Iconify icon="eva:cube-outline" /> },
                { name: 'Link3', icon: <Iconify icon="eva:cube-outline" /> },
              ]}
              action={
                <Button variant="contained" startIcon={<Iconify icon="mingcute:add-line" />}>
                  New product
                </Button>
              }
            />
          </ComponentBlock>
        </Stack>
      ),
    },
  ];

  return (
    <>
      <ComponentHero>
        <CustomBreadcrumbs
          heading="Breadcrumbs"
          links={[{ name: 'Components', href: paths.components }, { name: 'Breadcrumbs' }]}
          moreLink={['https://mui.com/components/custom-breadcrumbs']}
        />
      </ComponentHero>

      <ScrollToViewTemplate data={DEMO} />
    </>
  );
}
