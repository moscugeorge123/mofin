import { apiClient } from "../lib/api-client"
import type {
  CreateSnapshotRequest,
  Snapshot,
  SnapshotCollaborator,
  UpdateSnapshotRequest,
} from "../types/snapshot"

export const snapshotsApi = {
  create: async (data: CreateSnapshotRequest): Promise<Snapshot> => {
    return apiClient.post<Snapshot>("/api/snapshots", data)
  },

  getAll: async (): Promise<Snapshot[]> => {
    return apiClient.get<Snapshot[]>("/api/snapshots")
  },

  getById: async (id: string): Promise<Snapshot> => {
    return apiClient.get<Snapshot>(`/api/snapshots/${id}`)
  },

  update: async (
    id: string,
    data: UpdateSnapshotRequest
  ): Promise<Snapshot> => {
    return apiClient.put<Snapshot>(`/api/snapshots/${id}`, data)
  },

  delete: async (id: string): Promise<void> => {
    return apiClient.delete<void>(`/api/snapshots/${id}`)
  },

  getTransactions: async (
    id: string,
    params?: {
      accountId?: string
      startDate?: string
      endDate?: string
      search?: string
      creditDebitIndicator?: string
      minAmount?: string
      maxAmount?: string
      page?: number
      limit?: number
    }
  ): Promise<{
    data: any[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }> => {
    const queryParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value))
        }
      })
    }
    const qs = queryParams.toString()
    return apiClient.get(
      `/api/snapshots/${id}/transactions${qs ? `?${qs}` : ""}`
    )
  },

  getTotals: async (
    id: string,
    params?: {
      accountId?: string
      startDate?: string
      endDate?: string
      search?: string
      creditDebitIndicator?: string
      minAmount?: string
      maxAmount?: string
    }
  ): Promise<{
    credit: number
    debit: number
    balance: number
    byCurrency: Record<string, { credit: number; debit: number }>
  }> => {
    const queryParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value))
        }
      })
    }
    const qs = queryParams.toString()
    return apiClient.get(`/api/snapshots/${id}/totals${qs ? `?${qs}` : ""}`)
  },

  addTransaction: async (id: string, transactionId: string): Promise<void> => {
    return apiClient.post<void>(
      `/api/snapshots/${id}/transactions/${transactionId}`
    )
  },

  removeTransaction: async (
    id: string,
    transactionId: string
  ): Promise<void> => {
    return apiClient.delete<void>(
      `/api/snapshots/${id}/transactions/${transactionId}`
    )
  },

  getCollaborators: async (id: string): Promise<SnapshotCollaborator[]> => {
    return apiClient.get<SnapshotCollaborator[]>(
      `/api/snapshots/${id}/collaborators`
    )
  },

  addCollaborator: async (
    id: string,
    email: string
  ): Promise<{ message: string; collaborator: SnapshotCollaborator }> => {
    return apiClient.post(`/api/snapshots/${id}/collaborators`, { email })
  },

  removeCollaborator: async (
    id: string,
    collaboratorId: string
  ): Promise<void> => {
    return apiClient.delete<void>(
      `/api/snapshots/${id}/collaborators/${collaboratorId}`
    )
  },
}
