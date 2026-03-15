import { apiClient } from "../lib/api-client"
import type { AuthResponse, LoginRequest, RegisterRequest } from "../types/auth"

export const authService = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>(
      "/api/users/login",
      credentials
    )
    apiClient.setToken(response.token)
    apiClient.setUser(response.user)
    return response
  },

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(
      "/api/users/register",
      userData
    )
    apiClient.setToken(response.token)
    apiClient.setUser(response.user)
    return response
  },

  logout: () => {
    apiClient.clearToken()
  },

  getToken: () => {
    return apiClient.getToken()
  },

  isAuthenticated: () => {
    return !!apiClient.getToken()
  },
}
