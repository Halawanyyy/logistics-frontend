import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { MoreVertical } from 'lucide-react'
import { listDriverCashClosures, verifyDriverCashClosure } from '../api/finance.api'
import type { DriverCashClosure } from '../types/finance.types'
import { ResourceListPage } from '../../../shared/components/data/ResourceListPage'
import { StatusBadge } from '../../../shared/components/ui/StatusBadge'
import { formatDate, formatMoney } from '../../../shared/utils/formatters'
import { Button } from '../../../shared/components/ui/Button'
import { ApiFilterBar, compactFilters } from '../../../shared/components/data/ApiFilterBar'
import { Can } from '../../../shared/auth/Can'
import { PERMISSIONS } from '../../../shared/auth/permission-keys'
import { adminPath } from '../../../shared/routing/paths'
import { Card, CardContent } from '../../../shared/components/ui/Card'
import { MoneyDisplay } from '../../../shared/components/display/MoneyDisplay'
import { DropdownContent, DropdownItem, DropdownMenu, DropdownTrigger } from '../../../shared/components/ui/Dropdown'
import { getApiErrorMessage } from '../../../shared/api/api-error'

const initialFilters = {
  date_from: '',
  date_to: '',
  driver_id: '',
  status: '',
}

export function DriverCashClosuresPanel({
  embedded = false,
  onCountChange,
}: {
  embedded?: boolean
  onCountChange?: (count: number) => void
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState(initialFilters)
  const params = compactFilters(filters)
  const verifyMutation = useMutation({
    mutationFn: verifyDriverCashClosure,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['driver-cash-closures'] }),
        queryClient.invalidateQueries({ queryKey: ['driver-manifests'] }),
        queryClient.invalidateQueries({ queryKey: ['finance-reports'] }),
        queryClient.invalidateQueries({ queryKey: ['treasury'] }),
      ])
    },
  })

  return (
    <>
      {verifyMutation.error ? <div className="form-error" role="alert">{getApiErrorMessage(verifyMutation.error)}</div> : null}
      <ResourceListPage<DriverCashClosure>
      title={t('Driver Cash Closures', { defaultValue: 'Driver Cash Closures' })}
      description={t('Expected and verified COD cash closures.', {
        defaultValue: 'Expected and verified COD cash closures.',
      })}
      hideHeader={embedded}
      onCountChange={onCountChange}
      actions={<Can permission={PERMISSIONS.CASH_CLOSURES_CREATE}><Link className="ui-link-reset" to={adminPath('/finance/driver-cash-closures/create')}><Button>{t('Create Closure', { defaultValue: 'Create Closure' })}</Button></Link></Can>}
      queryKey={['driver-cash-closures', params]}
      queryFn={() => listDriverCashClosures(params)}
      filters={
        <ApiFilterBar
          filters={filters}
          fields={[
            { label: t('Date From'), name: 'date_from', type: 'date' },
            { label: t('Date To'), name: 'date_to', type: 'date' },
            { label: t('Driver', { defaultValue: 'Driver' }), name: 'driver_id', type: 'driver' },
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
      renderSummary={(closures) => {
        const expected = closures.reduce((sum, closure) => sum + Number(closure.expected_amount || 0), 0)
        const received = closures.reduce((sum, closure) => sum + Number(closure.received_amount || 0), 0)
        const difference = closures.reduce((sum, closure) => sum + Number(closure.difference_amount || 0), 0)
        return <div className="stats-grid finance-summary-grid"><Card variant="stat" className="finance-summary-card finance-summary-card--info" data-accent="drivers"><CardContent><div className="compact-stat"><span className="compact-stat__label">{t('Expected', { defaultValue: 'Expected' })}</span><span className="compact-stat__value text-info"><MoneyDisplay value={expected} /></span><span className="compact-stat__count">{t('{{count}} closures', { count: closures.length, defaultValue: `${closures.length} closures` })}</span></div></CardContent></Card><Card variant="stat" className="finance-summary-card finance-summary-card--success" data-accent="drivers"><CardContent><div className="compact-stat"><span className="compact-stat__label">{t('Received', { defaultValue: 'Received' })}</span><span className="compact-stat__value text-success"><MoneyDisplay value={received} /></span><span className="compact-stat__count">{t('Verified cash', { defaultValue: 'Verified cash' })}</span></div></CardContent></Card><Card variant="stat" className="finance-summary-card finance-summary-card--warning" data-accent="danger"><CardContent><div className="compact-stat"><span className="compact-stat__label">{t('Difference', { defaultValue: 'Difference' })}</span><span className="compact-stat__value text-warning"><MoneyDisplay value={difference} /></span><span className="compact-stat__count">{t('Current filtered total', { defaultValue: 'Current filtered total' })}</span></div></CardContent></Card></div>
      }}
      columns={[
        { header: t('Driver', { defaultValue: 'Driver' }), render: (closure) => <Link className="table-link" to={adminPath(`/finance/driver-cash-closures/${closure.id}`)}>{closure.driver_name}</Link> },
        { header: t('Expected', { defaultValue: 'Expected' }), render: (closure) => formatMoney(closure.expected_amount) },
        { header: t('Received', { defaultValue: 'Received' }), render: (closure) => formatMoney(closure.received_amount) },
        { header: t('Difference', { defaultValue: 'Difference' }), render: (closure) => formatMoney(closure.difference_amount) },
        { header: t('Status'), render: (closure) => <StatusBadge value={closure.status} /> },
        { header: t('Verified', { defaultValue: 'Verified' }), render: (closure) => formatDate(closure.verified_at) },
        { header: t('Actions'), render: (closure) => <div className="finance-row-actions">{closure.status === 'pending' ? <Can permission={PERMISSIONS.DRIVER_CASH_CLOSURES_VERIFY}><Button size="sm" loading={verifyMutation.isPending && verifyMutation.variables === closure.id} onClick={() => { if (window.confirm(t('Verify this cash closure and sync it to treasury?', { defaultValue: 'Verify this cash closure and sync it to treasury?' }))) verifyMutation.mutate(closure.id) }}>{t('Verify', { defaultValue: 'Verify' })}</Button></Can> : null}<Link className="ui-link-reset" to={adminPath(`/finance/driver-cash-closures/${closure.id}`)}><Button size="sm" variant="ghost">{t('View')}</Button></Link><DropdownMenu><DropdownTrigger aria-label={t('More actions', { defaultValue: 'More actions' })}><MoreVertical size={18} /></DropdownTrigger><DropdownContent><Can permission={PERMISSIONS.CASH_CLOSURES_UPDATE}><DropdownItem><Link className="ui-link-reset" to={adminPath(`/finance/driver-cash-closures/${closure.id}/edit`)}>{t('Edit')}</Link></DropdownItem></Can></DropdownContent></DropdownMenu></div> },
      ]}
      />
    </>
  )
}

export function DriverCashClosuresPage() {
  return <DriverCashClosuresPanel />
}
