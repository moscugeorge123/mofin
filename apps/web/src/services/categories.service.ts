import { apiClient } from "../lib/api-client"
import type { Category, CreateCategoryRequest } from "../types/category"

export const categoriesApi = {
  getAll: async (): Promise<Category[]> => {
    return apiClient.get<Category[]>("/api/categories")
  },

  getById: async (id: string): Promise<Category> => {
    return apiClient.get<Category>(`/api/categories/${id}`)
  },

  create: async (data: CreateCategoryRequest): Promise<Category> => {
    return apiClient.post<Category>("/api/categories", data)
  },

  update: async (
    id: string,
    data: Partial<CreateCategoryRequest>
  ): Promise<Category> => {
    return apiClient.put<Category>(`/api/categories/${id}`, data)
  },

  delete: async (id: string): Promise<void> => {
    return apiClient.delete<void>(`/api/categories/${id}`)
  },

  getTransactions: async (id: string): Promise<any[]> => {
    return apiClient.get<any[]>(`/api/categories/${id}/transactions`)
  },

  getTransactionsByRules: async (
    id: string,
    params?: {
      accountId?: string
      startDate?: string
      endDate?: string
      status?: string
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
    const queryString = queryParams.toString()
    const url = `/api/categories/${id}/transactions/by-rules${queryString ? `?${queryString}` : ""}`
    return apiClient.get(url)
  },

  updateCount: async (id: string): Promise<{ count: number }> => {
    return apiClient.post<{ count: number }>(
      `/api/categories/${id}/update-count`
    )
  },
}
