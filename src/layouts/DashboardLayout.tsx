import { Outlet, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Boxes,
  ClipboardList,
  CreditCard,
  FileSpreadsheet,
  Landmark,
  LayoutDashboard,
  Map as MapIcon,
  MapPin,
  Package,
  Receipt,
  Settings,
  Store,
  Truck,
  UserRoundCheck,
  Users,
  Wallet,
  Warehouse,
} from 'lucide-react'
import { appConfig } from '../app/config'
import { logout as logoutRequest } from '../features/auth/api/auth.api'
import { useAuthStore } from '../features/auth/store/auth.store'
import { PERMISSIONS, type Permission } from '../shared/auth/permission-keys'
import { hasAnyPermission, hasPermission } from '../shared/auth/permissions'
import {
  AppShell,
  type NavGroup,
  type NavItem,
  type SidebarItem,
} from '../shared/components/layout/AppShell'
import { QuickActionsBar } from '../shared/components/layout/QuickActionsBar'
import { adminPath } from '../shared/routing/paths'

type AdminNavItem = NavItem & {
  permission?: Permission
  anyOf?: Permission[]
}

type AdminNavGroup = Omit<NavGroup, 'children'> & {
  children: AdminNavItem[]
}

type AdminSidebarItem = AdminNavItem | AdminNavGroup

