import { PERMISSIONS, type Permission } from './permission-keys'
import type { AuthUser } from '../../features/auth/types/auth.types'

export type UserRole = 'admin' | 'staff' | 'warehouse' | 'finance' | 'driver'

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [PERMISSIONS.ALL],
  staff: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.ORDERS_VIEW,
    PERMISSIONS.ORDERS_CREATE,
    PERMISSIONS.ORDERS_UPDATE,
    PERMISSIONS.SHIPMENTS_VIEW,
    PERMISSIONS.SHIPMENTS_CREATE,
    PERMISSIONS.SHIPMENTS_UPDATE_STATUS,
    PERMISSIONS.SHIPMENTS_ASSIGN_DRIVER,
    PERMISSIONS.MERCHANTS_VIEW,
  ],
  warehouse: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.ORDERS_VIEW,
    PERMISSIONS.WAREHOUSE_VIEW,
    PERMISSIONS.WAREHOUSE_CREATE,
    PERMISSIONS.WAREHOUSE_UPDATE,
    PERMISSIONS.WAREHOUSE_DELETE,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.INVENTORY_CREATE,
    PERMISSIONS.INVENTORY_UPDATE,
    PERMISSIONS.INVENTORY_DELETE,
    PERMISSIONS.STOCK_ADJUST,
    PERMISSIONS.STOCK_MOVEMENTS_VIEW,
    PERMISSIONS.WAREHOUSE_RETURNS_VIEW,
    PERMISSIONS.WAREHOUSE_RETURNS_CREATE,
    PERMISSIONS.WAREHOUSE_CHARGES_VIEW,
    PERMISSIONS.WAREHOUSE_CHARGES_CREATE,
    PERMISSIONS.WAREHOUSE_CHARGES_UPDATE,
    PERMISSIONS.WAREHOUSE_CHARGES_DELETE,
    PERMISSIONS.WAREHOUSE_LOCATIONS_VIEW,
    PERMISSIONS.WAREHOUSE_LOCATIONS_CREATE,
    PERMISSIONS.PICKING_LISTS_VIEW,
    PERMISSIONS.PICKING_LISTS_CREATE,
    PERMISSIONS.PICKING_LISTS_SCAN,
    PERMISSIONS.PICKING_LISTS_CANCEL,
    PERMISSIONS.PACKING_TASKS_VIEW,
    PERMISSIONS.PACKING_TASKS_CREATE,
    PERMISSIONS.PACKING_TASKS_COMPLETE,
    PERMISSIONS.STORAGE_FEE_RULES_VIEW,
    PERMISSIONS.STORAGE_FEE_RULES_CREATE,
    PERMISSIONS.STORAGE_FEES_GENERATE,
    PERMISSIONS.PICK_PACK_FEE_RULES_VIEW,
    PERMISSIONS.PICK_PACK_FEE_RULES_CREATE,
    PERMISSIONS.PICK_PACK_FEES_GENERATE,
    PERMISSIONS.WAREHOUSE_KPIS_VIEW,
    PERMISSIONS.MERCHANT_INBOUND_REQUESTS_VIEW,
    PERMISSIONS.MERCHANT_INBOUND_REQUESTS_MANAGE,
    PERMISSIONS.ORDERS_RESERVE_STOCK,
    PERMISSIONS.ORDERS_RELEASE_STOCK,
    PERMISSIONS.ORDERS_FULFILL_WAREHOUSE,
  ],
  finance: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.FINANCE_VIEW,
    PERMISSIONS.PAYOUTS_VIEW,
    PERMISSIONS.PAYOUTS_CREATE,
    PERMISSIONS.PAYOUTS_UPDATE,
    PERMISSIONS.PAYOUTS_DELETE,
    PERMISSIONS.FINANCE_PAYOUTS_APPROVE,
    PERMISSIONS.FINANCE_PAYOUTS_REJECT,
    PERMISSIONS.FINANCE_PAYOUTS_COMPLETE,
    PERMISSIONS.CASH_CLOSURES_VIEW,
    PERMISSIONS.CASH_CLOSURES_CREATE,
    PERMISSIONS.CASH_CLOSURES_UPDATE,
    PERMISSIONS.CASH_CLOSURES_DELETE,
    PERMISSIONS.EXPENSES_VIEW,
    PERMISSIONS.EXPENSES_CREATE,
    PERMISSIONS.EXPENSES_UPDATE,
    PERMISSIONS.EXPENSES_DELETE,
    PERMISSIONS.FINANCE_EXPENSES_APPROVE,
    PERMISSIONS.FINANCE_EXPENSES_REJECT,
    PERMISSIONS.FINANCE_EXPENSES_PAY,
    PERMISSIONS.INVOICES_VIEW,
    PERMISSIONS.INVOICES_CREATE,
    PERMISSIONS.INVOICES_UPDATE,
    PERMISSIONS.INVOICES_DELETE,
    PERMISSIONS.INVOICES_DOWNLOAD,
    PERMISSIONS.FINANCE_TREASURY_VIEW,
    PERMISSIONS.FINANCE_TREASURY_CREATE,
    PERMISSIONS.FINANCE_TREASURY_UPDATE,
    PERMISSIONS.FINANCE_TREASURY_DELETE,
    PERMISSIONS.FINANCE_RECONCILIATION_VIEW,
    PERMISSIONS.FINANCE_REPORTS_VIEW,
    PERMISSIONS.FINANCE_REPORTS_DAILY_CASH,
    PERMISSIONS.FINANCE_REPORTS_MERCHANT_LEDGER,
    PERMISSIONS.FINANCE_REPORTS_DRIVER_DISCREPANCIES,
    PERMISSIONS.FINANCE_REPORTS_WAREHOUSE_REVENUE,
    PERMISSIONS.FINANCE_REPORTS_PROFIT_LOSS,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.MERCHANTS_VIEW,
  ],
  driver: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.DRIVER_SHIPMENTS_VIEW,
    PERMISSIONS.DRIVER_MANIFEST_VIEW,
    PERMISSIONS.DRIVER_CASH_VIEW,
  ],
}

