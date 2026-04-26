export interface Snapshot {
  _id: string
  ownerId: string
  groupId: string
  groupName: string
  groupIcon?: string
  groupColor?: string
  name: string
  description?: string
  transactionIds: string[]
  collaborators: string[]
  createdAt: string
  updatedAt: string
}

export interface SnapshotCollaborator {
  _id: string
  firstName: string
  lastName: string
  email: string
}

export interface CreateSnapshotRequest {
  groupId: string
  name?: string
  description?: string
}

export interface UpdateSnapshotRequest {
  name?: string
  description?: string
}
