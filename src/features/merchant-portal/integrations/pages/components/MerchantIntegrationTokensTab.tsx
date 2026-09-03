import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  listMerchantIntegrationTokens,
  revokeMerchantIntegrationToken,
  deleteMerchantIntegrationToken,
} from '../../api/merchantPortalIntegrations.api'
import type { MerchantIntegrationToken } from '../../types/merchantPortalIntegrations.types'
import { getApiErrorMessage } from '../../../../../shared/api/api-error'
import { CanMerchant } from '../../../components/CanMerchant'
import { Button } from '../../../../../shared/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../../shared/components/ui/Card'
import { Table, TableCell, TableContainer, TableHead } from '../../../../../shared/components/ui/Table'
import { StatusBadge } from '../../../../../shared/components/ui/StatusBadge'
import { LoadingState } from '../../../../../shared/components/states/LoadingState'
import { ErrorState } from '../../../../../shared/components/states/ErrorState'
import { EmptyState } from '../../../../../shared/components/states/EmptyState'
import { formatDate } from '../../../../../shared/utils/formatters'
import { ConfirmActionModal } from '../../../../../shared/components/modals/ConfirmActionModal'
import { MerchantCreateTokenModal } from './MerchantCreateTokenModal'
import { MerchantTokenDetailsModal } from './MerchantTokenDetailsModal'
import { Input } from '../../../../../shared/components/ui/Input'
import { Dialog } from '../../../../../shared/components/ui/Dialog'

