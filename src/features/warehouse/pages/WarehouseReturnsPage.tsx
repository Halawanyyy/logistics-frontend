import { useState } from 'react'
import { listWarehouseReturns } from '../api/warehouse.api'
import type { WarehouseReturn } from '../types/warehouse.types'
import { ResourceListPage } from '../../../shared/components/data/ResourceListPage'
import { StatusBadge } from '../../../shared/components/ui/StatusBadge'
import { formatDate } from '../../../shared/utils/formatters'
import { Link } from 'react-router-dom'
import { Button } from '../../../shared/components/ui/Button'
import { ApiFilterBar, compactFilters } from '../../../shared/components/data/ApiFilterBar'
import { Can } from '../../../shared/auth/Can'
import { PERMISSIONS } from '../../../shared/auth/permission-keys'
import { useTranslation } from 'react-i18next'

const initialFilters = {
  warehouse_id: '',
  merchant_id: '',
  condition: '',
  status: '',
  date_from: '',
  date_to: '',
}

export function WarehouseReturnsPanel({
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
    <ResourceListPage<WarehouseReturn>
      hideHeader={embedded}
      onCountChange={onCountChange}
      title={t('Warehouse Returns')}
      description={t('Returned warehouse items and their stock condition.')}
      actions={<Can permission={PERMISSIONS.WAREHOUSE_RETURNS_CREATE}><Link className="ui-link-reset" to="/warehouse-returns/create"><Button>{t('Create Return')}</Button></Link></Can>}
      queryKey={['warehouse-returns', params]}
      queryFn={() => listWarehouseReturns(params)}
      filters={
        <ApiFilterBar
          filters={filters}
          fields={[
            { label: t('Warehouse', { defaultValue: 'Warehouse' }), name: 'warehouse_id', type: 'warehouse' },
            { label: t('Merchant', { defaultValue: 'Merchant' }), name: 'merchant_id', type: 'merchant' },
            { label: t('Condition'), name: 'condition', type: 'select', options: [{ label: t('sellable'), value: 'sellable' }, { label: t('damaged'), value: 'damaged' }, { label: t('disposed'), value: 'disposed' }] },
            { label: t('Status'), name: 'status', type: 'select', options: [{ label: t('pending'), value: 'pending' }, { label: t('received'), value: 'received' }, { label: t('inspected'), value: 'inspected' }, { label: t('restocked'), value: 'restocked' }, { label: t('damaged'), value: 'damaged' }, { label: t('rejected'), value: 'rejected' }, { label: t('closed'), value: 'closed' }] },
            { label: t('Date From'), name: 'date_from', type: 'date' },
            { label: t('Date To'), name: 'date_to', type: 'date' },
          ]}
          onChange={(name, value) => setFilters((current) => ({ ...current, [name]: value }))}
          onReset={() => setFilters(initialFilters)}
        />
      }
      columns={[
        { header: t('Product'), render: (item) => <Link className="table-link" to={`/warehouse-returns/${item.id}`}>{item.product_name}</Link> },
        { header: t('Warehouse'), render: (item) => item.warehouse_name },
        { header: t('Quantity'), render: (item) => item.quantity },
        { header: t('Condition'), render: (item) => <StatusBadge value={item.condition} /> },
        { header: t('Status'), render: (item) => <StatusBadge value={item.status}>{item.status_label ?? item.status}</StatusBadge> },
        { header: t('Created'), render: (item) => formatDate(item.created_at) },
      ]}
    />
  )
}

export function WarehouseReturnsPage() {
  return <WarehouseReturnsPanel />
}
