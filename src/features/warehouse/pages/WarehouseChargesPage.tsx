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

const initialFilters = {
  warehouse_id: '',
  merchant_id: '',
  type: '',
  status: '',
  date_from: '',
  date_to: '',
}

export function WarehouseChargesPage() {
  const [filters, setFilters] = useState(initialFilters)
  const params = compactFilters(filters)
  return (
    <ResourceListPage<WarehouseCharge>
      title="Warehouse Charges"
      description="Warehouse-related merchant charges."
      actions={<Can permission={PERMISSIONS.WAREHOUSE_CHARGES_CREATE}><Link className="ui-link-reset" to="/warehouse-charges/create"><Button>Create Charge</Button></Link></Can>}
      queryKey={['warehouse-charges', params]}
      queryFn={() => listWarehouseCharges(params)}
      filters={
        <ApiFilterBar
          filters={filters}
          fields={[
            { label: 'Warehouse ID', name: 'warehouse_id', type: 'number' },
            { label: 'Merchant ID', name: 'merchant_id', type: 'number' },
            { label: 'Type', name: 'type' },
            { label: 'Status', name: 'status', type: 'select', options: [{ label: 'pending', value: 'pending' }, { label: 'completed', value: 'completed' }, { label: 'cancelled', value: 'cancelled' }] },
            { label: 'Date From', name: 'date_from', type: 'date' },
            { label: 'Date To', name: 'date_to', type: 'date' },
          ]}
          onChange={(name, value) => setFilters((current) => ({ ...current, [name]: value }))}
          onReset={() => setFilters(initialFilters)}
        />
      }
      columns={[
        { header: 'Description', render: (charge) => <Link className="table-link" to={`/warehouse-charges/${charge.id}`}>{charge.description}</Link> },
        { header: 'Merchant', render: (charge) => charge.merchant_name },
        { header: 'Amount', render: (charge) => formatMoney(charge.amount) },
        { header: 'Status', render: (charge) => <StatusBadge value={charge.status} /> },
        { header: 'Charge Date', render: (charge) => formatDate(charge.charge_date) },
        { header: 'Actions', render: (charge) => <Can permission={PERMISSIONS.WAREHOUSE_CHARGES_UPDATE}><Link className="table-link" to={`/warehouse-charges/${charge.id}/edit`}>Edit</Link></Can> },
      ]}
    />
  )
}
