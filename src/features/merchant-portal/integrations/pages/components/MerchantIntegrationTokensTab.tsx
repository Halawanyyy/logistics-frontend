import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Copy, Check, AlertTriangle } from 'lucide-react'
import {
  listMerchantIntegrationTokens,
  revokeMerchantIntegrationToken,
  deleteMerchantIntegrationToken,
} from '../../api/merchantPortalIntegrations.api'
import type { MerchantIntegrationToken } from '../../types/merchantPortalIntegrations.types'
import { getApiErrorMessage } from '../../../../../shared/api/api-error'
import { CanMerchant } from '../../../components/CanMerchant'
import { Button } from '../../../../../shared/components/ui/Button'
import { CardTitle } from '../../../../../shared/components/ui/Card'
import { Table, TableCell, TableContainer, TableHead } from '../../../../../shared/components/ui/Table'
import { Skeleton } from '../../../../../shared/components/ui/Skeleton'
import { ErrorState } from '../../../../../shared/components/states/ErrorState'
import { EmptyState } from '../../../../../shared/components/states/EmptyState'
import { formatDate } from '../../../../../shared/utils/formatters'
import { ConfirmActionModal } from '../../../../../shared/components/modals/ConfirmActionModal'
import { MerchantCreateTokenModal } from './MerchantCreateTokenModal'
import { MerchantTokenDetailsModal } from './MerchantTokenDetailsModal'
import { Input } from '../../../../../shared/components/ui/Input'
import { Dialog } from '../../../../../shared/components/ui/Dialog'

type MerchantIntegrationTokensTabProps = {
  createOpen?: boolean
  onCloseCreate?: () => void
  onOpenCreate?: () => void
  hideCardHeaderButton?: boolean
}