export function MerchantIntegrationTokensTab() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  
  const [createOpen, setCreateOpen] = useState(false)
  const [tokenCreated, setTokenCreated] = useState<MerchantIntegrationToken | null>(null)
  const [selectedTokenId, setSelectedTokenId] = useState<number | null>(null)
  const [tokenPendingDelete, setTokenPendingDelete] = useState<MerchantIntegrationToken | null>(null)
  const [tokenPendingRevoke, setTokenPendingRevoke] = useState<MerchantIntegrationToken | null>(null)
  const [revokeNotes, setRevokeNotes] = useState('')
  const [copied, setCopied] = useState(false)

  const tokensQuery = useQuery({
    queryKey: ['merchant-portal', 'integration-tokens'],
    queryFn: listMerchantIntegrationTokens,
  })

  const revokeMutation = useMutation({
    mutationFn: ({ tokenId, notes }: { tokenId: number; notes: string | null }) =>
      revokeMerchantIntegrationToken(tokenId, { notes }),
    onSuccess: async () => {
      setTokenPendingRevoke(null)
      setRevokeNotes('')
      await queryClient.invalidateQueries({ queryKey: ['merchant-portal', 'integration-tokens'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (tokenId: number) => deleteMerchantIntegrationToken(tokenId),
    onSuccess: async () => {
      setTokenPendingDelete(null)
      await queryClient.invalidateQueries({ queryKey: ['merchant-portal', 'integration-tokens'] })
    },
  })

  const tokens = tokensQuery.data?.data ?? []

  async function copyToken() {
    if (!tokenCreated?.plain_token) return
    await navigator.clipboard.writeText(tokenCreated.plain_token)
    setCopied(true)
  }

  function handleRevokeSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (tokenPendingRevoke) {
      revokeMutation.mutate({
        tokenId: tokenPendingRevoke.id,
        notes: revokeNotes || null,
      })
    }
  }

  return (
    <div className="page-stack">
      {tokenCreated?.plain_token ? (
        <Card className="feedback-card">
          <CardHeader>
            <CardTitle>{t('Copy this token now', { defaultValue: 'Copy this token now' })}</CardTitle>
            <CardDescription>
              {t('This raw token will not be shown again.', { defaultValue: 'This raw token will not be shown again.' })}
            </CardDescription>
          </CardHeader>
          <CardContent className="form-grid">
            <Input value={tokenCreated.plain_token} readOnly />
            <div className="form-actions">
              <Button type="button" variant="secondary" onClick={() => void copyToken()}>
                {copied ? t('Copied') : t('Copy Token', { defaultValue: 'Copy Token' })}
              </Button>
              <Button type="button" variant="secondary" onClick={() => { setTokenCreated(null); setCopied(false) }}>
                {t('Dismiss', { defaultValue: 'Dismiss' })}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <div className="section-title-row">
            <div>
              <CardTitle>{t('Integration Tokens', { defaultValue: 'Integration Tokens' })}</CardTitle>
              <CardDescription>
                {t('Manage API tokens for external integrations.', { defaultValue: 'Manage API tokens for external integrations.' })}
              </CardDescription>
            </div>
            <CanMerchant capability="integrations.manage">
              <Button type="button" variant="secondary" onClick={() => setCreateOpen(true)}>
                {t('Create Token', { defaultValue: 'Create Token' })}
              </Button>
            </CanMerchant>
          </div>
        </CardHeader>
        <CardContent>
          {tokensQuery.isLoading ? <LoadingState title={t('Loading integration tokens', { defaultValue: 'Loading integration tokens' })} /> : null}
          {tokensQuery.isError ? (
            <ErrorState
              title={t('Unable to load integration tokens', { defaultValue: 'Unable to load integration tokens' })}
              message={getApiErrorMessage(tokensQuery.error)}
              onRetry={() => void tokensQuery.refetch()}
            />
          ) : null}
          {!tokensQuery.isLoading && !tokensQuery.isError && !tokens.length ? (
            <EmptyState
              title={t('No integration tokens', { defaultValue: 'No integration tokens' })}
              description={t('No integration tokens have been created.', { defaultValue: 'No integration tokens have been created.' })}
            />
          ) : null}
          {tokens.length ? (
            <TableContainer>
              <Table variant="compact">
                <thead>
                  <tr>
                    <TableHead>{t('Name')}</TableHead>
                    <TableHead>{t('Provider', { defaultValue: 'Provider' })}</TableHead>
                    <TableHead>{t('Token Prefix', { defaultValue: 'Token Prefix' })}</TableHead>
                    <TableHead>{t('Status')}</TableHead>
                    <TableHead>{t('Created', { defaultValue: 'Created' })}</TableHead>
                    <TableHead>{t('Actions')}</TableHead>
                  </tr>
                </thead>
                <tbody>
                  {tokens.map((token: any) => (
                    <tr key={token.id}>
                      <TableCell>{token.name}</TableCell>
                      <TableCell><StatusBadge value={token.provider}>{token.provider}</StatusBadge></TableCell>
                      <TableCell>{token.token_prefix}</TableCell>
                      <TableCell><StatusBadge value={token.status} /></TableCell>
                      <TableCell>{formatDate(token.created_at)}</TableCell>
                      <TableCell>
                        <div className="page-header__button-row">
                          <Button type="button" variant="secondary" onClick={() => setSelectedTokenId(token.id)}>
                            {t('Details', { defaultValue: 'Details' })}
                          </Button>
                          <CanMerchant capability="integrations.manage">
                            {token.status === 'active' ? (
                              <Button type="button" variant="secondary" onClick={() => setTokenPendingRevoke(token)}>
                                {t('Revoke', { defaultValue: 'Revoke' })}
                              </Button>
                            ) : null}
                            <Button type="button" variant="danger" onClick={() => setTokenPendingDelete(token)}>
                              {t('Delete')}
                            </Button>
                          </CanMerchant>
                        </div>
                      </TableCell>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableContainer>
          ) : null}
        </CardContent>
      </Card>

      <MerchantCreateTokenModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(token) => {
          setCopied(false)
          setTokenCreated(token)
        }}
      />
      
      <MerchantTokenDetailsModal
        tokenId={selectedTokenId}
        onClose={() => setSelectedTokenId(null)}
      />

      <Dialog
        open={Boolean(tokenPendingRevoke)}
        onClose={() => setTokenPendingRevoke(null)}
        title={<CardTitle>{t('Revoke Token', { defaultValue: 'Revoke Token' })}</CardTitle>}
        variant="small"
      >
        <form onSubmit={handleRevokeSubmit} className="form-grid">
          {revokeMutation.isError ? (
            <ErrorState
              title={t('Failed to revoke token', { defaultValue: 'Failed to revoke token' })}
              message={getApiErrorMessage(revokeMutation.error)}
            />
          ) : null}
          <div className="form-group">
            <label htmlFor="revoke_notes">{t('Notes', { defaultValue: 'Notes' })}</label>
            <Input
              id="revoke_notes"
              value={revokeNotes}
              onChange={(e) => setRevokeNotes(e.target.value)}
              placeholder={t('Reason for revoking (optional)', { defaultValue: 'Reason for revoking (optional)' })}
            />
          </div>
          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => setTokenPendingRevoke(null)} disabled={revokeMutation.isPending}>
              {t('Cancel')}
            </Button>
            <Button type="submit" variant="danger" disabled={revokeMutation.isPending}>
              {revokeMutation.isPending ? t('Revoking...') : t('Revoke Token', { defaultValue: 'Revoke Token' })}
            </Button>
          </div>
        </form>
      </Dialog>

      <ConfirmActionModal
        open={Boolean(tokenPendingDelete)}
        title={t('Delete integration token', { defaultValue: 'Delete integration token' })}
        description={tokenPendingDelete ? t('Delete {{token}}?', { token: tokenPendingDelete.name, defaultValue: `Delete ${tokenPendingDelete.name}?` }) : ''}
        confirmLabel={t('Delete token', { defaultValue: 'Delete token' })}
        variant="danger"
        loading={deleteMutation.isPending}
        onCancel={() => setTokenPendingDelete(null)}
        onConfirm={() => {
          if (tokenPendingDelete) deleteMutation.mutate(tokenPendingDelete.id)
        }}
      />
    </div>
  )
}
