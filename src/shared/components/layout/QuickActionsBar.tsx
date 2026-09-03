import type { ComponentType } from 'react'
import { CircleDollarSign, PackageCheck, Plus, Search } from 'lucide-react'
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
    icon: CircleDollarSign,
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
                <Icon size={17} aria-hidden />
                <span>{action.label}</span>
              </Link>
            </Can>
          )
        })}
      </div>
    </nav>
  )
}
