import { apiClient } from '../../../shared/api/axios'
import type {
  AssignUserRoleRequest,
  CreateUserRequest,
  DeleteUserResponse,
  UpdateUserRequest,
  UserResponse,
  UsersListResponse,
} from '../types/user.types'

export async function listUsers() {
  const response = await apiClient.get<UsersListResponse>('/users')
  return response.data
}

export async function getUser(userId: string | number) {
  const response = await apiClient.get<UserResponse>(`/users/${userId}`)
  return response.data
}

export async function createUser(payload: CreateUserRequest) {
  const response = await apiClient.post<UserResponse>('/users', payload)
  return response.data
}

export async function updateUser(userId: string | number, payload: UpdateUserRequest) {
  const response = await apiClient.put<UserResponse>(`/users/${userId}`, payload)
  return response.data
}

export async function deleteUser(userId: string | number) {
  const response = await apiClient.delete<DeleteUserResponse>(`/users/${userId}`)
  return response.data
}

export async function assignUserRole(userId: string | number, payload: AssignUserRoleRequest) {
  const response = await apiClient.post<UserResponse>(`/users/${userId}/assign-role`, payload)
  return response.data
}
