import type { Theme, SxProps, CSSObject } from '@mui/material/styles';

import Box from '@mui/material/Box';
import GlobalStyles from '@mui/material/GlobalStyles';


import React from "react"

// ----------------------------------------------------------------------

export type LayoutSectionProps = {
  sx?: SxProps<Theme>;
  children?: React.ReactNode;
  footerSection?: React.ReactNode;
  headerSection?: React.ReactNode;
  sidebarSection?: React.ReactNode;
};

export function LayoutSection({
  sx,
  children,
  footerSection,
  headerSection,
  sidebarSection,
}: LayoutSectionProps) {

  return (
    <>
      {/*{inputGlobalStyles}*/}
      <Box id="root__layout"  sx={sx}>
        {sidebarSection ? (
          <>
            {sidebarSection}
            <Box
              display="flex"
              flex="1 1 auto"
              flexDirection="column"
                          >
              {headerSection}
              {children}
              {footerSection}
            </Box>
          </>
        ) : (
          <>
            {headerSection}
            {children}
            {footerSection}
          </>
        )}
      </Box>
    </>
  );
}
