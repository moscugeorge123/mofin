import { apiClient } from "../lib/api-client"
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
}
