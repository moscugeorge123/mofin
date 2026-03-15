import { apiClient } from "../lib/api-client"
import type {
  PaginatedTransactionsResponse,
  Transaction,
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
    file: { id: string; originalName: string; status: string }
    transactions: Transaction[]
    count: number
  }> => {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("accountId", accountId)

    return apiClient.post("/api/transactions/extract", formData)
  },
}
