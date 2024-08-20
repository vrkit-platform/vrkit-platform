import type { IFile } from 'vrkit-app-renderer/types/file';
import type { DrawerProps } from '@mui/material/Drawer';

import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import Divider from '@mui/material/Divider';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';

import { useBoolean } from 'vrkit-app-renderer/hooks/use-boolean';

import { fData } from 'vrkit-app-renderer/utils/format-number';
import { fDateTime } from 'vrkit-app-renderer/utils/format-time';

import { Iconify } from 'vrkit-app-renderer/components/iconify';
import { Scrollbar } from 'vrkit-app-renderer/components/scrollbar';
import { TrackMapFile } from "vrkit-models"


// ----------------------------------------------------------------------

type Props = DrawerProps & {
  item: TrackMapFile;
  onClose: () => void;
  onDelete: () => void;
};

export function TrackManagerDetails({
  item,
  open,
  onClose,
  onDelete,
  ...other
}: Props) {
  const { trackLayoutMetadata } = item;
  const {name: layoutName, id: layoutId, trackMetadata} = trackLayoutMetadata
  const {name, id: trackId} = trackMetadata
  
  
  
  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        anchor="right"
        slotProps={{ backdrop: { invisible: true } }}
        PaperProps={{ sx: { width: 320 } }}
        {...other}
      >
        <Scrollbar>
  
          <Stack
            spacing={2.5}
            justifyContent="center"
            sx={{ p: 2.5, bgcolor: 'background.neutral' }}
          >
            {/*<FileThumbnail*/}
            {/*  imageView*/}
            {/*  file={type === 'folder' ? type : url}*/}
            {/*  sx={{ width: 'auto', height: 'auto', alignSelf: 'flex-start' }}*/}
            {/*  slotProps={{*/}
            {/*    img: {*/}
            {/*      width: 320,*/}
            {/*      height: 'auto',*/}
            {/*      aspectRatio: '4/3',*/}
            {/*      objectFit: 'cover',*/}
            {/*    },*/}
            {/*    icon: { width: 64, height: 64 },*/}
            {/*  }}*/}
            {/*/>*/}
            
            {/*<Typography variant="subtitle1" sx={{ wordBreak: 'break-all' }}>*/}
            {/*  {name}*/}
            {/*</Typography>*/}
            
            {/*<Divider sx={{ borderStyle: 'dashed' }} />*/}
            
            {/*{renderTags}*/}
            
            {/*{renderProperties}*/}
          </Stack>

          {/*{renderShared}*/}
        </Scrollbar>

        <Box sx={{ p: 2.5 }}>
          <Button
            fullWidth
            variant="soft"
            color="error"
            size="large"
            startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
            onClick={onDelete}
          >
            Delete
          </Button>
        </Box>
      </Drawer>
    </>
  );
}
