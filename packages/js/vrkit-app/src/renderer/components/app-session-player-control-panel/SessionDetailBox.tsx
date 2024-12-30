import type { SessionDetail } from "@vrkit-platform/shared"
// import {dialog} from "@electron/remote"
import { styled } from "@mui/material/styles"
import React from "react"
import { getLogger } from "@3fv/logger-proxy"

const log = getLogger(__filename)

interface SessionDetailBoxProps {
  detail: SessionDetail
}

const SessionDetailTable = styled("table", { name: "SessionDetailTable" })(({ theme }) => ({}))

export function SessionDetailBox({ detail }: SessionDetailBoxProps) {
  const winfo = detail?.info?.weekendInfo
  if (!winfo) {
    return <></>
  }

  return (
    <SessionDetailTable>
      <tbody>
        <tr>
          <td>Track</td>
          <td>{winfo.trackDisplayName}</td>
        </tr>
        <tr>
          <td>Length</td>
          <td>{winfo.trackLength}</td>
        </tr>
      </tbody>
    </SessionDetailTable>
  )
}

export default SessionDetailBox