import { createEntityAdapter, EntityState } from "@reduxjs/toolkit"
import { get } from "lodash/fp"
import type { AppRootState } from "../../AppRootState"


export interface DataState {
  // workspaces: EntityState<Workspace>
  // projects: EntityState<Project>
  // issues: EntityState<Issue>
  // collaborators: EntityState<Collaborator>
  // tags: EntityState<Tag>
  // milestones: EntityState<Milestone>
  // accounts: EntityState<Account>

  // selectedWorkspaceId: string
  // pendingAccount?: PendingAccount
}

// export const workspaceSelectors = workspaceAdapter.getSelectors<AppRootState>(
//   state => state.data.workspaces
// )
//
//
// export const projectSelectors = projectAdapter.getSelectors<AppRootState>(
//   state => state.data.projects
// )

