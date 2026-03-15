import { apiClient } from "../lib/api-client"
import type { Transaction, TransactionsQueryParams } from "../types/transaction"

export const transactionsApi = {
  getAll: async (params?: TransactionsQueryParams): Promise<Transaction[]> => {
    const queryString = params
      ? `?${new URLSearchParams(params as Record<string, string>).toString()}`
      : ""
    return apiClient.get<Transaction[]>(`/api/transactions${queryString}`)
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
    return apiClient.delete<Transaction>(`/api/transactions/${id}/tags`, {
      tagId,
    } as any)
  },
}
