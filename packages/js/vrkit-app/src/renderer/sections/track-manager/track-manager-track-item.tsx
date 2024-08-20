import type { CardProps } from "@mui/material/Card"
import Paper from "@mui/material/Paper"
import Button from "@mui/material/Button"
import MenuList from "@mui/material/MenuList"
import MenuItem from "@mui/material/MenuItem"
import { useTheme } from "@mui/material/styles"
import Typography from "@mui/material/Typography"

import { useBoolean } from "vrkit-app-renderer/hooks/use-boolean"
import { useCopyToClipboard } from "vrkit-app-renderer/hooks/use-copy-to-clipboard"

import { maxLine } from "vrkit-app-renderer/theme/styles"
import { Iconify } from "vrkit-app-renderer/components/iconify"
import { ConfirmDialog } from "vrkit-app-renderer/components/custom-dialog"
import {
  CustomPopover,
  usePopover
} from "vrkit-app-renderer/components/custom-popover"
import { TrackMapFile } from "vrkit-models"

// ----------------------------------------------------------------------

type Props = CardProps & {
  selected?: boolean
  track: TrackMapFile
  onDelete: () => void
  onSelect?: () => void
}

export function TrackManagerFileItem({
  track,
  selected,
  onSelect,
  onDelete,
  sx,
  ...other
}: Props) {
  const theme = useTheme()

  const share = useBoolean()

  const confirm = useBoolean()

  const details = useBoolean()

  const popover = usePopover()

  const checkbox = useBoolean()

  const { copy } = useCopyToClipboard()

  // const renderIcon = (
  //   <Box
  //     onMouseEnter={checkbox.onTrue}
  //     onMouseLeave={checkbox.onFalse}
  //     sx={{ display: 'inline-flex', width: 36, height: 36 }}
  //   >
  //     {(checkbox.value || selected) && onSelect ? (
  //       <Checkbox
  //         checked={selected}
  //         onClick={onSelect}
  //         icon={<Iconify icon="eva:radio-button-off-fill" />}
  //         checkedIcon={<Iconify icon="eva:checkmark-circle-2-fill" />}
  //         inputProps={{ id: `item-checkbox-${file.id}`, 'aria-label': `Item checkbox` }}
  //         sx={{ width: 1, height: 1 }}
  //       />
  //     ) : (
  //       <FileThumbnail file={file.type} sx={{ width: 1, height: 1 }} />
  //     )}
  //   </Box>
  // );

  // const renderAction = (
  //   <Stack direction="row" alignItems="center" sx={{ top: 8, right: 8, position: 'absolute' }}>
  //     <Checkbox
  //       color="warning"
  //       icon={<Iconify icon="eva:star-outline" />}
  //       checkedIcon={<Iconify icon="eva:star-fill" />}
  //       checked={favorite.value}
  //       onChange={favorite.onToggle}
  //       inputProps={{ id: `favorite-checkbox-${file.id}`, 'aria-label': `Favorite checkbox` }}
  //     />
  //
  //     <IconButton color={popover.open ? 'inherit' : 'default'} onClick={popover.onOpen}>
  //       <Iconify icon="eva:more-vertical-fill" />
  //     </IconButton>
  //   </Stack>
  // );

  const renderText = (
    <>
      <Typography
        variant="subtitle2"
        onClick={details.onTrue}
        sx={{
          ...maxLine({ line: 2, persistent: theme.typography.subtitle2 }),
          mt: 2,
          mb: 0.5,
          width: 1
        }}
      >
        {track.trackLayoutMetadata.trackMetadata.name} &gt;&gt;{" "}
        {track.trackLayoutMetadata.name}
      </Typography>
    </>
  )

  return (
    <>
      <Paper
        variant="outlined"
        sx={{
          p: 2.5,
          display: "flex",
          borderRadius: 2,
          cursor: "pointer",
          position: "relative",
          bgcolor: "transparent",
          flexDirection: "column",
          alignItems: "flex-start",
          ...((checkbox.value || selected) && {
            bgcolor: "background.paper",
            boxShadow: theme.customShadows.z20
          }),
          ...sx
        }}
        {...other}
      >
        {renderText}
      </Paper>

      <CustomPopover
        open={popover.open}
        anchorEl={popover.anchorEl}
        onClose={popover.onClose}
        slotProps={{ arrow: { placement: "right-top" } }}
      >
        <MenuList>
          <MenuItem
            onClick={() => {
              confirm.onTrue()
              popover.onClose()
            }}
            sx={{ color: "error.main" }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" />
            Delete
          </MenuItem>
        </MenuList>
      </CustomPopover>

      {/*<TrackManagerTrackDetails*/}
      {/*  item={file}*/}
      {/*  favorited={favorite.value}*/}
      {/*  onFavorite={favorite.onToggle}*/}
      {/*  onCopyLink={handleCopy}*/}
      {/*  open={details.value}*/}
      {/*  onClose={details.onFalse}*/}
      {/*  onDelete={() => {*/}
      {/*    details.onFalse();*/}
      {/*    onDelete();*/}
      {/*  }}*/}
      {/*/>*/}

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete"
        content="Are you sure want to delete?"
        action={
          <Button
            variant="contained"
            color="error"
            onClick={onDelete}
          >
            Delete
          </Button>
        }
      />
    </>
  )
}
