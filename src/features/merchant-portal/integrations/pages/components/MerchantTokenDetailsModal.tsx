import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Dialog } from '../../../../../shared/components/ui/Dialog'
import { CardTitle } from '../../../../../shared/components/ui/Card'
import { StatusBadge } from '../../../../../shared/components/ui/StatusBadge'
import { LoadingState } from '../../../../../shared/components/states/LoadingState'
import { ErrorState } from '../../../../../shared/components/states/ErrorState'
import { getApiErrorMessage } from '../../../../../shared/api/api-error'
import { formatDate } from '../../../../../shared/utils/formatters'
import { getMerchantIntegrationToken } from '../../api/merchantPortalIntegrations.api'

type MerchantTokenDetailsModalProps = {
  tokenId: number | null
  onClose: () => void
}

export function MerchantTokenDetailsModal({ tokenId, onClose }: MerchantTokenDetailsModalProps) {
  const { t } = useTranslation()

  const tokenDetailsQuery = useQuery({
    queryKey: ['merchant-portal', 'integration-token', tokenId],
    queryFn: () => getMerchantIntegrationToken(tokenId!),
    enabled: Boolean(tokenId),
  })

  return (
    <Dialog
      open={Boolean(tokenId)}
      onClose={onClose}
      title={<CardTitle>{t('Integration Token Details', { defaultValue: 'Integration Token Details' })}</CardTitle>}
    >
      {tokenDetailsQuery.isLoading ? <LoadingState title={t('Loading token details', { defaultValue: 'Loading token details' })} /> : null}
      {tokenDetailsQuery.isError ? (
        <ErrorState
          title={t('Unable to load token details', { defaultValue: 'Unable to load token details' })}
          message={getApiErrorMessage(tokenDetailsQuery.error)}
          onRetry={() => void tokenDetailsQuery.refetch()}
        />
      ) : null}
      {tokenDetailsQuery.data ? (
        <dl className="detail-list">
          <div><dt>{t('Name')}</dt><dd>{tokenDetailsQuery.data.data.name}</dd></div>
          <div><dt>{t('Provider', { defaultValue: 'Provider' })}</dt><dd><StatusBadge value={tokenDetailsQuery.data.data.provider}>{tokenDetailsQuery.data.data.provider}</StatusBadge></dd></div>
          <div><dt>{t('Token Prefix', { defaultValue: 'Token Prefix' })}</dt><dd>{tokenDetailsQuery.data.data.token_prefix}</dd></div>
          <div><dt>{t('Permissions')}</dt><dd>{tokenDetailsQuery.data.data.permissions?.join(', ') || '-'}</dd></div>
          <div><dt>{t('Status')}</dt><dd><StatusBadge value={tokenDetailsQuery.data.data.status} /></dd></div>
          <div><dt>{t('Last Used', { defaultValue: 'Last Used' })}</dt><dd>{tokenDetailsQuery.data.data.last_used_at ? formatDate(tokenDetailsQuery.data.data.last_used_at) : '-'}</dd></div>
          <div><dt>{t('Expires', { defaultValue: 'Expires' })}</dt><dd>{tokenDetailsQuery.data.data.expires_at ? formatDate(tokenDetailsQuery.data.data.expires_at) : '-'}</dd></div>
          <div><dt>{t('Notes', { defaultValue: 'Notes' })}</dt><dd>{tokenDetailsQuery.data.data.notes ?? '-'}</dd></div>
          <div><dt>{t('Created', { defaultValue: 'Created' })}</dt><dd>{formatDate(tokenDetailsQuery.data.data.created_at)}</dd></div>
        </dl>
      ) : null}
    </Dialog>
  )
}
