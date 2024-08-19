import { useState } from 'react';

import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import { Iconify } from 'vrkit-app-renderer/components/iconify';

// ----------------------------------------------------------------------

type ContactMapProps = {
  contacts: {
    latlng: number[];
    address: string;
    phoneNumber: string;
  }[];
};

export function ContactMap({ contacts }: ContactMapProps) {
  const theme = useTheme();

  const [popupInfo, setPopupInfo] = useState<ContactMapProps['contacts'][0] | null>(null);

  const lightMode = theme.palette.mode === 'light';

  return (
    <Box
      sx={{
        zIndex: 0,
        borderRadius: 1.5,
        overflow: 'hidden',
        position: 'relative',
        height: { xs: 320, md: 560 },
      }}
    >
    
    </Box>
  );
}