export function MerchantIntegrationTokensTab({
  createOpen: controlledCreateOpen,
  onCloseCreate,
  onOpenCreate,
  hideCardHeaderButton = false,
}: MerchantIntegrationTokensTabProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  // Internal create state if not controlled
  const [internalCreateOpen, setInternalCreateOpen] = useState(false)
  const isCreateOpen = controlledCreateOpen !== undefined ? controlledCreateOpen : internalCreateOpen
  const handleCloseCreate = onCloseCreate || (() => setInternalCreateOpen(false))
  const handleOpenCreate = onOpenCreate || (() => setInternalCreateOpen(true))

  // Plaintext token state (shown once upon creation)
  const [tokenCreated, setTokenCreated] = useState<MerchantIntegrationToken | null>(null)
  const [copied, setCopied] = useState(false)

  // Details Modal
  const [selectedTokenId, setSelectedTokenId] = useState<number | null>(null)

  // Revoke Modal
  const [tokenPendingRevoke, setTokenPendingRevoke] = useState<MerchantIntegrationToken | null>(null)
  const [revokeNotes, setRevokeNotes] = useState('')

  // Delete Modal
  const [tokenPendingDelete, setTokenPendingDelete] = useState<MerchantIntegrationToken | null>(null)

  // Query tokens
  const tokensQuery = useQuery({
    queryKey: ['merchant-portal', 'integration-tokens'],
    queryFn: listMerchantIntegrationTokens,
  })

  // Revoke Mutation
  const revokeMutation = useMutation({
    mutationFn: ({ tokenId, notes }: { tokenId: number; notes: string | null }) =>
      revokeMerchantIntegrationToken(tokenId, { notes }),
    onSuccess: async () => {
      setTokenPendingRevoke(null)
      setRevokeNotes('')
      await queryClient.invalidateQueries({ queryKey: ['merchant-portal', 'integration-tokens'] })
    },
  })

  // Delete Mutation
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
    setTimeout(() => setCopied(false), 2000)
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* One-time Plaintext Token Banner */}
      {tokenCreated?.plain_token ? (
        <div className="merchant-integrations-plaintext-card" role="alert">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <AlertTriangle className="text-amber-400 shrink-0" size={20} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.95rem' }}>
                {t('Token Created Successfully', { defaultValue: 'Token Created Successfully' })}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#f59e0b', marginTop: '0.15rem' }}>
                {t('Copy this token now. You will not be able to view it again.', {
                  defaultValue: 'Copy this token now. You will not be able to view it again.',
                })}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
            <Input
              value={tokenCreated.plain_token}
              readOnly
              style={{
                fontFamily: 'monospace',
                fontSize: '0.85rem',
                background: '#090d16',
                borderColor: 'rgba(245, 158, 11, 0.4)',
                color: '#fde047',
              }}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => void copyToken()}
              style={{ whiteSpace: 'nowrap' }}
            >
              {copied ? <Check size={14} className="mr-1 text-emerald-400" /> : <Copy size={14} className="mr-1" />}
              {copied ? t('Copied', { defaultValue: 'Copied' }) : t('Copy Token', { defaultValue: 'Copy Token' })}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setTokenCreated(null)
                setCopied(false)
              }}
            >
              {t('Dismiss', { defaultValue: 'Dismiss' })}
            </Button>
          </div>
        </div>
      ) : null}

      {/* Main API Tokens Card */}
      <div className="merchant-integrations-card">
        <div className="merchant-integrations-card__header">
          <div>
            <h2 className="merchant-integrations-card__title">
              {t('API Tokens', { defaultValue: 'API Tokens' })}
            </h2>
            <p className="merchant-integrations-card__desc">
              {t('Manage API tokens for external integrations.', {
                defaultValue: 'Manage API tokens for external integrations.',
              })}
            </p>
          </div>

          {!hideCardHeaderButton ? (
            <CanMerchant capability="integrations.manage">
              <Button
                type="button"
                className="merchant-integrations-btn--create"
                onClick={handleOpenCreate}
              >
                <Plus size={15} />
                <span>{t('Create Token', { defaultValue: 'Create Token' })}</span>
              </Button>
            </CanMerchant>
          ) : null}
        </div>

        <div>
          {/* Loading Skeletons */}
          {tokensQuery.isLoading ? (
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : null}

          {/* Error State */}
          {tokensQuery.isError ? (
            <div style={{ padding: '1.5rem' }}>
              <ErrorState
                title={t('Unable to load API tokens', {
                  defaultValue: 'Unable to load API tokens',
                })}
                message={getApiErrorMessage(tokensQuery.error)}
                onRetry={() => void tokensQuery.refetch()}
              />
            </div>
          ) : null}

          {/* Empty State */}
          {!tokensQuery.isLoading && !tokensQuery.isError && !tokens.length ? (
            <div style={{ padding: '2rem 1.5rem' }}>
              <EmptyState
                title={t('No API tokens yet', {
                  defaultValue: 'No API tokens yet',
                })}
                description={t(
                  'Create a token to connect your external store or system.',
                  {
                    defaultValue:
                      'Create a token to connect your external store or system.',
                  }
                )}
                action={
                  <CanMerchant capability="integrations.manage">
                    <Button
                      type="button"
                      className="merchant-integrations-btn--create"
                      onClick={handleOpenCreate}
                    >
                      <Plus size={15} />
                      <span>
                        {t('Create Token', {
                          defaultValue: 'Create Token',
                        })}
                      </span>
                    </Button>
                  </CanMerchant>
                }
              />
            </div>
          ) : null}

          {/* Table */}
          {tokens.length ? (
            <TableContainer>
              <Table variant="compact">
                <thead>
                  <tr>
                    <TableHead>{t('NAME', { defaultValue: 'NAME' })}</TableHead>
                    <TableHead>{t('PROVIDER', { defaultValue: 'PROVIDER' })}</TableHead>
                    <TableHead>{t('TOKEN PREFIX', { defaultValue: 'TOKEN PREFIX' })}</TableHead>
                    <TableHead>{t('STATUS', { defaultValue: 'STATUS' })}</TableHead>
                    <TableHead>{t('CREATED', { defaultValue: 'CREATED' })}</TableHead>
                    <TableHead style={{ textAlign: 'end' }}>{t('ACTIONS', { defaultValue: 'ACTIONS' })}</TableHead>
                  </tr>
                </thead>
                <tbody>
                  {tokens.map((token: MerchantIntegrationToken) => (
                    <tr key={token.id}>
                      <TableCell style={{ fontWeight: 600, color: 'var(--text)' }}>
                        {token.name}
                      </TableCell>
                      <TableCell>
                        <span className="merchant-provider-badge">
                          {token.provider}
                        </span>
                      </TableCell>
                      <TableCell>
                        <code
                          style={{
                            fontFamily: 'monospace',
                            fontSize: '0.825rem',
                            color: '#cbd5e1',
                          }}
                        >
                          {token.token_prefix}
                        </code>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`merchant-status-badge--${
                            token.status === 'active'
                              ? 'active'
                              : token.status === 'revoked'
                              ? 'revoked'
                              : 'expired'
                          }`}
                        >
                          {token.status === 'active'
                            ? t('Active', { defaultValue: 'Active' })
                            : token.status === 'revoked'
                            ? t('Revoked', { defaultValue: 'Revoked' })
                            : t('Expired', { defaultValue: 'Expired' })}
                        </span>
                      </TableCell>
                      <TableCell style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                        {formatDate(token.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="merchant-token-actions" style={{ justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className="merchant-token-btn merchant-token-btn--outline"
                            onClick={() => setSelectedTokenId(token.id)}
                          >
                            {t('Details', { defaultValue: 'Details' })}
                          </button>

                          <CanMerchant capability="integrations.manage">
                            {token.status === 'active' ? (
                              <button
                                type="button"
                                className="merchant-token-btn merchant-token-btn--outline"
                                onClick={() => setTokenPendingRevoke(token)}
                              >
                                {t('Revoke', { defaultValue: 'Revoke' })}
                              </button>
                            ) : null}

                            <button
                              type="button"
                              className="merchant-token-btn merchant-token-btn--danger"
                              onClick={() => setTokenPendingDelete(token)}
                            >
                              {t('Delete', { defaultValue: 'Delete' })}
                            </button>
                          </CanMerchant>
                        </div>
                      </TableCell>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableContainer>
          ) : null}
        </div>
      </div>

      {/* Create Token Modal */}
      <MerchantCreateTokenModal
        open={isCreateOpen}
        onClose={handleCloseCreate}
        onCreated={(token) => {
          setCopied(false)
          setTokenCreated(token)
        }}
      />

      {/* Token Details Modal */}
      <MerchantTokenDetailsModal
        tokenId={selectedTokenId}
        onClose={() => setSelectedTokenId(null)}
      />

      {/* Revoke Confirmation Dialog */}
      <Dialog
        open={Boolean(tokenPendingRevoke)}
        onClose={() => setTokenPendingRevoke(null)}
        title={
          <CardTitle>
            {t('Revoke API Token?', { defaultValue: 'Revoke API Token?' })}
          </CardTitle>
        }
        variant="small"
      >
        <form onSubmit={handleRevokeSubmit} className="form-grid">
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            {t('Requests using this token will stop working immediately.', {
              defaultValue: 'Requests using this token will stop working immediately.',
            })}
          </p>

          {revokeMutation.isError ? (
            <ErrorState
              title={t('Failed to revoke token', {
                defaultValue: 'Failed to revoke token',
              })}
              message={getApiErrorMessage(revokeMutation.error)}
            />
          ) : null}

          <div className="form-group">
            <label htmlFor="revoke_notes" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
              {t('Reason for revoking (optional)', {
                defaultValue: 'Reason for revoking (optional)',
              })}
            </label>
            <Input
              id="revoke_notes"
              value={revokeNotes}
              onChange={(e) => setRevokeNotes(e.target.value)}
              placeholder={t('e.g. Secret rotation or decommissioned service', {
                defaultValue: 'e.g. Secret rotation or decommissioned service',
              })}
            />
          </div>

          <div className="form-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setTokenPendingRevoke(null)}
              disabled={revokeMutation.isPending}
            >
              {t('Cancel')}
            </Button>
            <Button
              type="submit"
              variant="danger"
              disabled={revokeMutation.isPending}
            >
              {revokeMutation.isPending
                ? t('Revoking...', { defaultValue: 'Revoking...' })
                : t('Revoke Token', { defaultValue: 'Revoke Token' })}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmActionModal
        open={Boolean(tokenPendingDelete)}
        title={t('Delete API Token?', { defaultValue: 'Delete API Token?' })}
        description={
          tokenPendingDelete
            ? t('Delete token "{{token}}"? This action cannot be undone.', {
                token: tokenPendingDelete.name,
                defaultValue: `Delete token "${tokenPendingDelete.name}"? This action cannot be undone.`,
              })
            : ''
        }
        confirmLabel={t('Delete Token', { defaultValue: 'Delete Token' })}
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
