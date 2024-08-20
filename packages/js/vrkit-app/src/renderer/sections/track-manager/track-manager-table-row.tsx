

import { useState, useCallback } from 'react';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import { useTheme } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';
import TableRow, { tableRowClasses } from '@mui/material/TableRow';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import AvatarGroup, { avatarGroupClasses } from '@mui/material/AvatarGroup';

import { useBoolean } from 'vrkit-app-renderer/hooks/use-boolean';
import { useDoubleClick } from 'vrkit-app-renderer/hooks/use-double-click';
import { useCopyToClipboard } from 'vrkit-app-renderer/hooks/use-copy-to-clipboard';

import { fData } from 'vrkit-app-renderer/utils/format-number';
import { fDate, fTime } from 'vrkit-app-renderer/utils/format-time';

import { varAlpha } from 'vrkit-app-renderer/theme/styles';

import { toast } from 'vrkit-app-renderer/components/snackbar';
import { Iconify } from 'vrkit-app-renderer/components/iconify';
import { ConfirmDialog } from 'vrkit-app-renderer/components/custom-dialog';
import { FileThumbnail } from 'vrkit-app-renderer/components/file-thumbnail';
import { usePopover, CustomPopover } from 'vrkit-app-renderer/components/custom-popover';
import { TrackMapFile } from "vrkit-models"


// ----------------------------------------------------------------------

type Props = {
  row: TrackMapFile;
  selected: boolean;
  onSelectRow: () => void;
  onDeleteRow: () => void;
};

export function TrackManagerTableRow({ row, selected, onSelectRow, onDeleteRow }: Props) {
  const theme = useTheme();

  const { copy } = useCopyToClipboard();

  const details = useBoolean();

  const share = useBoolean();

  const confirm = useBoolean();

  const popover = usePopover();

  const handleClick = useDoubleClick({
    click: () => {
      details.onTrue();
    },
    doubleClick: () => console.info('DOUBLE CLICK'),
  });

  const defaultStyles = {
    borderTop: `solid 1px ${varAlpha(theme.vars.palette.grey['500Channel'], 0.16)}`,
    borderBottom: `solid 1px ${varAlpha(theme.vars.palette.grey['500Channel'], 0.16)}`,
    '&:first-of-type': {
      borderTopLeftRadius: 16,
      borderBottomLeftRadius: 16,
      borderLeft: `solid 1px ${varAlpha(theme.vars.palette.grey['500Channel'], 0.16)}`,
    },
    '&:last-of-type': {
      borderTopRightRadius: 16,
      borderBottomRightRadius: 16,
      borderRight: `solid 1px ${varAlpha(theme.vars.palette.grey['500Channel'], 0.16)}`,
    },
  };

  return (
    <>
      <TableRow
        selected={selected}
        sx={{
          borderRadius: 2,
          [`&.${tableRowClasses.selected}, &:hover`]: {
            backgroundColor: 'background.paper',
            boxShadow: theme.customShadows.z20,
            transition: theme.transitions.create(['background-color', 'box-shadow'], {
              duration: theme.transitions.duration.shortest,
            }),
            '&:hover': { backgroundColor: 'background.paper', boxShadow: theme.customShadows.z20 },
          },
          [`& .${tableCellClasses.root}`]: { ...defaultStyles },
          ...(details.value && { [`& .${tableCellClasses.root}`]: { ...defaultStyles } }),
        }}
      >
        <TableCell padding="checkbox">
          <Checkbox
            checked={selected}
            onDoubleClick={() => console.info('ON DOUBLE CLICK')}
            onClick={onSelectRow}
            inputProps={{ id: `row-checkbox-${row.trackLayoutMetadata.id}`, 'aria-label': `row-checkbox` }}
          />
        </TableCell>

        <TableCell onClick={handleClick}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography
              noWrap
              variant="inherit"
              sx={{
                maxWidth: 360,
                cursor: 'pointer',
                ...(details.value && { fontWeight: 'fontWeightBold' }),
              }}
            >
              {row.trackLayoutMetadata.trackMetadata.name} {row.trackLayoutMetadata.name}
            </Typography>
          </Stack>
        </TableCell>

        
        {/*<TableCell onClick={handleClick} sx={{ whiteSpace: 'nowrap' }}>*/}
        {/*  <ListItemText*/}
        {/*    primary={fDate(row.modifiedAt)}*/}
        {/*    secondary={fTime(row.modifiedAt)}*/}
        {/*    primaryTypographyProps={{ typography: 'body2' }}*/}
        {/*    secondaryTypographyProps={{ mt: 0.5, component: 'span', typography: 'caption' }}*/}
        {/*  />*/}
        {/*</TableCell>*/}

      </TableRow>

      <CustomPopover
        open={popover.open}
        anchorEl={popover.anchorEl}
        onClose={popover.onClose}
        slotProps={{ arrow: { placement: 'right-top' } }}
      >
        <MenuList>
          <MenuItem
            onClick={() => {
              confirm.onTrue();
              popover.onClose();
            }}
            sx={{ color: 'error.main' }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" />
            Delete
          </MenuItem>
        </MenuList>
      </CustomPopover>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete"
        content="Are you sure want to delete?"
        action={
          <Button variant="contained" color="error" onClick={onDeleteRow}>
            Delete
          </Button>
        }
      />
    </>
  );
}
