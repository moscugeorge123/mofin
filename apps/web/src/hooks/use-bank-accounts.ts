import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { bankAccountService } from "../services/bank-account.service"
import type { CreateBankAccountRequest } from "../types/bank-account"

export function useBankAccounts() {
  return useQuery({
    queryKey: ["bank-accounts"],
    queryFn: () => bankAccountService.getAll(),
  })
}

export function useBankAccount(id: string) {
  return useQuery({
    queryKey: ["bank-accounts", id],
    queryFn: () => bankAccountService.getById(id),
    enabled: !!id,
  })
}

export function useCreateBankAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateBankAccountRequest) =>
      bankAccountService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] })
    },
  })
}

export function useUpdateBankAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: Partial<CreateBankAccountRequest>
    }) => bankAccountService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] })
    },
  })
}
