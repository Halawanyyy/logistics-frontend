import type { BackendPermission } from '../../auth/types/auth.types'

export type User = {
  id: number
  name: string
  email: string
  role: string
  role_id?: number | null
  role_name?: string | null
  role_slug?: string | null
  permissions?: BackendPermission[]
  created_at: string
}

export type UsersListResponse = {
  data: User[]
}

export type UserResponse = {
  data: User
}

export type CreateUserRequest = {
  name: string
  email: string
  password: string
  role?: string
  role_id?: number
}

export type UpdateUserRequest = {
  name?: string
  email?: string
  password?: string
  role?: string
  role_id?: number
}

export type DeleteUserResponse = {
  message: string
}

export type AssignUserRoleRequest = {
  role_id: number
}
