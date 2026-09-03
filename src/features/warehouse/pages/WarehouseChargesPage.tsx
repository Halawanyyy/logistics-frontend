import { useState } from 'react'
import { listWarehouseCharges } from '../api/warehouse.api'
import type { WarehouseCharge } from '../types/warehouse.types'
import { ResourceListPage } from '../../../shared/components/data/ResourceListPage'
import { StatusBadge } from '../../../shared/components/ui/StatusBadge'
import { formatDate, formatMoney } from '../../../shared/utils/formatters'
import { Link } from 'react-router-dom'
import { Button } from '../../../shared/components/ui/Button'
import { ApiFilterBar, compactFilters } from '../../../shared/components/data/ApiFilterBar'
import { Can } from '../../../shared/auth/Can'
import { PERMISSIONS } from '../../../shared/auth/permission-keys'
import { useTranslation } from 'react-i18next'

const initialFilters = {
  warehouse_id: '',
  merchant_id: '',
  type: '',
  status: '',
  date_from: '',
  date_to: '',
}

export function WarehouseChargesPanel({
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
    <ResourceListPage<WarehouseCharge>
      hideHeader={embedded}
      onCountChange={onCountChange}
      title={t('Warehouse Charges')}
      description={t('Warehouse-related merchant charges.')}
      actions={<Can permission={PERMISSIONS.WAREHOUSE_CHARGES_CREATE}><Link className="ui-link-reset" to="/warehouse-charges/create"><Button>{t('Create Charge')}</Button></Link></Can>}
      queryKey={['warehouse-charges', params]}
      queryFn={() => listWarehouseCharges(params)}
      filters={
        <ApiFilterBar
          filters={filters}
          fields={[
            { label: t('Warehouse', { defaultValue: 'Warehouse' }), name: 'warehouse_id', type: 'warehouse' },
            { label: t('Merchant', { defaultValue: 'Merchant' }), name: 'merchant_id', type: 'merchant' },
            { label: t('Type'), name: 'type' },
            { label: t('Status'), name: 'status', type: 'select', options: [{ label: t('pending'), value: 'pending' }, { label: t('completed'), value: 'completed' }, { label: t('cancelled'), value: 'cancelled' }] },
            { label: t('Date From'), name: 'date_from', type: 'date' },
            { label: t('Date To'), name: 'date_to', type: 'date' },
          ]}
          onChange={(name, value) => setFilters((current) => ({ ...current, [name]: value }))}
          onReset={() => setFilters(initialFilters)}
        />
      }
      columns={[
        { header: t('Description'), render: (charge) => <Link className="table-link" to={`/warehouse-charges/${charge.id}`}>{charge.description}</Link> },
        { header: t('Merchant'), render: (charge) => charge.merchant_name },
        { header: t('Amount'), render: (charge) => formatMoney(charge.amount) },
        { header: t('Status'), render: (charge) => <StatusBadge value={charge.status} /> },
        { header: t('Charge Date'), render: (charge) => formatDate(charge.charge_date) },
        { header: t('Actions'), render: (charge) => <Can permission={PERMISSIONS.WAREHOUSE_CHARGES_UPDATE}><Link className="table-link" to={`/warehouse-charges/${charge.id}/edit`}>{t('Edit')}</Link></Can> },
      ]}
    />
  )
}

export function WarehouseChargesPage() {
  return <WarehouseChargesPanel />
}