const navigationItems: AdminSidebarItem[] = [
  {
    type: 'link',
    path: adminPath('/dashboard'),
    label: 'Dashboard',
    icon: <LayoutDashboard size={18} />,
    permission: PERMISSIONS.DASHBOARD_VIEW,
  },
  {
    type: 'group',
    label: 'Operations',
    icon: <ClipboardList size={18} />,
    defaultOpen: true,
    children: [
      { type: 'link', path: adminPath('/orders'), label: 'Orders', icon: <Package size={18} />, permission: PERMISSIONS.ORDERS_VIEW },
      { type: 'link', path: adminPath('/shipments'), label: 'Shipments', icon: <Truck size={18} />, permission: PERMISSIONS.SHIPMENTS_VIEW },
      { type: 'link', path: adminPath('/driver-manifests'), label: 'Driver Manifests', icon: <ClipboardList size={18} />, permission: PERMISSIONS.DRIVER_MANIFESTS_VIEW },
    ],
  },
  {
    type: 'group',
    label: 'Entities',
    icon: <Users size={18} />,
    children: [
      {
        type: 'link',
        path: adminPath('/merchants'),
        label: 'Merchants',
        icon: <Store size={18} />,
        permission: PERMISSIONS.MERCHANTS_VIEW,
      },
      {
        type: 'link',
        path: adminPath('/drivers'),
        label: 'Drivers',
        icon: <UserRoundCheck size={18} />,
        permission: PERMISSIONS.DRIVERS_VIEW,
      },
    ],
  },
  {
    type: 'group',
    label: 'Pricing',
    icon: <CreditCard size={18} />,
    children: [
      { type: 'link', path: adminPath('/governorates'), label: 'Governorates', icon: <MapIcon size={18} />, permission: PERMISSIONS.LOCATION_PRICING_VIEW },
      { type: 'link', path: adminPath('/areas'), label: 'Areas', icon: <MapPin size={18} />, permission: PERMISSIONS.LOCATION_PRICING_VIEW },
      { type: 'link', path: adminPath('/shipping-rates'), label: 'Shipping Rates', icon: <Receipt size={18} />, permission: PERMISSIONS.SHIPPING_RATES_VIEW },
      { type: 'link', path: adminPath('/pricing-plans'), label: 'Pricing Plans', icon: <Wallet size={18} />, permission: PERMISSIONS.PRICING_PLANS_VIEW },
      { type: 'link', path: adminPath('/pricing-plan-rates'), label: 'Pricing Plan Rates', icon: <CreditCard size={18} />, permission: PERMISSIONS.PRICING_PLAN_RATES_VIEW },
    ],
  },
  {
    type: 'group',
    label: 'Warehouse',
    icon: <Warehouse size={18} />,
    children: [
      {
        type: 'link',
        path: adminPath('/warehouse/kpis'),
        label: 'Hub',
        icon: <LayoutDashboard size={18} />,
        permission: PERMISSIONS.WAREHOUSE_KPIS_VIEW,
      },
      {
        type: 'link',
        path: adminPath('/warehouse/inbound'),
        label: 'Inbound',
        icon: <Receipt size={18} />,
        anyOf: [
          PERMISSIONS.MERCHANT_INBOUND_REQUESTS_VIEW,
          PERMISSIONS.MERCHANT_INBOUND_REQUESTS_MANAGE,
          PERMISSIONS.INVENTORY_VIEW,
        ],
      },
      {
        type: 'link',
        path: adminPath('/warehouse/inventory'),
        label: 'Inventory',
        icon: <Boxes size={18} />,
        anyOf: [PERMISSIONS.INVENTORY_VIEW, PERMISSIONS.STOCK_MOVEMENTS_VIEW, PERMISSIONS.COMPANY_CATALOG_VIEW, PERMISSIONS.WAREHOUSE_LOCATIONS_VIEW],
      },
      {
        type: 'link',
        path: adminPath('/warehouse/fulfillment'),
        label: 'Fulfillment',
        icon: <Package size={18} />,
        anyOf: [PERMISSIONS.PICKING_LISTS_VIEW, PERMISSIONS.PACKING_TASKS_VIEW],
      },
      {
        type: 'link',
        path: adminPath('/warehouse/config'),
        label: 'Config',
        icon: <Settings size={18} />,
        anyOf: [
          PERMISSIONS.WAREHOUSE_RETURNS_VIEW,
          PERMISSIONS.WAREHOUSE_CHARGES_VIEW,
          PERMISSIONS.STORAGE_FEE_RULES_VIEW,
          PERMISSIONS.PICK_PACK_FEE_RULES_VIEW,
        ],
      },
      {
        type: 'link',
        path: adminPath('/warehouses'),
        label: 'Warehouses',
        icon: <Warehouse size={18} />,
        permission: PERMISSIONS.WAREHOUSE_VIEW,
      },
    ],
  },
  {
    type: 'group',
    label: 'Finance',
    icon: <Landmark size={18} />,
    children: [
      {
        type: 'link',
        path: adminPath('/finance'),
        label: 'Overview',
        icon: <LayoutDashboard size={18} />,
        anyOf: [
          PERMISSIONS.FINANCE_VIEW,
          PERMISSIONS.FINANCE_RECONCILIATION_VIEW,
          PERMISSIONS.FINANCE_REPORTS_VIEW,
          PERMISSIONS.FINANCE_REPORTS_DAILY_CASH,
          PERMISSIONS.FINANCE_REPORTS_MERCHANT_LEDGER,
          PERMISSIONS.FINANCE_REPORTS_DRIVER_DISCREPANCIES,
          PERMISSIONS.FINANCE_REPORTS_WAREHOUSE_REVENUE,
          PERMISSIONS.FINANCE_REPORTS_PROFIT_LOSS,
        ],
      },
      {
        type: 'link',
        path: adminPath('/finance/operations'),
        label: 'Operations',
        icon: <Wallet size={18} />,
        anyOf: [
          PERMISSIONS.PAYOUTS_VIEW,
          PERMISSIONS.FINANCE_INVOICES_VIEW,
          PERMISSIONS.EXPENSES_VIEW,
          PERMISSIONS.CASH_CLOSURES_VIEW,
        ],
      },
      {
        type: 'link',
        path: adminPath('/finance/treasury'),
        label: 'Treasury',
        icon: <Landmark size={18} />,
        permission: PERMISSIONS.FINANCE_TREASURY_VIEW,
      },
    ],
  },
  {
    type: 'group',
    label: 'Settings',
    icon: <Settings size={18} />,
    children: [
      { type: 'link', path: adminPath('/users'), label: 'Users', icon: <Users size={18} />, permission: PERMISSIONS.USERS_VIEW },
      { type: 'link', path: adminPath('/roles'), label: 'Roles', icon: <UserRoundCheck size={18} />, permission: PERMISSIONS.ROLES_VIEW },
      { type: 'link', path: adminPath('/audit-logs'), label: 'Audit Logs', icon: <FileSpreadsheet size={18} />, permission: PERMISSIONS.AUDIT_LOGS_VIEW },
      { type: 'link', path: adminPath('/exports'), label: 'Exports', icon: <FileSpreadsheet size={18} />, permission: PERMISSIONS.EXPORTS_VIEW },
      { type: 'link', path: adminPath('/settings'), label: 'Settings', icon: <Settings size={18} />, permission: PERMISSIONS.SETTINGS_VIEW },
    ],
  },
]

function canViewNavigationItem(user: ReturnType<typeof useAuthStore.getState>['user'], item: AdminNavItem) {
  if (item.permission) {
    return hasPermission(user, item.permission)
  }

  return item.anyOf ? hasAnyPermission(user, item.anyOf) : false
}

function getVisibleNavigationItems(
  user: ReturnType<typeof useAuthStore.getState>['user'],
): SidebarItem[] {
  return navigationItems.flatMap<SidebarItem>((item) => {
    if (item.type === 'link') {
      return canViewNavigationItem(user, item) ? [item] : []
    }

    const children = item.children.filter((child) => canViewNavigationItem(user, child))
    return children.length ? [{ ...item, children }] : []
  })
}

export function DashboardLayout() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const clearSession = useAuthStore((state) => state.logout)
  const visibleNavigationItems = getVisibleNavigationItems(user)

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
      <QuickActionsBar />
      <Outlet />
    </AppShell>
  )
}
