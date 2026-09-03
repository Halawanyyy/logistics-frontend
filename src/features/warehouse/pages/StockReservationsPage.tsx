import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { listStockReservations } from '../api/warehouse.api'
import type { StockReservation } from '../types/warehouse.types'
import { ResourceListPage } from '../../../shared/components/data/ResourceListPage'
import { StatusBadge } from '../../../shared/components/ui/StatusBadge'
import { formatDate } from '../../../shared/utils/formatters'
import { ApiFilterBar, compactFilters } from '../../../shared/components/data/ApiFilterBar'

const initialFilters = {
  warehouse_id: '',
  status: '',
  merchant_id: '',
}

export function StockReservationsPanel({
  embedded = false,
  onCountChange,
}: {
  embedded?: boolean
  onCountChange?: (count: number) => void
}) {
  const { t } = useTranslation()
  const [filters, setFilters] = useState(initialFilters)
  const params = compactFilters(filters)

  return (
    <ResourceListPage<StockReservation>
      hideHeader={embedded}
      onCountChange={onCountChange}
      title={t('Stock Reservations')}
      description={t('Order stock reservations across warehouses.', { defaultValue: 'Order stock reservations across warehouses.' })}
      queryKey={['stock-reservations', params]}
      queryFn={() => listStockReservations(params)}
      filters={
        <ApiFilterBar
          filters={filters}
          fields={[
            { label: 'Warehouse', name: 'warehouse_id', type: 'warehouse' },
            { label: 'Status', name: 'status', type: 'select', options: [{ label: 'reserved', value: 'reserved' }, { label: 'fulfilled', value: 'fulfilled' }, { label: 'released', value: 'released' }] },
            { label: 'Merchant', name: 'merchant_id', type: 'merchant' },
          ]}
          onChange={(name, value) => setFilters((current) => ({ ...current, [name]: value }))}
          onReset={() => setFilters(initialFilters)}
        />
      }
      columns={[
        { header: 'Product', render: (reservation) => reservation.product_name },
        { header: 'Order', render: (reservation) => reservation.order_id },
        { header: 'Warehouse', render: (reservation) => reservation.warehouse_name },
        { header: 'Quantity', render: (reservation) => reservation.quantity },
        { header: 'Status', render: (reservation) => <StatusBadge value={reservation.status} /> },
        { header: 'Created', render: (reservation) => formatDate(reservation.created_at) },
      ]}
    />
  )
}

export function StockReservationsPage() {
  return <StockReservationsPanel />
}
