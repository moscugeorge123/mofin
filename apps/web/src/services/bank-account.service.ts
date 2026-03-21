import { apiClient } from "../lib/api-client"
import type { User } from "../types/auth"
import type {
  BankAccount,
  CreateBankAccountRequest,
} from "../types/bank-account"

export const bankAccountService = {
  async getAll(): Promise<BankAccount[]> {
    return apiClient.get<BankAccount[]>("/api/bank-accounts")
  },

  async getById(id: string): Promise<BankAccount> {
    return apiClient.get<BankAccount>(`/api/bank-accounts/${id}`)
  },

  async create(data: CreateBankAccountRequest): Promise<BankAccount> {
    return apiClient.post<BankAccount>("/api/bank-accounts", data)
  },

  async update(
    id: string,
    data: Partial<CreateBankAccountRequest>
  ): Promise<BankAccount> {
    return apiClient.put<BankAccount>(`/api/bank-accounts/${id}`, data)
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/api/bank-accounts/${id}`)
  },

  async getCollaborators(accountId: string): Promise<User[]> {
    const response = await apiClient.get<{ collaborators: User[] }>(
      `/api/bank-accounts/${accountId}/collaborators`
    )
    return response.collaborators
  },

  async addCollaborator(
    accountId: string,
    email: string
  ): Promise<BankAccount> {
    return apiClient.post<BankAccount>(
      `/api/bank-accounts/${accountId}/grant-access`,
      { email }
    )
  },

  async removeCollaborator(
    accountId: string,
    userId: string
  ): Promise<BankAccount> {
    return apiClient.post<BankAccount>(
      `/api/bank-accounts/${accountId}/revoke-access`,
      { targetUserId: userId }
    )
  },
}
