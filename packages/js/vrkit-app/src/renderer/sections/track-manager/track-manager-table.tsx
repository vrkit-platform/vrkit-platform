import type { TableProps } from 'vrkit-app-renderer/components/table';

import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import Tooltip from '@mui/material/Tooltip';
import { useTheme } from '@mui/material/styles';
import TableBody from '@mui/material/TableBody';
import IconButton from '@mui/material/IconButton';
import TableContainer from '@mui/material/TableContainer';
import { tableCellClasses } from '@mui/material/TableCell';
import { tablePaginationClasses } from '@mui/material/TablePagination';

import { Iconify } from 'vrkit-app-renderer/components/iconify';
import {
  TableNoData,
  TableHeadCustom,
  TableSelectedAction,
  TablePaginationCustom,
} from 'vrkit-app-renderer/components/table';

import { TrackManagerTableRow } from './track-manager-table-row';
import { TrackMapFile } from "vrkit-models"

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'name', label: 'Name' },
  { id: 'size', label: 'Size', width: 120 },
  { id: 'type', label: 'Type', width: 120 },
  { id: 'modifiedAt', label: 'Modified', width: 140 },
  {
    id: 'shared',
    label: 'Shared',
    align: 'right',
    width: 140,
  },
  { id: '', width: 88 },
];

// ----------------------------------------------------------------------

type Props = {
  table: TableProps;
  notFound: boolean;
  data: TrackMapFile[];
  onOpenConfirm: () => void;
  onDeleteRow: (id: string) => void;
};

export function TrackManagerTable({
  table,
  notFound,
  onDeleteRow,
  data,
  onOpenConfirm,
}: Props) {
  const theme = useTheme();

  const {
    dense,
    page,
    order,
    orderBy,
    rowsPerPage,
    //
    selected,
    onSelectRow,
    onSelectAllRows,
    //
    onSort,
    onChangeDense,
    onChangePage,
    onChangeRowsPerPage,
  } = table;

  return (
    <>
      <Box
        sx={{
          position: 'relative',
          m: { md: theme.spacing(-2, -3, 0, -3) },
        }}
      >
        <TableSelectedAction
          dense={dense}
          numSelected={selected.length}
          rowCount={data.length}
          onSelectAllRows={(checked) =>
            onSelectAllRows(
              checked,
              data.map((row) => row.trackLayoutMetadata.id)
            )
          }
          action={
            <>
              <Tooltip title="Share">
                <IconButton color="primary">
                  <Iconify icon="solar:share-bold" />
                </IconButton>
              </Tooltip>

              <Tooltip title="Delete">
                <IconButton color="primary" onClick={onOpenConfirm}>
                  <Iconify icon="solar:trash-bin-trash-bold" />
                </IconButton>
              </Tooltip>
            </>
          }
          sx={{
            pl: 1,
            pr: 2,
            top: 16,
            left: 24,
            right: 24,
            width: 'auto',
            borderRadius: 1.5,
          }}
        />

        <TableContainer sx={{ px: { md: 3 } }}>
          <Table
            size={dense ? 'small' : 'medium'}
            sx={{ minWidth: 960, borderCollapse: 'separate', borderSpacing: '0 16px' }}
          >
            <TableHeadCustom
              order={order}
              orderBy={orderBy}
              headLabel={TABLE_HEAD}
              rowCount={data.length}
              numSelected={selected.length}
              onSort={onSort}
              onSelectAllRows={(checked) =>
                onSelectAllRows(
                  checked,
                  data.map((row) => row.trackLayoutMetadata.id)
                )
              }
              sx={{
                [`& .${tableCellClasses.head}`]: {
                  '&:first-of-type': { borderTopLeftRadius: 12, borderBottomLeftRadius: 12 },
                  '&:last-of-type': { borderTopRightRadius: 12, borderBottomRightRadius: 12 },
                },
              }}
            />

            <TableBody>
              {data
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row) => (
                  <TrackManagerTableRow
                    key={row.trackLayoutMetadata.id}
                    row={row}
                    selected={selected.includes(row.trackLayoutMetadata.id)}
                    onSelectRow={() => onSelectRow(row.trackLayoutMetadata.id)}
                    onDeleteRow={() => onDeleteRow(row.trackLayoutMetadata.id)}
                  />
                ))}

              <TableNoData
                notFound={notFound}
                sx={{
                  m: -2,
                  borderRadius: 1.5,
                  border: `dashed 1px ${theme.vars.palette.divider}`,
                }}
              />
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <TablePaginationCustom
        page={page}
        dense={dense}
        rowsPerPage={rowsPerPage}
        count={data.length}
        onPageChange={onChangePage}
        onChangeDense={onChangeDense}
        onRowsPerPageChange={onChangeRowsPerPage}
        sx={{ [`& .${tablePaginationClasses.toolbar}`]: { borderTopColor: 'transparent' } }}
      />
    </>
  );
}
