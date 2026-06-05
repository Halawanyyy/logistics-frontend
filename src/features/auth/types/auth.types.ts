export type BackendPermission = {
  id: number
  module: string
  name: string
  slug: string
  description: string | null
}

export type AuthUser = {
  id: number
  name: string
  email: string
  role: string
  role_id?: number | null
  role_name?: string | null
  role_slug?: string | null
  permissions?: BackendPermission[]
  email_verified_at: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type LoginRequest = {
  email: string
  password: string
}

export type LoginResponse = {
  message: string
  token: string
  user: AuthUser
}

export type MeResponse = {
  user: AuthUser
}

export type LogoutResponse = {
  message: string
}
