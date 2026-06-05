export type PermissionRecord = {
  id: number
  module: string
  name: string
  slug: string
  description: string | null
}

export type Role = {
  id: number
  name: string
  slug: string
  description: string | null
  status: string
  is_system: boolean
  permissions: Record<string, PermissionRecord[]>
  created_at: string
}

export type GroupedPermissionsEntry = {
  module: string
  permissions: PermissionRecord[]
}

export type RolesListResponse = {
  data: Role[]
}

export type RoleResponse = {
  data: Role
}

export type PermissionsListResponse = {
  data: PermissionRecord[]
}

export type GroupedPermissionsResponse = {
  data: GroupedPermissionsEntry[]
}

export type CreateRoleRequest = {
  name: string
  slug: string
  description?: string
  status: string
  permissions?: number[]
}

export type UpdateRoleRequest = {
  name?: string
  slug?: string
  description?: string
  status?: string
}

export type SyncRolePermissionsRequest = {
  permissions: number[]
}

export type DeleteRoleResponse = {
  message: string
}
