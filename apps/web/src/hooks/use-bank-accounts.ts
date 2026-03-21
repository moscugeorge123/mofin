import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
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

export function useCollaborators(accountId: string) {
  return useQuery({
    queryKey: ["bank-accounts", accountId, "collaborators"],
    queryFn: () => bankAccountService.getCollaborators(accountId),
    enabled: !!accountId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

export function useAddCollaborator() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ accountId, email }: { accountId: string; email: string }) =>
      bankAccountService.addCollaborator(accountId, email),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["bank-accounts", variables.accountId, "collaborators"],
      })
      toast.success("Collaborator added successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to add collaborator")
    },
  })
}

export function useRemoveCollaborator() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      accountId,
      userId,
    }: {
      accountId: string
      userId: string
    }) => bankAccountService.removeCollaborator(accountId, userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["bank-accounts", variables.accountId, "collaborators"],
      })
      toast.success("Collaborator removed successfully")
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error || "Failed to remove collaborator"
      )
    },
  })
}
