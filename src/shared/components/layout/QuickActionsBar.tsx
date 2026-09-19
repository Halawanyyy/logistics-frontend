import type { ComponentType } from 'react'
import {
  ClipboardList,
  DollarSign,
  PackageCheck,
  Plus,
  Search,
  Store,
  Truck,
  Wallet,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Can } from '../../auth/Can'
import { PERMISSIONS, type Permission } from '../../auth/permission-keys'
import { adminPath } from '../../routing/paths'

type QuickAction = {
  label: string
  path: string
  permission: Permission
  icon: ComponentType<{ size?: number; 'aria-hidden'?: boolean }>
}

const quickActions: QuickAction[] = [
  {
    label: 'New Order',
    path: adminPath('/orders/create'),
    permission: PERMISSIONS.ORDERS_CREATE,
    icon: Plus,
  },
  {
    label: 'New Shipment',
    path: adminPath('/orders'),
    permission: PERMISSIONS.ORDERS_CREATE_SHIPMENT,
    icon: Truck,
  },
  {
    label: 'Receive Goods',
    path: adminPath('/warehouse/receipts'),
    permission: PERMISSIONS.INVENTORY_CREATE,
    icon: PackageCheck,
  },
  {
    label: 'Track Shipment',
    path: adminPath('/shipments'),
    permission: PERMISSIONS.SHIPMENTS_VIEW,
    icon: Search,
  },
  {
    label: 'Record Payment',
    path: adminPath('/finance/treasury/transactions'),
    permission: PERMISSIONS.FINANCE_TREASURY_VIEW,
    icon: DollarSign,
  },
  {
    label: 'Create Manifest',
    path: adminPath('/driver-manifests'),
    permission: PERMISSIONS.DRIVER_MANIFESTS_CREATE,
    icon: ClipboardList,
  },
  {
    label: 'Add Merchant',
    path: adminPath('/merchants/create'),
    permission: PERMISSIONS.MERCHANTS_CREATE,
    icon: Store,
  },
  {
    label: 'New Payout',
    path: adminPath('/finance/merchant-payouts/create'),
    permission: PERMISSIONS.PAYOUTS_CREATE,
    icon: Wallet,
  },
]

export function QuickActionsBar() {
  return (
    <nav className="quick-actions-bar" aria-label="Quick actions">
      <span className="quick-actions-bar__label">Quick actions</span>
      <div className="quick-actions-bar__items">
        {quickActions.map((action) => {
          const Icon = action.icon

          return (
            <Can key={action.label} permission={action.permission}>
              <Link className="quick-actions-bar__action" to={action.path}>
                <Icon size={15} aria-hidden />
                <span>{action.label}</span>
              </Link>
            </Can>
          )
        })}
      </div>
    </nav>
  )
}
