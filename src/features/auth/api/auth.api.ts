import { apiClient } from '../../../shared/api/axios'
import type {
  LoginRequest,
  LoginResponse,
  LogoutResponse,
  MeResponse,
} from '../types/auth.types'

export async function login(payload: LoginRequest) {
  const response = await apiClient.post<LoginResponse>('/auth/login', payload)
  return response.data
}

export async function getMe() {
  const response = await apiClient.get<MeResponse>('/auth/me')
  return response.data
}

export async function logout() {
  const response = await apiClient.post<LogoutResponse>('/auth/logout')
  return response.data
}

export async function pingAuth() {
  const response = await apiClient.get<{ message: string }>('/auth/ping')
  return response.data
}
