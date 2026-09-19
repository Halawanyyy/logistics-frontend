import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Dialog } from '../../../../../shared/components/ui/Dialog'
import { CardTitle } from '../../../../../shared/components/ui/Card'
import { LoadingState } from '../../../../../shared/components/states/LoadingState'
import { ErrorState } from '../../../../../shared/components/states/ErrorState'
import { getApiErrorMessage } from '../../../../../shared/api/api-error'
import { formatDate } from '../../../../../shared/utils/formatters'
import { getMerchantIntegrationToken } from '../../api/merchantPortalIntegrations.api'
import { Button } from '../../../../../shared/components/ui/Button'

type MerchantTokenDetailsModalProps = {
  tokenId: number | null
  onClose: () => void
}

export function MerchantTokenDetailsModal({
  tokenId,
  onClose,
}: MerchantTokenDetailsModalProps) {
  const { t } = useTranslation()

  const tokenDetailsQuery = useQuery({
    queryKey: ['merchant-portal', 'integration-token', tokenId],
    queryFn: () => getMerchantIntegrationToken(tokenId!),
    enabled: Boolean(tokenId),
  })

  const token = tokenDetailsQuery.data?.data

  return (
    <Dialog
      open={Boolean(tokenId)}
      onClose={onClose}
      title={
        <CardTitle>
          {t('API Token Details', { defaultValue: 'API Token Details' })}
        </CardTitle>
      }
    >
      {tokenDetailsQuery.isLoading ? (
        <LoadingState
          title={t('Loading token details...', {
            defaultValue: 'Loading token details...',
          })}
        />
      ) : null}

      {tokenDetailsQuery.isError ? (
        <ErrorState
          title={t('Unable to load token details', {
            defaultValue: 'Unable to load token details',
          })}
          message={getApiErrorMessage(tokenDetailsQuery.error)}
          onRetry={() => void tokenDetailsQuery.refetch()}
        />
      ) : null}

      {token ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <dl className="detail-list">
            <div>
              <dt>{t('Name')}</dt>
              <dd style={{ fontWeight: 600 }}>{token.name}</dd>
            </div>
            <div>
              <dt>{t('Provider', { defaultValue: 'Provider' })}</dt>
              <dd>
                <span className="merchant-provider-badge">{token.provider}</span>
              </dd>
            </div>
            <div>
              <dt>{t('Token Prefix', { defaultValue: 'Token Prefix' })}</dt>
              <dd>
                <code
                  style={{
                    fontFamily: 'monospace',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: 'rgba(255, 255, 255, 0.05)',
                  }}
                >
                  {token.token_prefix}
                </code>
              </dd>
            </div>
            <div>
              <dt>{t('Status')}</dt>
              <dd>
                <span
                  className={`merchant-status-badge--${
                    token.status === 'active'
                      ? 'active'
                      : token.status === 'revoked'
                      ? 'revoked'
                      : 'expired'
                  }`}
                >
                  {token.status}
                </span>
              </dd>
            </div>
            <div>
              <dt>{t('Abilities / Scopes', { defaultValue: 'Abilities / Scopes' })}</dt>
              <dd>
                {token.permissions && token.permissions.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {token.permissions.map((perm) => (
                      <span
                        key={perm}
                        style={{
                          fontSize: '0.75rem',
                          fontFamily: 'monospace',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: 'rgba(59, 130, 246, 0.1)',
                          border: '1px solid rgba(59, 130, 246, 0.25)',
                          color: '#60a5fa',
                        }}
                      >
                        {perm}
                      </span>
                    ))}
                  </div>
                ) : (
                  '-'
                )}
              </dd>
            </div>
            <div>
              <dt>{t('Last Used', { defaultValue: 'Last Used' })}</dt>
              <dd>{token.last_used_at ? formatDate(token.last_used_at) : '-'}</dd>
            </div>
            <div>
              <dt>{t('Expires', { defaultValue: 'Expires' })}</dt>
              <dd>{token.expires_at ? formatDate(token.expires_at) : t('Never', { defaultValue: 'Never' })}</dd>
            </div>
            <div>
              <dt>{t('Created', { defaultValue: 'Created' })}</dt>
              <dd>{formatDate(token.created_at)}</dd>
            </div>
            <div>
              <dt>{t('Notes', { defaultValue: 'Notes' })}</dt>
              <dd>{token.notes ?? '-'}</dd>
            </div>
          </dl>

          <div className="form-actions" style={{ justifyContent: 'flex-end' }}>
            <Button type="button" variant="secondary" onClick={onClose}>
              {t('Close', { defaultValue: 'Close' })}
            </Button>
          </div>
        </div>
      ) : null}
    </Dialog>
  )
}
