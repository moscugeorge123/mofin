import { apiClient } from "../lib/api-client"
import type {
  PaginatedTransactionsResponse,
  Transaction,
  TransactionFile,
  TransactionsQueryParams,
} from "../types/transaction"

export const transactionsApi = {
  getAll: async (
    params?: TransactionsQueryParams
  ): Promise<PaginatedTransactionsResponse> => {
    const queryParams = new URLSearchParams()

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          queryParams.append(key, String(value))
        }
      })
    }

    const queryString = queryParams.toString()
    return apiClient.get<PaginatedTransactionsResponse>(
      `/api/transactions${queryString ? `?${queryString}` : ""}`
    )
  },

  getById: async (id: string): Promise<Transaction> => {
    return apiClient.get<Transaction>(`/api/transactions/${id}`)
  },

  create: async (data: Partial<Transaction>): Promise<Transaction> => {
    return apiClient.post<Transaction>("/api/transactions", data)
  },

  update: async (
    id: string,
    data: Partial<Transaction>
  ): Promise<Transaction> => {
    return apiClient.put<Transaction>(`/api/transactions/${id}`, data)
  },

  delete: async (id: string): Promise<void> => {
    return apiClient.delete<void>(`/api/transactions/${id}`)
  },

  addTag: async (id: string, tagId: string): Promise<Transaction> => {
    return apiClient.post<Transaction>(`/api/transactions/${id}/tags`, {
      tagId,
    })
  },

  removeTag: async (id: string, tagId: string): Promise<Transaction> => {
    return apiClient.delete<Transaction>(
      `/api/transactions/${id}/tags/${tagId}`
    )
  },

  uploadFile: async (
    file: File,
    accountId: string
  ): Promise<{
    message: string
    fileId: string
    status: string
    transactionCount?: number
    transactions?: Transaction[]
    cached?: boolean
  }> => {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("accountId", accountId)

    return apiClient.post("/api/transactions/extract", formData)
  },

  getFileStatus: async (
    fileId: string
  ): Promise<{
    fileId: string
    originalName: string
    status: string
    errorMessage?: string
    transactionCount: number
    transactions: Transaction[]
    accountId: any
    createdAt: string
    updatedAt: string
  }> => {
    return apiClient.get(`/api/transactions/files/${fileId}`)
  },

  getAllFiles: async (
    status?: string
  ): Promise<{
    files?: TransactionFile[]
  }> => {
    const queryParams = status ? `?status=${status}` : ""
    return apiClient.get(`/api/transactions/files${queryParams}`)
  },

  getTotals: async (
    params?: TransactionsQueryParams
  ): Promise<{
    credit: number
    debit: number
    balance: number
  }> => {
    const queryParams = new URLSearchParams()

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          // Skip pagination params for totals
          if (key !== "page" && key !== "limit") {
            queryParams.append(key, String(value))
          }
        }
      })
    }

    const queryString = queryParams.toString()
    return apiClient.get<{
      credit: number
      debit: number
      balance: number
    }>(`/api/transactions/totals${queryString ? `?${queryString}` : ""}`)
  },

  getFileTotals: async (
    fileId: string
  ): Promise<{
    credit: number
    debit: number
    balance: number
  }> => {
    return apiClient.get<{
      credit: number
      debit: number
      balance: number
    }>(`/api/transactions/files/${fileId}/totals`)
  },

  renameFile: async (
    fileId: string,
    originalName: string
  ): Promise<{
    message: string
    file: {
      fileId: string
      originalName: string
    }
  }> => {
    return apiClient.put(`/api/transactions/files/${fileId}/rename`, {
      originalName,
    })
  },

  deleteFile: async (
    fileId: string
  ): Promise<{
    message: string
    transactionCount: number
  }> => {
    return apiClient.delete(`/api/transactions/files/${fileId}`)
  },
}
