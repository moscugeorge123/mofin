import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { transactionsApi } from "../services/transactions.service"
import type { Transaction, TransactionsQueryParams } from "../types/transaction"

export const transactionKeys = {
  all: ["transactions"] as const,
  lists: () => [...transactionKeys.all, "list"] as const,
  list: (params?: TransactionsQueryParams) =>
    [...transactionKeys.lists(), params] as const,
  details: () => [...transactionKeys.all, "detail"] as const,
  detail: (id: string) => [...transactionKeys.details(), id] as const,
}

export function useTransactions(params?: TransactionsQueryParams) {
  return useQuery({
    queryKey: transactionKeys.list(params),
    queryFn: () => transactionsApi.getAll(params),
  })
}

export function useTransaction(id: string) {
  return useQuery({
    queryKey: transactionKeys.detail(id),
    queryFn: () => transactionsApi.getById(id),
    enabled: !!id,
  })
}

export function useCreateTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<Transaction>) => transactionsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() })
    },
  })
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Transaction> }) =>
      transactionsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() })
      queryClient.invalidateQueries({
        queryKey: transactionKeys.detail(variables.id),
      })
    },
  })
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => transactionsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() })
    },
  })
}

export function useAddTransactionTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, tagId }: { id: string; tagId: string }) =>
      transactionsApi.addTag(id, tagId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() })
      queryClient.invalidateQueries({
        queryKey: transactionKeys.detail(variables.id),
      })
    },
  })
}

export function useRemoveTransactionTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, tagId }: { id: string; tagId: string }) =>
      transactionsApi.removeTag(id, tagId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() })
      queryClient.invalidateQueries({
        queryKey: transactionKeys.detail(variables.id),
      })
    },
  })
}
