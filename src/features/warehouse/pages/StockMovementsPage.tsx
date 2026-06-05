import { useState } from 'react'
import { listStockMovements } from '../api/warehouse.api'
import type { StockMovement } from '../types/warehouse.types'
import { ResourceListPage } from '../../../shared/components/data/ResourceListPage'
import { StatusBadge } from '../../../shared/components/ui/StatusBadge'
import { pickDisplayLabel } from '../../../shared/i18n/locale'
import { formatDate } from '../../../shared/utils/formatters'
import { ApiFilterBar, compactFilters } from '../../../shared/components/data/ApiFilterBar'
import { Link } from 'react-router-dom'

const initialFilters = {
  warehouse_id: '',
  merchant_id: '',
  warehouse_product_id: '',
  type: '',
  movement_type: '',
  reference_type: '',
  reference_id: '',
  order_id: '',
  date_from: '',
  date_to: '',
}

export function StockMovementsPage() {
  const [filters, setFilters] = useState(initialFilters)
  const params = compactFilters(filters)
  return (
    <ResourceListPage<StockMovement>
      title="Stock Movements"
      description="Inventory movement history from warehouse operations."
      queryKey={['stock-movements', params]}
      queryFn={() => listStockMovements(params)}
      filters={
        <ApiFilterBar
          filters={filters}
          fields={[
            { label: 'Warehouse ID', name: 'warehouse_id', type: 'number' },
            { label: 'Merchant ID', name: 'merchant_id', type: 'number' },
            { label: 'Product ID', name: 'warehouse_product_id', type: 'number' },
            { label: 'Type', name: 'type', type: 'select', options: [{ label: 'in', value: 'in' }, { label: 'out', value: 'out' }, { label: 'damaged', value: 'damaged' }, { label: 'adjustment', value: 'adjustment' }] },
            { label: 'Movement Type', name: 'movement_type' },
            { label: 'Reference Type', name: 'reference_type' },
            { label: 'Reference ID', name: 'reference_id', type: 'number' },
            { label: 'Order ID', name: 'order_id', type: 'number' },
            { label: 'Date From', name: 'date_from', type: 'date' },
            { label: 'Date To', name: 'date_to', type: 'date' },
          ]}
          onChange={(name, value) => setFilters((current) => ({ ...current, [name]: value }))}
          onReset={() => setFilters(initialFilters)}
        />
      }
      columns={[
        { header: 'Product', render: (movement) => <Link className="table-link" to={`/stock-movements/${movement.id}`}>{movement.product_name}</Link> },
        { header: 'Warehouse', render: (movement) => movement.warehouse_name },
        { header: 'Type', render: (movement) => <StatusBadge value={movement.type}>{pickDisplayLabel(movement.type, movement.type_label ?? movement.movement_type_label)}</StatusBadge> },
        { header: 'Quantity', render: (movement) => movement.quantity },
        { header: 'Created By', render: (movement) => movement.created_by_name },
        { header: 'Created', render: (movement) => formatDate(movement.created_at) },
      ]}
    />
  )
}
