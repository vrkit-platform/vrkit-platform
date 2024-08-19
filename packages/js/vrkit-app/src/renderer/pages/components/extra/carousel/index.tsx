import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'vrkit-app-renderer/config-global';

import { CarouselView } from 'vrkit-app-renderer/sections/_examples/extra/carousel-view';

// ----------------------------------------------------------------------

const metadata = { title: `Carousel | Components - ${CONFIG.site.name}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <CarouselView />
    </>
  );
}
