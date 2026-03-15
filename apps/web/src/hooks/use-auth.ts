import { useMutation } from "@tanstack/react-query"
import { useRouter } from "@tanstack/react-router"
import { authService } from "../services/auth.service"
import type { LoginRequest, RegisterRequest } from "../types/auth"

export function useLogin() {
  const router = useRouter()

  return useMutation({
    mutationFn: (credentials: LoginRequest) => authService.login(credentials),
    onSuccess: () => {
      router.navigate({ to: "/" })
    },
  })
}

export function useRegister() {
  const router = useRouter()

  return useMutation({
    mutationFn: (data: RegisterRequest) => authService.register(data),
    onSuccess: () => {
      router.navigate({ to: "/" })
    },
  })
}

export function useLogout() {
  const router = useRouter()

  return useMutation({
    mutationFn: () => {
      authService.logout()
      return Promise.resolve()
    },
    onSuccess: () => {
      router.navigate({ to: "/login" })
    },
  })
}
