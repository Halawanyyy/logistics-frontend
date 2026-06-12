import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
  const [filters, setFilters] = useState(initialFilters)
  const params = compactFilters(filters)
  return (
    <ResourceListPage<DriverCashClosure>
      title={t('Driver Cash Closures', { defaultValue: 'Driver Cash Closures' })}
      description={t('Expected and verified COD cash closures.', {
        defaultValue: 'Expected and verified COD cash closures.',
      })}
      actions={<Can permission={PERMISSIONS.CASH_CLOSURES_CREATE}><Link className="ui-link-reset" to={adminPath('/finance/driver-cash-closures/create')}><Button>{t('Create Closure', { defaultValue: 'Create Closure' })}</Button></Link></Can>}
      queryKey={['driver-cash-closures', params]}
      queryFn={() => listDriverCashClosures(params)}
      filters={
        <ApiFilterBar
          filters={filters}
          fields={[
            { label: t('Date From'), name: 'date_from', type: 'date' },
            { label: t('Date To'), name: 'date_to', type: 'date' },
            { label: t('Driver ID', { defaultValue: 'Driver ID' }), name: 'driver_id', type: 'number' },
            {
              label: t('Status'),
              name: 'status',
              type: 'select',
              options: [
                { label: t('pending', { defaultValue: 'pending' }), value: 'pending' },
                { label: t('verified', { defaultValue: 'verified' }), value: 'verified' },
                { label: t('disputed', { defaultValue: 'disputed' }), value: 'disputed' },
              ],
            },
          ]}
          onChange={(name, value) => setFilters((current) => ({ ...current, [name]: value }))}
          onReset={() => setFilters(initialFilters)}
        />
      }
      columns={[
        { header: t('Driver', { defaultValue: 'Driver' }), render: (closure) => <Link className="table-link" to={adminPath(`/finance/driver-cash-closures/${closure.id}`)}>{closure.driver_name}</Link> },
        { header: t('Expected', { defaultValue: 'Expected' }), render: (closure) => formatMoney(closure.expected_amount) },
        { header: t('Received', { defaultValue: 'Received' }), render: (closure) => formatMoney(closure.received_amount) },
        { header: t('Difference', { defaultValue: 'Difference' }), render: (closure) => formatMoney(closure.difference_amount) },
        { header: t('Status'), render: (closure) => <StatusBadge value={closure.status} /> },
        { header: t('Verified', { defaultValue: 'Verified' }), render: (closure) => formatDate(closure.verified_at) },
        { header: t('Actions'), render: (closure) => <Can permission={PERMISSIONS.CASH_CLOSURES_UPDATE}><Link className="table-link" to={adminPath(`/finance/driver-cash-closures/${closure.id}/edit`)}>{t('Edit')}</Link></Can> },
      ]}
    />
  )
}
