import { useEffect, useMemo, useState, type ComponentType } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink, useLocation } from 'react-router-dom'
import {
  Archive,
  Boxes,
  ClipboardList,
  ChevronDown,
  CreditCard,
  FileSpreadsheet,
  Headset,
  Landmark,
  LayoutDashboard,
  LogOut,
  Map as MapIcon,
  MapPin,
  Package,
  Receipt,
  ScanLine,
  Settings,
  Store,
  Truck,
  UserRoundCheck,
  Users,
  Wallet,
  Warehouse,
} from 'lucide-react'
import { Button } from '../ui/Button'
import { cn } from '../../utils/cn'
import { adminPath, merchantPath } from '../../routing/paths'
import { BrandMark } from '../branding/BrandMark'

export type SidebarItem = {
  label: string
  to: string
}

type SidebarGroup = {
  id: string
  label: string
  collapsible?: boolean
  kind?: 'link' | 'group'
  linkTo?: string
  icon?: ComponentType<{ size?: number; className?: string }>
  items: Array<SidebarItem & { icon: ComponentType<{ size?: number; className?: string }> }>
}

type SidebarProps = {
  companyLogo?: string | null
  companyName: string
  items: SidebarItem[]
  onLogout: () => void
  onNavigate?: () => void
  sidebarOpen: boolean
  supportEmail?: string
  supportPhone?: string
  userName: string
  userRole: string
  portalType?: 'admin' | 'merchant'
}

