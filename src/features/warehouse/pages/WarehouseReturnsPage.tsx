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

const initialFilters = {
  shipment_id: '',
  order_id: '',
  warehouse_id: '',
  merchant_id: '',
  warehouse_product_id: '',
  condition: '',
  status: '',
  date_from: '',
  date_to: '',
}

export function WarehouseReturnsPage() {
  const [filters, setFilters] = useState(initialFilters)
  const params = compactFilters(filters)
  return (
    <ResourceListPage<WarehouseReturn>
      title="Warehouse Returns"
      description="Returned warehouse items and their stock condition."
      actions={<Can permission={PERMISSIONS.WAREHOUSE_RETURNS_CREATE}><Link className="ui-link-reset" to="/warehouse-returns/create"><Button>Create Return</Button></Link></Can>}
      queryKey={['warehouse-returns', params]}
      queryFn={() => listWarehouseReturns(params)}
      filters={
        <ApiFilterBar
          filters={filters}
          fields={[
            { label: 'Shipment ID', name: 'shipment_id', type: 'number' },
            { label: 'Order ID', name: 'order_id', type: 'number' },
            { label: 'Warehouse ID', name: 'warehouse_id', type: 'number' },
            { label: 'Merchant ID', name: 'merchant_id', type: 'number' },
            { label: 'Product ID', name: 'warehouse_product_id', type: 'number' },
            { label: 'Condition', name: 'condition', type: 'select', options: [{ label: 'sellable', value: 'sellable' }, { label: 'damaged', value: 'damaged' }, { label: 'disposed', value: 'disposed' }] },
            { label: 'Status', name: 'status', type: 'select', options: [{ label: 'pending', value: 'pending' }, { label: 'received', value: 'received' }, { label: 'inspected', value: 'inspected' }, { label: 'restocked', value: 'restocked' }, { label: 'damaged', value: 'damaged' }, { label: 'rejected', value: 'rejected' }, { label: 'closed', value: 'closed' }] },
            { label: 'Date From', name: 'date_from', type: 'date' },
            { label: 'Date To', name: 'date_to', type: 'date' },
          ]}
          onChange={(name, value) => setFilters((current) => ({ ...current, [name]: value }))}
          onReset={() => setFilters(initialFilters)}
        />
      }
      columns={[
        { header: 'Product', render: (item) => <Link className="table-link" to={`/warehouse-returns/${item.id}`}>{item.product_name}</Link> },
        { header: 'Warehouse', render: (item) => item.warehouse_name },
        { header: 'Quantity', render: (item) => item.quantity },
        { header: 'Condition', render: (item) => <StatusBadge value={item.condition} /> },
        { header: 'Created', render: (item) => formatDate(item.created_at) },
      ]}
    />
  )
}
