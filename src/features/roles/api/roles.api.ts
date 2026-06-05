import { apiClient } from '../../../shared/api/axios'
import type {
  CreateRoleRequest,
  DeleteRoleResponse,
  GroupedPermissionsResponse,
  PermissionsListResponse,
  RoleResponse,
  RolesListResponse,
  SyncRolePermissionsRequest,
  UpdateRoleRequest,
} from '../types/role.types'

export async function listRoles() {
  const response = await apiClient.get<RolesListResponse>('/roles')
  return response.data
}

export async function getRole(roleId: string | number) {
  const response = await apiClient.get<RoleResponse>(`/roles/${roleId}`)
  return response.data
}

export async function createRole(payload: CreateRoleRequest) {
  const response = await apiClient.post<RoleResponse>('/roles', payload)
  return response.data
}

export async function updateRole(roleId: string | number, payload: UpdateRoleRequest) {
  const response = await apiClient.put<RoleResponse>(`/roles/${roleId}`, payload)
  return response.data
}

export async function deleteRole(roleId: string | number) {
  const response = await apiClient.delete<DeleteRoleResponse>(`/roles/${roleId}`)
  return response.data
}

export async function syncRolePermissions(
  roleId: string | number,
  payload: SyncRolePermissionsRequest,
) {
  const response = await apiClient.post<RoleResponse>(`/roles/${roleId}/permissions`, payload)
  return response.data
}

export async function listPermissions() {
  const response = await apiClient.get<PermissionsListResponse>('/permissions')
  return response.data
}

export async function listGroupedPermissions() {
  const response = await apiClient.get<GroupedPermissionsResponse>('/permissions/grouped')
  return response.data
}
