import { Outlet, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { appConfig } from '../app/config'
import { logout as logoutRequest } from '../features/auth/api/auth.api'
import { useAuthStore } from '../features/auth/store/auth.store'
import { PERMISSIONS, type Permission } from '../shared/auth/permission-keys'
import { hasAnyPermission, hasPermission } from '../shared/auth/permissions'
import { AppShell } from '../shared/components/layout/AppShell'
import { adminPath } from '../shared/routing/paths'

const navigationItems: Array<{
  to: string
  label: string
  permission?: Permission
  anyOf?: Permission[]
}> = [
  { to: adminPath('/dashboard'), label: 'Dashboard', permission: PERMISSIONS.DASHBOARD_VIEW },
  { to: adminPath('/users'), label: 'Users', permission: PERMISSIONS.USERS_VIEW },
  { to: adminPath('/roles'), label: 'Roles', permission: PERMISSIONS.ROLES_VIEW },
  { to: adminPath('/merchants'), label: 'Merchants', permission: PERMISSIONS.MERCHANTS_VIEW },
  { to: adminPath('/governorates'), label: 'Governorates', permission: PERMISSIONS.LOCATION_PRICING_VIEW },
  { to: adminPath('/areas'), label: 'Areas', permission: PERMISSIONS.LOCATION_PRICING_VIEW },
  { to: adminPath('/shipping-rates'), label: 'Shipping Rates', permission: PERMISSIONS.SHIPPING_RATES_VIEW },
  { to: adminPath('/pricing-plans'), label: 'Pricing Plans', permission: PERMISSIONS.PRICING_PLANS_VIEW },
  { to: adminPath('/pricing-plan-rates'), label: 'Pricing Plan Rates', permission: PERMISSIONS.PRICING_PLAN_RATES_VIEW },
  { to: adminPath('/orders'), label: 'Orders', permission: PERMISSIONS.ORDERS_VIEW },
  { to: adminPath('/shipments'), label: 'Shipments', permission: PERMISSIONS.SHIPMENTS_VIEW },
  { to: adminPath('/drivers'), label: 'Drivers', permission: PERMISSIONS.DRIVERS_VIEW },
  { to: adminPath('/driver-manifests'), label: 'Driver Manifests', permission: PERMISSIONS.DRIVER_MANIFESTS_VIEW },
  {
    to: adminPath('/finance'),
    label: 'Finance Overview',
    anyOf: [
      PERMISSIONS.FINANCE_VIEW,
      PERMISSIONS.FINANCE_REPORTS_VIEW,
      PERMISSIONS.FINANCE_RECONCILIATION_VIEW,
    ],
  },
  { to: adminPath('/finance/merchant-payouts'), label: 'Payouts', permission: PERMISSIONS.PAYOUTS_VIEW },
  { to: adminPath('/finance/expenses'), label: 'Expenses', permission: PERMISSIONS.EXPENSES_VIEW },
  { to: adminPath('/finance/merchant-invoices'), label: 'Invoices', permission: PERMISSIONS.FINANCE_INVOICES_VIEW },
  { to: adminPath('/finance/treasury/accounts'), label: 'Treasury Accounts', permission: PERMISSIONS.FINANCE_TREASURY_VIEW },
  { to: adminPath('/finance/treasury/transactions'), label: 'Treasury Transactions', permission: PERMISSIONS.FINANCE_TREASURY_VIEW },
  {
    to: adminPath('/warehouse'),
    label: 'Warehouse',
    anyOf: [
      PERMISSIONS.WAREHOUSE_VIEW,
      PERMISSIONS.INVENTORY_VIEW,
      PERMISSIONS.WAREHOUSE_LOCATIONS_VIEW,
      PERMISSIONS.PICKING_LISTS_VIEW,
      PERMISSIONS.PACKING_TASKS_VIEW,
      PERMISSIONS.STORAGE_FEE_RULES_VIEW,
      PERMISSIONS.PICK_PACK_FEE_RULES_VIEW,
      PERMISSIONS.WAREHOUSE_KPIS_VIEW,
    ],
  },
  { to: adminPath('/warehouses'), label: 'Warehouses', permission: PERMISSIONS.WAREHOUSE_VIEW },
  { to: adminPath('/warehouse-products'), label: 'Products', permission: PERMISSIONS.INVENTORY_VIEW },
  { to: adminPath('/company-catalog'), label: 'Company Catalog', permission: PERMISSIONS.COMPANY_CATALOG_VIEW },
  { to: adminPath('/inventory-stocks'), label: 'Inventory Stocks', permission: PERMISSIONS.INVENTORY_VIEW },
  { to: adminPath('/stock-movements'), label: 'Stock Movements', permission: PERMISSIONS.STOCK_MOVEMENTS_VIEW },
  { to: adminPath('/stock-reservations'), label: 'Stock Reservations', permission: PERMISSIONS.INVENTORY_VIEW },
  { to: adminPath('/warehouse/locations'), label: 'Warehouse Locations', permission: PERMISSIONS.WAREHOUSE_LOCATIONS_VIEW },
  { to: adminPath('/warehouse/receipts'), label: 'Warehouse Receipts', permission: PERMISSIONS.INVENTORY_VIEW },
  { to: adminPath('/warehouse/transfers'), label: 'Warehouse Transfers', permission: PERMISSIONS.INVENTORY_VIEW },
  { to: adminPath('/warehouse-returns'), label: 'Returns', permission: PERMISSIONS.WAREHOUSE_RETURNS_VIEW },
  { to: adminPath('/warehouse-charges'), label: 'Charges', permission: PERMISSIONS.WAREHOUSE_CHARGES_VIEW },
  { to: adminPath('/warehouse/picking-lists'), label: 'Picking Lists', permission: PERMISSIONS.PICKING_LISTS_VIEW },
  { to: adminPath('/warehouse/packing-tasks'), label: 'Packing Tasks', permission: PERMISSIONS.PACKING_TASKS_VIEW },
  { to: adminPath('/warehouse/storage-fee-rules'), label: 'Storage Fee Rules', permission: PERMISSIONS.STORAGE_FEE_RULES_VIEW },
  { to: adminPath('/warehouse/pick-pack-fee-rules'), label: 'Pick & Pack Fee Rules', permission: PERMISSIONS.PICK_PACK_FEE_RULES_VIEW },
  { to: adminPath('/warehouse/kpis'), label: 'Warehouse KPIs', permission: PERMISSIONS.WAREHOUSE_KPIS_VIEW },
  {
    to: adminPath('/warehouse/inbound-requests'),
    label: 'Inbound Requests',
    anyOf: [
      PERMISSIONS.MERCHANT_INBOUND_REQUESTS_VIEW,
      PERMISSIONS.MERCHANT_INBOUND_REQUESTS_MANAGE,
    ],
  },
  {
    to: adminPath('/operations/barcodes'),
    label: 'Barcode Lookup',
    anyOf: [PERMISSIONS.BARCODES_LOOKUP, PERMISSIONS.BARCODES_SCAN],
  },
  { to: adminPath('/exports'), label: 'Exports', permission: PERMISSIONS.EXPORTS_VIEW },
  { to: adminPath('/audit-logs'), label: 'Audit Logs', permission: PERMISSIONS.AUDIT_LOGS_VIEW },
  { to: adminPath('/settings'), label: 'Settings', permission: PERMISSIONS.SETTINGS_VIEW },
]

export function DashboardLayout() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const clearSession = useAuthStore((state) => state.logout)
  const visibleNavigationItems = navigationItems.filter((item) => (
    item.permission ? hasPermission(user, item.permission) : item.anyOf ? hasAnyPermission(user, item.anyOf) : false
  ))

  async function handleLogout() {
    try {
      await logoutRequest()
    } catch {
      // The local session still needs to be cleared if the token is already invalid.
    } finally {
      clearSession()
      navigate(adminPath('/login'), { replace: true })
    }
  }

  return (
    <AppShell
      fallbackAppName={appConfig.appName}
      items={visibleNavigationItems}
      onLogout={handleLogout}
      user={user}
      userName={user?.name ?? t('Authenticated User', { defaultValue: 'Authenticated User' })}
      userRole={user?.role ?? '-'}
    >
      <Outlet />
    </AppShell>
  )
}
