import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { deleteTreasuryAccount, getTreasuryAccount } from '../api/finance.api'
import { getApiErrorMessage, isApiNotFound } from '../../../shared/api/api-error'
import { Can } from '../../../shared/auth/Can'
import { PERMISSIONS } from '../../../shared/auth/permission-keys'
import { ConfirmActionModal } from '../../../shared/components/modals/ConfirmActionModal'
import { MoneyDisplay } from '../../../shared/components/display/MoneyDisplay'
import { ErrorState } from '../../../shared/components/states/ErrorState'
import { LoadingState } from '../../../shared/components/states/LoadingState'
import { NotFoundState } from '../../../shared/components/states/NotFoundState'
import { Button } from '../../../shared/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../shared/components/ui/Card'
import { PageHeader } from '../../../shared/components/ui/PageHeader'
import { StatusBadge } from '../../../shared/components/ui/StatusBadge'
import { useState } from 'react'
import { adminPath } from '../../../shared/routing/paths'

export function TreasuryAccountDetailsPage() {
  const { t } = useTranslation()
  const { accountId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const treasuryAccountQuery = useQuery({
    queryKey: ['treasury-accounts', accountId],
    queryFn: () => getTreasuryAccount(accountId!),
    enabled: Boolean(accountId),
  })
  const deleteMutation = useMutation({
    mutationFn: () => deleteTreasuryAccount(accountId!),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['treasury-accounts'] })
      navigate(adminPath('/finance/treasury/accounts'))
    },
  })

  if (treasuryAccountQuery.isLoading) {
    return <LoadingState title={t('Loading treasury account', { defaultValue: 'Loading treasury account' })} />
  }

  if (treasuryAccountQuery.isError && isApiNotFound(treasuryAccountQuery.error)) {
    return (
      <NotFoundState
        title={t('Treasury account not found', { defaultValue: 'Treasury account not found' })}
        description={t('This treasury account could not be found in the finance APIs.', { defaultValue: 'This treasury account could not be found in the finance APIs.' })}
      />
    )
  }

  if (treasuryAccountQuery.isError || !treasuryAccountQuery.data) {
    return <ErrorState message={getApiErrorMessage(treasuryAccountQuery.error)} />
  }

  const account = treasuryAccountQuery.data.data

  return (
    <section className="page-section">
      <PageHeader
        title={account.name}
        description={t('Treasury account {{code}}', {
          code: account.code,
          defaultValue: `Treasury account ${account.code}`,
        })}
        actions={(
          <div className="page-header__button-row">
            <Can permission={PERMISSIONS.FINANCE_TREASURY_UPDATE}>
              <Link className="ui-link-reset" to={adminPath(`/finance/treasury/accounts/${account.id}/edit`)}>
                <Button variant="secondary">{t('Edit')}</Button>
              </Link>
            </Can>
            <Can permission={PERMISSIONS.FINANCE_TREASURY_DELETE}>
              <Button variant="danger" onClick={() => setDeleteOpen(true)}>
                {t('Delete')}
              </Button>
            </Can>
            <Link className="ui-link-reset" to={adminPath('/finance/treasury/accounts')}>
              <Button variant="secondary">{t('Back')}</Button>
            </Link>
          </div>
        )}
      />
      {deleteMutation.error ? <div className="form-error">{getApiErrorMessage(deleteMutation.error)}</div> : null}
      <Card>
        <CardHeader>
          <CardTitle>{t('Account Details', { defaultValue: 'Account Details' })}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="detail-list">
            <div><dt>{t('Name')}</dt><dd>{account.name}</dd></div>
            <div><dt>{t('Code')}</dt><dd>{account.code}</dd></div>
            <div><dt>{t('Type')}</dt><dd>{account.type}</dd></div>
            <div><dt>{t('Opening Balance', { defaultValue: 'Opening Balance' })}</dt><dd><MoneyDisplay value={account.opening_balance} /></dd></div>
            <div><dt>{t('Current Balance', { defaultValue: 'Current Balance' })}</dt><dd><MoneyDisplay value={account.current_balance ?? null} /></dd></div>
            <div><dt>{t('Status')}</dt><dd><StatusBadge value={account.status} /></dd></div>
            <div><dt>{t('Notes')}</dt><dd>{account.notes ?? '-'}</dd></div>
          </dl>
        </CardContent>
      </Card>

      <ConfirmActionModal
        open={deleteOpen}
        title={t('Delete treasury account', { defaultValue: 'Delete treasury account' })}
        description={t('Delete {{name}}?', {
          name: account.name,
          defaultValue: `Delete ${account.name}?`,
        })}
        confirmLabel={t('Delete account', { defaultValue: 'Delete account' })}
        variant="danger"
        loading={deleteMutation.isPending}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => deleteMutation.mutate()}
      />
    </section>
  )
}
