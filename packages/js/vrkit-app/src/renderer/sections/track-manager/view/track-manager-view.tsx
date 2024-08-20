import { useCallback, useState } from "react"

import Stack from "@mui/material/Stack"
import Button from "@mui/material/Button"
import Typography from "@mui/material/Typography"

import { useBoolean } from "vrkit-app-renderer/hooks/use-boolean"

import { AppContent } from "../../../layouts/app"

import { toast } from "vrkit-app-renderer/components/snackbar"
import { Iconify } from "vrkit-app-renderer/components/iconify"
import { EmptyContent } from "vrkit-app-renderer/components/empty-content"
import { ConfirmDialog } from "vrkit-app-renderer/components/custom-dialog"
import { useTable } from "vrkit-app-renderer/components/table"

import { TrackManagerTable } from "../track-manager-table"
import { TrackMapFile } from "vrkit-models"
import { BoxProps } from "@mui/material/Box"
import { useAsync } from "../../../hooks"

// ----------------------------------------------------------------------

export interface TrackManagerViewProps extends BoxProps {

}

export interface TrackMapFileCriteria {
}

async function getTrackMapFiles(criteria: TrackMapFileCriteria = {}) {

}

export function TrackManagerView(props: TrackManagerViewProps) {
  const table = useTable({ defaultRowsPerPage: 50 })
  
  // TODO: Implement `useAsync` to call VRKNative
  //  - [ ] implement native route handler for listing tracks
  const [criteria, setCriteria] = useState<TrackMapFileCriteria>({})
  const allFilesAsync = useAsync(getTrackMapFiles,[criteria])
  const allFiles: TrackMapFile[] = []
  
  
  const confirm = useBoolean()
  const processTelem = useBoolean()

  const [tableData, setTableData] = useState<TrackMapFile[]>(allFiles)

  const notFound = tableData.length < 1

  const handleDeleteItem = useCallback(
    (id: string) => {
      const deleteRow = tableData.filter(
        row => row.trackLayoutMetadata.id !== id
      )
      
      toast.success("Delete success!")
      setTableData(deleteRow)

      // table.onUpdatePageDeleteRow(dataInPage.length);
    },
    [table, tableData]
  )

  const handleDeleteItems = useCallback(() => {
    const deleteRows = tableData.filter(
      row => !table.selected.includes(row.trackLayoutMetadata.id)
    )

    toast.success("Delete success!")

    setTableData(deleteRows)

    // table.onUpdatePageDeleteRows({
    //   totalRowsInPage: dataInPage.length,
    //   totalRowsFiltered: dataFiltered.length,
    // });
  }, [table, tableData])

  return (
    <>
      <AppContent>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Typography variant="h4">Track manager</Typography>
          <Button
            variant="contained"
            startIcon={<Iconify icon="eva:cloud-upload-fill" />}
            onClick={processTelem.onTrue}
          >
            Process Telemetry
          </Button>
        </Stack>

        {notFound ? (
          <EmptyContent
            filled
            sx={{ py: 10 }}
          />
        ) : (
          <TrackManagerTable
            table={table}
            data={tableData}
            onDeleteRow={handleDeleteItem}
            notFound={notFound}
            onOpenConfirm={confirm.onTrue}
          />
        )}
      </AppContent>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete"
        content={
          <>
            Are you sure want to delete{" "}
            <strong> {table.selected.length} </strong> items?
          </>
        }
        action={
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              handleDeleteItems()
              confirm.onFalse()
            }}
          >
            Delete
          </Button>
        }
      />
    </>
  )
}
