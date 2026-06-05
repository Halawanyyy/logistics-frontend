import { Link } from 'react-router-dom'
import { useState } from 'react'
import { listDriverCashClosures } from '../api/finance.api'
import type { DriverCashClosure } from '../types/finance.types'
import { ResourceListPage } from '../../../shared/components/data/ResourceListPage'
import { StatusBadge } from '../../../shared/components/ui/StatusBadge'
import { formatDate, formatMoney } from '../../../shared/utils/formatters'
import { Button } from '../../../shared/components/ui/Button'
import { ApiFilterBar, compactFilters } from '../../../shared/components/data/ApiFilterBar'
import { Can } from '../../../shared/auth/Can'
import { PERMISSIONS } from '../../../shared/auth/permission-keys'
import { adminPath } from '../../../shared/routing/paths'

const initialFilters = {
  date_from: '',
  date_to: '',
  driver_id: '',
  status: '',
}

export function DriverCashClosuresPage() {
  const [filters, setFilters] = useState(initialFilters)
  const params = compactFilters(filters)
  return (
    <ResourceListPage<DriverCashClosure>
      title="Driver Cash Closures"
      description="Expected and verified COD cash closures."
      actions={<Can permission={PERMISSIONS.CASH_CLOSURES_CREATE}><Link className="ui-link-reset" to={adminPath('/finance/driver-cash-closures/create')}><Button>Create Closure</Button></Link></Can>}
      queryKey={['driver-cash-closures', params]}
      queryFn={() => listDriverCashClosures(params)}
      filters={
        <ApiFilterBar
          filters={filters}
          fields={[
            { label: 'Date From', name: 'date_from', type: 'date' },
            { label: 'Date To', name: 'date_to', type: 'date' },
            { label: 'Driver ID', name: 'driver_id', type: 'number' },
            { label: 'Status', name: 'status', type: 'select', options: [{ label: 'pending', value: 'pending' }, { label: 'verified', value: 'verified' }, { label: 'disputed', value: 'disputed' }] },
          ]}
          onChange={(name, value) => setFilters((current) => ({ ...current, [name]: value }))}
          onReset={() => setFilters(initialFilters)}
        />
      }
      columns={[
        { header: 'Driver', render: (closure) => <Link className="table-link" to={adminPath(`/finance/driver-cash-closures/${closure.id}`)}>{closure.driver_name}</Link> },
        { header: 'Expected', render: (closure) => formatMoney(closure.expected_amount) },
        { header: 'Received', render: (closure) => formatMoney(closure.received_amount) },
        { header: 'Difference', render: (closure) => formatMoney(closure.difference_amount) },
        { header: 'Status', render: (closure) => <StatusBadge value={closure.status} /> },
        { header: 'Verified', render: (closure) => formatDate(closure.verified_at) },
        { header: 'Actions', render: (closure) => <Can permission={PERMISSIONS.CASH_CLOSURES_UPDATE}><Link className="table-link" to={adminPath(`/finance/driver-cash-closures/${closure.id}/edit`)}>Edit</Link></Can> },
      ]}
    />
  )
}