export function Sidebar({
  companyLogo,
  companyName,
  items,
  onLogout,
  onNavigate,
  sidebarOpen,
  supportEmail,
  supportPhone,
  userName,
  userRole,
  portalType = 'admin',
}: SidebarProps) {
  const { t } = useTranslation()
  const location = useLocation()
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    if (typeof window === 'undefined') {
      return {}
    }

    try {
      const stored = window.localStorage.getItem('app-sidebar-open-groups')
      return stored ? JSON.parse(stored) as Record<string, boolean> : {}
    } catch {
      return {}
    }
  })

  const itemMap = useMemo(() => new Map(items.map((item) => [item.to, item])), [items])
  const visibleGroups = useMemo(
    () =>
      buildNavigationGroups(itemMap, portalType, t).filter((group) =>
        group.items.some((item) => itemMap.has(item.to)),
      ),
    [itemMap, portalType, t],
  )

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem('app-sidebar-open-groups', JSON.stringify(openGroups))
  }, [openGroups])

  function toggleGroup(groupId: string) {
    setOpenGroups((current) => ({ ...current, [groupId]: !current[groupId] }))
  }

  return (
    <aside className={cn('app-sidebar', sidebarOpen && 'app-sidebar--open')}>
      <div className="app-sidebar__brand">
        <BrandMark className="app-sidebar__logo" logoUrl={companyLogo} name={companyName} size="lg" />
        <div className="app-sidebar__brand-copy">
          <p className="eyebrow">{t('Logistics')}</p>
          <h2>{companyName}</h2>
          <p>{t('Operations Control Center', { defaultValue: 'Operations Control Center' })}</p>
        </div>
      </div>

      <nav className="app-sidebar__nav" aria-label={t('Main navigation')}>
        {visibleGroups.map((group) => {
          const isOpen = openGroups[group.id] ?? true
          const hasActiveChild = group.items.some((item) => location.pathname.startsWith(item.to))
          const isExpanded = hasActiveChild || !group.collapsible || isOpen

          if (group.kind === 'link' && group.linkTo && group.icon) {
            const Icon = group.icon

            return (
              <NavLink
                key={group.id}
                to={group.linkTo}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn('app-sidebar__link', isActive && 'app-sidebar__link--active')
                }
              >
                <Icon className="app-sidebar__link-icon" size={18} />
                <span>{group.label}</span>
              </NavLink>
            )
          }

          return (
            <div className="app-sidebar__group" key={group.id}>
              <button
                aria-expanded={isExpanded}
                className={cn('app-sidebar__group-trigger', hasActiveChild && 'app-sidebar__group-trigger--active')}
                type="button"
                onClick={() => toggleGroup(group.id)}
              >
                <span>{group.label}</span>
                <span className={cn('app-sidebar__group-chevron', isExpanded && 'app-sidebar__group-chevron--open')}>
                  <ChevronDown size={15} />
                </span>
              </button>
              <div
                className={cn(
                  'app-sidebar__group-items',
                  isExpanded && 'app-sidebar__group-items--open',
                )}
              >
                {group.items.map((item) => {
                  const Icon = item.icon

                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        cn('app-sidebar__link', isActive && 'app-sidebar__link--active')
                      }
                    >
                      <Icon className="app-sidebar__link-icon" size={18} />
                      <span>{t(item.label, { defaultValue: item.label })}</span>
                    </NavLink>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>

      <div className="app-sidebar__support-card">
        <div className="app-sidebar__support-icon">
          <Headset size={18} />
        </div>
        <div className="app-sidebar__support-copy">
          <strong>{t('Need help?', { defaultValue: 'Need help?' })}</strong>
          <p>{t('Support stays available for settings, shipments, and operations.', { defaultValue: 'Support stays available for settings, shipments, and operations.' })}</p>
          {supportEmail ? <span>{supportEmail}</span> : null}
          {!supportEmail && supportPhone ? <span>{supportPhone}</span> : null}
        </div>
      </div>

      <div className="app-sidebar__footer">
        <div>
          <p className="app-sidebar__user-name">{userName}</p>
          <p className="app-sidebar__user-role">{userRole}</p>
        </div>
        <Button variant="secondary" onClick={onLogout}>
          <LogOut size={16} />
          {t('Logout')}
        </Button>
      </div>
    </aside>
  )
}

function pick(
  itemMap: Map<string, SidebarItem>,
  to: string,
  icon: ComponentType<{ size?: number; className?: string }>,
  label?: string,
) {
  const item = itemMap.get(to)
  return item ? [{ ...item, label: label ?? item.label, icon }] : []
}

function buildNavigationGroups(
  itemMap: Map<string, SidebarItem>,
  portalType: 'admin' | 'merchant',
  t: (key: string, options?: { defaultValue?: string }) => string,
): SidebarGroup[] {
  if (portalType === 'merchant') {
    return [
      {
        id: 'main',
        label: t('Dashboard'),
        kind: 'link' as const,
        linkTo: merchantPath('/dashboard'),
        icon: LayoutDashboard,
        items: [...pick(itemMap, merchantPath('/dashboard'), LayoutDashboard)],
      },
      {
        id: 'orders-shipments',
        label: t('Orders & Shipments', { defaultValue: 'Orders & Shipments' }),
        collapsible: true,
        items: [
          ...pick(itemMap, merchantPath('/orders'), Package),
          ...pick(itemMap, merchantPath('/shipments'), Truck),
        ],
      },
      {
        id: 'warehouse',
        label: t('Warehouse'),
        collapsible: true,
        items: [
          ...pick(itemMap, merchantPath('/warehouse/products'), Package, t('Products')),
          ...pick(itemMap, merchantPath('/warehouse/inventory'), Boxes, t('Inventory Stocks')),
          ...pick(itemMap, merchantPath('/warehouse/inventory/low-stock'), Store, t('Low Stock')),
          ...pick(itemMap, merchantPath('/warehouse/movements'), ClipboardList, t('Stock Movements')),
          ...pick(itemMap, merchantPath('/warehouse/charges'), Receipt, t('Warehouse Charges')),
          ...pick(itemMap, merchantPath('/warehouse/inbound-requests'), Warehouse, t('Inbound Requests')),
        ],
      },
      {
        id: 'finance',
        label: t('Finance'),
        collapsible: true,
        items: [
          ...pick(itemMap, merchantPath('/finance'), LayoutDashboard, t('Overview')),
          ...pick(itemMap, merchantPath('/finance/wallet'), Wallet, t('Wallet Summary')),
          ...pick(itemMap, merchantPath('/finance/wallet/transactions'), Receipt, t('Wallet Transactions')),
          ...pick(itemMap, merchantPath('/finance/invoices'), FileSpreadsheet, t('Invoices')),
          ...pick(itemMap, merchantPath('/finance/payouts'), Landmark, t('Payouts')),
        ],
      },
      {
        id: 'integrations',
        label: t('Integrations'),
        kind: 'link' as const,
        linkTo: merchantPath('/integrations'),
        icon: ScanLine,
        items: [...pick(itemMap, merchantPath('/integrations'), ScanLine)],
      },
      {
        id: 'exports',
        label: t('Exports'),
        kind: 'link' as const,
        linkTo: merchantPath('/exports'),
        icon: FileSpreadsheet,
        items: [...pick(itemMap, merchantPath('/exports'), FileSpreadsheet)],
      },
      {
        id: 'attachments',
        label: t('Attachments'),
        kind: 'link' as const,
        linkTo: merchantPath('/attachments'),
        icon: Archive,
        items: [...pick(itemMap, merchantPath('/attachments'), Archive)],
      },
      {
        id: 'notifications',
        label: t('Notifications'),
        kind: 'link' as const,
        linkTo: merchantPath('/notifications'),
        icon: ClipboardList,
        items: [...pick(itemMap, merchantPath('/notifications'), ClipboardList)],
      },
      {
        id: 'account',
        label: t('Account'),
        collapsible: true,
        items: [
          ...pick(itemMap, merchantPath('/profile'), UserRoundCheck, t('Profile')),
          ...pick(itemMap, merchantPath('/settings'), Settings, t('Settings')),
        ],
      },
    ].map((group) => ({
      ...group,
      items: group.items.filter((item, index, all) => all.findIndex((child) => child.to === item.to) === index),
    }))
  }

  return [
    {
      id: 'main',
      label: t('Dashboard'),
      kind: 'link' as const,
      linkTo: adminPath('/dashboard'),
      icon: LayoutDashboard,
      items: [...pick(itemMap, adminPath('/dashboard'), LayoutDashboard)],
    },
    {
      id: 'users',
      label: t('Users & Roles'),
      collapsible: true,
      items: [
        ...pick(itemMap, adminPath('/users'), Users),
        ...pick(itemMap, adminPath('/roles'), UserRoundCheck, t('Roles')),
      ],
    },
    {
      id: 'merchants',
      label: t('Merchants'),
      collapsible: true,
      items: [
        ...pick(itemMap, adminPath('/merchants'), Store),
      ],
    },
    {
      id: 'pricing',
      label: t('Locations & Pricing'),
      collapsible: true,
      items: [
        ...pick(itemMap, adminPath('/governorates'), MapIcon, t('Governorates')),
        ...pick(itemMap, adminPath('/areas'), MapPin, t('Areas')),
        ...pick(itemMap, adminPath('/shipping-rates'), Receipt, t('Shipping Rates')),
        ...pick(itemMap, adminPath('/pricing-plans'), Wallet, t('Pricing Plans')),
        ...pick(itemMap, adminPath('/pricing-plan-rates'), CreditCard, t('Pricing Plan Rates')),
      ],
    },
    {
      id: 'orders-shipments',
      label: t('Orders & Shipments', { defaultValue: 'Orders & Shipments' }),
      collapsible: true,
      items: [
        ...pick(itemMap, adminPath('/orders'), Package),
        ...pick(itemMap, adminPath('/shipments'), Truck),
      ],
    },
    {
      id: 'drivers',
      label: t('Drivers'),
      collapsible: true,
      items: [
        ...pick(itemMap, adminPath('/drivers'), UserRoundCheck),
        ...pick(itemMap, adminPath('/driver-manifests'), ClipboardList, t('Driver Manifests')),
      ],
    },
    {
      id: 'warehouse',
      label: t('Warehouse'),
      collapsible: true,
      items: [
        ...pick(itemMap, adminPath('/warehouses'), Warehouse, t('Warehouses')),
        ...pick(itemMap, adminPath('/warehouse-products'), Package, t('Products')),
        ...pick(itemMap, adminPath('/inventory-stocks'), Boxes, t('Inventory Stocks')),
        ...pick(itemMap, adminPath('/stock-movements'), FileSpreadsheet, t('Stock Movements')),
        ...pick(itemMap, adminPath('/stock-reservations'), ClipboardList, t('Stock Reservations')),
        ...pick(itemMap, adminPath('/warehouse/locations'), MapPin, t('Locations')),
        ...pick(itemMap, adminPath('/warehouse/receipts'), Receipt, t('Receipts')),
        ...pick(itemMap, adminPath('/warehouse/transfers'), Truck, t('Transfers')),
        ...pick(itemMap, adminPath('/warehouse/picking-lists'), ClipboardList, t('Picking Lists')),
        ...pick(itemMap, adminPath('/warehouse/packing-tasks'), Package, t('Packing Tasks')),
        ...pick(itemMap, adminPath('/warehouse-returns'), Archive, t('Returns')),
        ...pick(itemMap, adminPath('/warehouse-charges'), CreditCard, t('Charges')),
        ...pick(itemMap, adminPath('/warehouse/storage-fee-rules'), Wallet, t('Storage Fees')),
        ...pick(itemMap, adminPath('/warehouse/pick-pack-fee-rules'), CreditCard, t('Pick & Pack Fees')),
        ...pick(itemMap, adminPath('/warehouse/kpis'), LayoutDashboard, t('Warehouse KPIs')),
        ...pick(itemMap, adminPath('/warehouse/inbound-requests'), ClipboardList, t('Inbound Requests')),
      ],
    },
    {
      id: 'operations',
      label: t('Operations'),
      collapsible: true,
      items: [
        ...pick(itemMap, adminPath('/operations/barcodes'), ScanLine, t('Barcode Operations')),
        ...pick(itemMap, adminPath('/exports'), FileSpreadsheet, t('Exports')),
      ],
    },
    {
      id: 'system',
      label: t('System'),
      collapsible: true,
      items: [
        ...pick(itemMap, adminPath('/settings'), Settings),
        ...pick(itemMap, adminPath('/audit-logs'), FileSpreadsheet, t('Audit Logs')),
      ],
    },
    {
      id: 'finance',
      label: t('Finance'),
      collapsible: true,
      items: [
        ...pick(itemMap, adminPath('/finance'), Landmark, t('Reports')),
        ...pick(itemMap, adminPath('/finance/merchant-payouts'), Wallet, t('Payouts')),
        ...pick(itemMap, adminPath('/finance/expenses'), Receipt, t('Expenses')),
        ...pick(itemMap, adminPath('/finance/merchant-invoices'), FileSpreadsheet, t('Invoices')),
        ...pick(itemMap, adminPath('/finance/treasury/accounts'), Landmark, t('Treasury Accounts')),
        ...pick(itemMap, adminPath('/finance/treasury/transactions'), CreditCard, t('Treasury Transactions')),
      ],
    },
  ].map((group) => ({
    ...group,
    items: group.items.filter((item, index, all) => all.findIndex((child) => child.to === item.to) === index),
  }))
}
