import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { listTreasuryAccounts } from '../api/finance.api'
import type { TreasuryAccount } from '../types/finance.types'
import { Can } from '../../../shared/auth/Can'
import { PERMISSIONS } from '../../../shared/auth/permission-keys'
import { ResourceListPage } from '../../../shared/components/data/ResourceListPage'
import { MoneyDisplay } from '../../../shared/components/display/MoneyDisplay'
import { StatusBadge } from '../../../shared/components/ui/StatusBadge'
import { Button } from '../../../shared/components/ui/Button'
import { Card, CardContent } from '../../../shared/components/ui/Card'
import { Select } from '../../../shared/components/ui/Select'
import { adminPath } from '../../../shared/routing/paths'

const initialStatus = ''

export function TreasuryAccountsPage() {
  const { t } = useTranslation()
  const [status, setStatus] = useState(initialStatus)

  return (
    <section className="page-section">
      <ResourceListPage<TreasuryAccount>
        title={t('Treasury Accounts')}
        description={t('Treasury account balances and statuses returned by finance APIs.', { defaultValue: 'Treasury account balances and statuses returned by finance APIs.' })}
        actions={(
          <Can permission={PERMISSIONS.FINANCE_TREASURY_CREATE}>
            <Link className="ui-link-reset" to={adminPath('/finance/treasury/accounts/create')}>
              <Button>{t('Create Treasury Account')}</Button>
            </Link>
          </Can>
        )}
        queryKey={['treasury-accounts', status]}
        queryFn={() =>
          listTreasuryAccounts().then((response) => ({
            ...response,
            data: status
              ? response.data.filter((account) => account.status === status)
              : response.data,
          }))
        }
        filters={(
          <Card variant="flat" className="dashboard-filter-card">
            <CardContent className="dashboard-filters">
              <label className="field">
                <span>{t('Status')}</span>
                <Select value={status} onChange={(event) => setStatus(event.target.value)}>
                  <option value="">{t('All statuses')}</option>
                  <option value="active">{t('Active')}</option>
                  <option value="inactive">{t('Inactive')}</option>
                </Select>
              </label>
            </CardContent>
          </Card>
        )}
        columns={[
          {
            header: 'Account',
            render: (account) => (
              <Link className="table-link" to={adminPath(`/finance/treasury/accounts/${account.id}`)}>
                {account.name}
              </Link>
            ),
          },
          { header: 'Code', render: (account) => account.code },
          { header: 'Type', render: (account) => account.type },
          { header: 'Opening Balance', render: (account) => <MoneyDisplay value={account.opening_balance} /> },
          { header: 'Current Balance', render: (account) => <MoneyDisplay value={account.current_balance ?? null} /> },
          { header: 'Status', render: (account) => <StatusBadge value={account.status} /> },
        ]}
        emptyTitle={t('No treasury accounts found', { defaultValue: 'No treasury accounts found' })}
      />
    </section>
  )
}
