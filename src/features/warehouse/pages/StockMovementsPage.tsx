import { useState } from 'react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
  const [filters, setFilters] = useState(initialFilters)
  const params = compactFilters(filters)
  return (
    <ResourceListPage<StockMovement>
      title={t('Stock Movements')}
      description={t('Inventory movement history from warehouse operations.', {
        defaultValue: 'Inventory movement history from warehouse operations.',
      })}
      queryKey={['stock-movements', params]}
      queryFn={() => listStockMovements(params)}
      filters={
        <ApiFilterBar
          filters={filters}
          fields={[
            { label: t('Warehouse ID', { defaultValue: 'Warehouse ID' }), name: 'warehouse_id', type: 'number' },
            { label: t('Merchant ID', { defaultValue: 'Merchant ID' }), name: 'merchant_id', type: 'number' },
            { label: t('Product ID', { defaultValue: 'Product ID' }), name: 'warehouse_product_id', type: 'number' },
            {
              label: t('Type'),
              name: 'type',
              type: 'select',
              options: [
                { label: t('in', { defaultValue: 'in' }), value: 'in' },
                { label: t('out', { defaultValue: 'out' }), value: 'out' },
                { label: t('damaged', { defaultValue: 'damaged' }), value: 'damaged' },
                { label: t('adjustment', { defaultValue: 'adjustment' }), value: 'adjustment' },
              ],
            },
            { label: t('Movement Type', { defaultValue: 'Movement Type' }), name: 'movement_type' },
            { label: t('Reference Type', { defaultValue: 'Reference Type' }), name: 'reference_type' },
            { label: t('Reference ID', { defaultValue: 'Reference ID' }), name: 'reference_id', type: 'number' },
            { label: t('Order ID', { defaultValue: 'Order ID' }), name: 'order_id', type: 'number' },
            { label: t('Date From'), name: 'date_from', type: 'date' },
            { label: t('Date To'), name: 'date_to', type: 'date' },
          ]}
          onChange={(name, value) => setFilters((current) => ({ ...current, [name]: value }))}
          onReset={() => setFilters(initialFilters)}
        />
      }
      columns={[
        { header: t('Product'), render: (movement) => <Link className="table-link" to={`/stock-movements/${movement.id}`}>{movement.product_name}</Link> },
        { header: t('Warehouse'), render: (movement) => movement.warehouse_name },
        { header: t('Type'), render: (movement) => <StatusBadge value={movement.type}>{pickDisplayLabel(movement.type, movement.type_label ?? movement.movement_type_label)}</StatusBadge> },
        { header: t('Quantity'), render: (movement) => movement.quantity },
        { header: t('Created By'), render: (movement) => movement.created_by_name },
        { header: t('Created'), render: (movement) => formatDate(movement.created_at) },
      ]}
    />
  )
}
