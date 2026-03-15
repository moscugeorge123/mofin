import { apiClient } from "../lib/api-client"
import type { User } from "../types/auth"

export const useUser = (): User | null => {
  return apiClient.getUser<User>()
}
