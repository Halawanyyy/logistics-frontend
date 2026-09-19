import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Archive,
  Bell,
  ClipboardList,
  CreditCard,
  FileSpreadsheet,
  Landmark,
  LayoutDashboard,
  Package,
  PackageCheck,
  Plug,
  Plus,
  Search,
  Settings,
  Truck,
  UserRoundCheck,
  Users,
  Wallet,
  Warehouse,
} from 'lucide-react'
import { appConfig } from '../app/config'
import { logout as logoutRequest } from '../features/auth/api/auth.api'
import { useAuthStore } from '../features/auth/store/auth.store'
import {
  AppShell,
  type NavGroup,
  type NavItem,
  type SidebarItem,
} from '../shared/components/layout/AppShell'
import { merchantPath } from '../shared/routing/paths'
import { useMerchantPortalContext } from '../features/merchant-portal/context/merchantPortal.context'

type MerchantNavItem = NavItem & {
  capability?: string
  role?: string
  hidden?: boolean
}

type MerchantNavGroup = Omit<NavGroup, 'children'> & {
  children: MerchantNavItem[]
}

type MerchantSidebarItem = MerchantNavItem | MerchantNavGroup

const navigationItems: MerchantSidebarItem[] = [
  {
    type: 'link',
    path: merchantPath('/dashboard'),
    label: 'Dashboard',
    icon: <LayoutDashboard size={18} />,
    capability: 'dashboard.view',
  },
  {
    type: 'group',
    label: 'Orders & Shipments',
    icon: <ClipboardList size={18} />,
    defaultOpen: true,
    children: [
      { type: 'link', path: merchantPath('/orders'), label: 'Orders', icon: <Package size={18} />, capability: 'orders.view' },
      { type: 'link', path: merchantPath('/shipments'), label: 'Shipments', icon: <Truck size={18} />, capability: 'shipments.view' },
      { type: 'link', path: merchantPath('/exports'), label: 'Exports', icon: <FileSpreadsheet size={18} />, capability: 'exports.view' },
    ],
  },
  {
    type: 'group',
    label: 'Warehouse',
    icon: <Warehouse size={18} />,
    children: [
      { type: 'link', path: merchantPath('/warehouse/products'), label: 'Products', icon: <Package size={18} />, capability: 'warehouse.view' },
      { type: 'link', path: merchantPath('/warehouse/inbound-requests'), label: 'Inbound Requests', icon: <Warehouse size={18} />, capability: 'warehouse.inbound_requests.view' },
    ],
  },
  {
    type: 'group',
    label: 'Finance',
    icon: <Landmark size={18} />,
    children: [
      { type: 'link', path: merchantPath('/finance'), label: 'Overview', icon: <LayoutDashboard size={18} />, capability: 'finance.view' },
      { type: 'link', path: merchantPath('/finance/wallet'), label: 'Wallet', icon: <Wallet size={18} />, capability: 'wallet.view' },
      { type: 'link', path: merchantPath('/finance/invoices'), label: 'Invoices', icon: <FileSpreadsheet size={18} />, capability: 'invoices.view' },
      { type: 'link', path: merchantPath('/finance/payouts'), label: 'Payouts', icon: <Landmark size={18} />, capability: 'payouts.view' },
    ],
  },
  {
    type: 'link',
    path: merchantPath('/subscription'),
    label: 'Subscription',
    icon: <CreditCard size={18} />,
  },
  {
    type: 'group',
    label: 'Settings',
    icon: <Settings size={18} />,
    children: [
      { type: 'link', path: merchantPath('/profile'), label: 'Profile', icon: <UserRoundCheck size={18} />, role: 'owner' },
      { type: 'link', path: merchantPath('/users'), label: 'Portal Users', icon: <Users size={18} />, capability: 'users.view' },
      { type: 'link', path: merchantPath('/integrations'), label: 'Integrations', icon: <Plug size={18} />, capability: 'integrations.view' },
      { type: 'link', path: merchantPath('/notifications'), label: 'Notifications', icon: <Bell size={18} />, capability: 'notifications.view' },
      { type: 'link', path: merchantPath('/attachments'), label: 'Attachments', icon: <Archive size={18} />, capability: 'attachments.view' },
      {
        type: 'link',
        path: merchantPath('/settings'),
        label: 'Settings',
        icon: <Settings size={18} />,
        capability: 'settings.view',
        hidden: true,
      },
    ],
  },
]

export function MerchantLayout() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const clearSession = useAuthStore((state) => state.logout)
  const { hasMerchantCapability, merchant, portalRole } = useMerchantPortalContext()
  const merchantQuickActions = [
    {
      label: t('New Order', { defaultValue: 'New Order' }),
      icon: <Plus size={15} aria-hidden="true" />,
      path: merchantPath('/orders/create'),
      capability: 'orders.create',
    },
    {
      label: t('Track Shipment', { defaultValue: 'Track Shipment' }),
      icon: <Search size={15} aria-hidden="true" />,
      path: merchantPath('/shipments'),
      capability: 'shipments.view',
    },
    {
      label: t('Request Inbound', { defaultValue: 'Request Inbound' }),
      icon: <PackageCheck size={15} aria-hidden="true" />,
      path: merchantPath('/warehouse/inbound-requests/create'),
      capability: 'warehouse.inbound_requests.create',
    },
    {
      label: t('View Wallet', { defaultValue: 'View Wallet' }),
      icon: <Wallet size={15} aria-hidden="true" />,
      path: merchantPath('/finance/wallet'),
      capability: 'wallet.view',
    },
    {
      label: t('My Invoices', { defaultValue: 'My Invoices' }),
      icon: <FileSpreadsheet size={15} aria-hidden="true" />,
      path: merchantPath('/finance/invoices'),
      capability: 'invoices.view',
    },
  ]

  function canViewNavigationItem(item: MerchantNavItem) {
    if (item.hidden) {
      return false
    }

    if (item.role) {
      return portalRole?.toLowerCase() === item.role.toLowerCase()
    }

    return item.capability ? hasMerchantCapability(item.capability) : true
  }

  const visibleItems = navigationItems.flatMap<SidebarItem>((item) => {
    if (item.type === 'link') {
      return canViewNavigationItem(item) ? [item] : []
    }

    const children = item.children.filter(canViewNavigationItem)
    return children.length ? [{ ...item, children }] : []
  })

  async function handleLogout() {
    try {
      await logoutRequest()
    } catch {
      // The local session still needs to be cleared if the token is already invalid.
    } finally {
      clearSession()
      navigate(merchantPath('/login'), { replace: true })
    }
  }

  return (
    <AppShell
      fallbackAppName={merchant?.company_name || merchant?.name || `${appConfig.appName} - Merchant Portal`}
      items={visibleItems}
      onLogout={handleLogout}
      portalType="merchant"
      user={user}
      userName={user?.name ?? t('Merchant', { defaultValue: 'Merchant' })}
      userRole={portalRole ?? 'Merchant'}
    >
      <nav className="quick-actions-bar" aria-label={t('Quick actions')}>
        <span className="quick-actions-bar__label">{t('Quick actions')}</span>
        <div className="quick-actions-bar__items">
          {merchantQuickActions
            .filter((action) => hasMerchantCapability(action.capability))
            .map((action) => (
              <Link className="quick-actions-bar__action" key={action.capability} to={action.path}>
                {action.icon}
                <span>{action.label}</span>
              </Link>
            ))}
        </div>
      </nav>
      <Outlet />
    </AppShell>
  )
}
