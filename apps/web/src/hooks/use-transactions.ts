import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useRef } from "react"
import { transactionsApi } from "../services/transactions.service"
import type { Transaction, TransactionsQueryParams } from "../types/transaction"

export const transactionKeys = {
  all: ["transactions"] as const,
  lists: () => [...transactionKeys.all, "list"] as const,
  list: (params?: TransactionsQueryParams) =>
    [...transactionKeys.lists(), params] as const,
  details: () => [...transactionKeys.all, "detail"] as const,
  detail: (id: string) => [...transactionKeys.details(), id] as const,
  files: () => [...transactionKeys.all, "files"] as const,
  fileStatus: (fileId: string) => [...transactionKeys.files(), fileId] as const,
}

export function useTransactions(params?: TransactionsQueryParams) {
  return useQuery({
    queryKey: transactionKeys.list(params),
    queryFn: () => transactionsApi.getAll(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
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

export function useUploadTransactionFile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ file, accountId }: { file: File; accountId: string }) =>
      transactionsApi.uploadFile(file, accountId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() })
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

export function useFileStatus(fileId: string | null, enabled = true) {
  return useQuery({
    queryKey: transactionKeys.fileStatus(fileId || ""),
    queryFn: () => transactionsApi.getFileStatus(fileId!),
    enabled: !!fileId && enabled,
    refetchInterval: (query) => {
      // Poll every 2 seconds if status is pending or processing
      const status = query.state.data?.status
      if (status === "pending" || status === "processing") {
        return 2000
      }
      // Stop polling if completed or failed
      return false
    },
    staleTime: 0, // Always refetch
  })
}

export function useTransactionFiles() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: transactionKeys.files(),
    queryFn: () => transactionsApi.getAllFiles(),
    staleTime: 0, // Always consider data stale to ensure fresh checks
    refetchInterval: (queryData) => {
      // Check if there are any pending or processing files
      const files = queryData.state.data?.files || []
      const hasPendingFiles = files.some(
        (file) => file.status === "pending" || file.status === "processing"
      )

      // Poll every 3 seconds if there are pending files
      if (hasPendingFiles) {
        return 3000
      }

      // Stop polling if all files are completed or failed, but refetch once every 30 seconds to check for new files
      return 30000
    },
  })

  // Watch for completed files and invalidate transactions list
  const previousDataRef = useRef<typeof query.data>(undefined)

  useEffect(() => {
    const currentData = query.data
    const previousData = previousDataRef.current

    if (currentData && previousData) {
      const currentCompleted = currentData.files.filter(
        (f) => f.status === "completed"
      )
      const previousCompleted = previousData.files.filter(
        (f) => f.status === "completed"
      )

      // If there are newly completed files, invalidate transactions
      if (currentCompleted.length > previousCompleted.length) {
        queryClient.invalidateQueries({ queryKey: transactionKeys.lists() })
      }
    }

    previousDataRef.current = currentData
  }, [query.data, queryClient])

  return query
}