function getRolePermissions(role: string | null | undefined) {
  if (!role || !(role in ROLE_PERMISSIONS)) {
    return []
  }

  return ROLE_PERMISSIONS[role as UserRole]
}

function isElevatedAdminRole(role: string | null | undefined) {
  return role === 'admin' || role === 'super_admin'
}

function getBackendPermissionSlugs(user: AuthUser | null | undefined) {
  return user?.permissions?.map((item) => item.slug) ?? []
}

function getEffectivePermissions(user: AuthUser | null | undefined) {
  if (!user) {
    return []
  }

  const backendPermissions = getBackendPermissionSlugs(user)
  if (backendPermissions.length > 0) {
    return backendPermissions
  }

  if (isElevatedAdminRole(user.role) || isElevatedAdminRole(user.role_slug)) {
    return [PERMISSIONS.ALL]
  }

  return getRolePermissions(user.role)
}

export function hasPermission(user: AuthUser | null | undefined, permission: Permission): boolean {
  const permissions = getEffectivePermissions(user)

  return permissions.includes(PERMISSIONS.ALL) || permissions.includes(permission)
}

export function hasAnyPermission(user: AuthUser | null | undefined, permissions: Permission[]): boolean {
  return permissions.some((permission) => hasPermission(user, permission))
}

export function hasAllPermissions(user: AuthUser | null | undefined, permissions: Permission[]): boolean {
  return permissions.every((permission) => hasPermission(user, permission))
}

export function can(
  userOrRole: AuthUser | string | null | undefined,
  permission: Permission,
): boolean {
  const permissions = typeof userOrRole === 'string' || userOrRole == null
    ? (isElevatedAdminRole(userOrRole) ? [PERMISSIONS.ALL] : getRolePermissions(userOrRole))
    : getEffectivePermissions(userOrRole)

  return permissions.includes(PERMISSIONS.ALL) || permissions.includes(permission)
}

export function canAny(
  userOrRole: AuthUser | string | null | undefined,
  permissions: Permission[],
): boolean {
  return permissions.some((permission) => can(userOrRole, permission))
}

export function canAll(
  userOrRole: AuthUser | string | null | undefined,
  permissions: Permission[],
): boolean {
  return permissions.every((permission) => can(userOrRole, permission))
}

export function getDefaultRouteForUser(user: AuthUser | null | undefined): string {
  if (hasPermission(user, PERMISSIONS.DASHBOARD_VIEW)) {
    return '/admin/dashboard'
  }

  if (hasPermission(user, PERMISSIONS.ORDERS_VIEW)) {
    return '/admin/orders'
  }

  if (hasPermission(user, PERMISSIONS.MERCHANTS_VIEW)) {
    return '/admin/merchants'
  }

  if (hasPermission(user, PERMISSIONS.WAREHOUSE_VIEW)) {
    return '/admin/warehouse'
  }

  if (hasPermission(user, PERMISSIONS.FINANCE_VIEW) || hasPermission(user, PERMISSIONS.REPORTS_VIEW)) {
    return '/admin/finance'
  }

  return '/admin/403'
}
