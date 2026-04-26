import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { snapshotsApi } from "../services/snapshots.service"
import type {
  CreateSnapshotRequest,
  UpdateSnapshotRequest,
} from "../types/snapshot"

export const snapshotKeys = {
  all: ["snapshots"] as const,
  lists: () => [...snapshotKeys.all, "list"] as const,
  details: () => [...snapshotKeys.all, "detail"] as const,
  detail: (id: string) => [...snapshotKeys.details(), id] as const,
  transactions: (id: string, params?: object) =>
    [...snapshotKeys.detail(id), "transactions", params] as const,
  totals: (id: string, params?: object) =>
    [...snapshotKeys.detail(id), "totals", params] as const,
  collaborators: (id: string) =>
    [...snapshotKeys.detail(id), "collaborators"] as const,
}

export function useSnapshots() {
  return useQuery({
    queryKey: snapshotKeys.lists(),
    queryFn: () => snapshotsApi.getAll(),
    staleTime: 5 * 60 * 1000,
  })
}

export function useSnapshot(id: string) {
  return useQuery({
    queryKey: snapshotKeys.detail(id),
    queryFn: () => snapshotsApi.getById(id),
    enabled: !!id,
  })
}

export function useSnapshotTotals(
  id: string,
  params?: Parameters<typeof snapshotsApi.getTotals>[1]
) {
  return useQuery({
    queryKey: snapshotKeys.totals(id, params),
    queryFn: () => snapshotsApi.getTotals(id, params),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

export function useSnapshotCollaborators(id: string) {
  return useQuery({
    queryKey: snapshotKeys.collaborators(id),
    queryFn: () => snapshotsApi.getCollaborators(id),
    enabled: !!id,
  })
}

export function useCreateSnapshot() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateSnapshotRequest) => snapshotsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: snapshotKeys.lists() })
    },
  })
}

export function useUpdateSnapshot() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSnapshotRequest }) =>
      snapshotsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: snapshotKeys.lists() })
      queryClient.invalidateQueries({
        queryKey: snapshotKeys.detail(variables.id),
      })
    },
  })
}

export function useDeleteSnapshot() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => snapshotsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: snapshotKeys.lists() })
    },
  })
}

export function useAddSnapshotCollaborator(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (email: string) => snapshotsApi.addCollaborator(id, email),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: snapshotKeys.collaborators(id),
      })
    },
  })
}

export function useRemoveSnapshotCollaborator(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (collaboratorId: string) =>
      snapshotsApi.removeCollaborator(id, collaboratorId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: snapshotKeys.collaborators(id),
      })
    },
  })
}
