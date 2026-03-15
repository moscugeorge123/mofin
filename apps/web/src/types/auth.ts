export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  timezone?: string
  locale?: string
  currency?: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  firstName: string
  lastName: string
  email: string
  password: string
  timezone?: string
  locale?: string
  currency?: string
}

export interface AuthResponse {
  token: string
  user: User
}
