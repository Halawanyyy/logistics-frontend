import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Dialog } from '../../../../../shared/components/ui/Dialog'
import { Button } from '../../../../../shared/components/ui/Button'
import { Input } from '../../../../../shared/components/ui/Input'
import { Select } from '../../../../../shared/components/ui/Select'
import { CardTitle } from '../../../../../shared/components/ui/Card'
import { createMerchantIntegrationToken } from '../../api/merchantPortalIntegrations.api'
import type {
  CreateMerchantIntegrationTokenPayload,
  MerchantIntegrationToken,
} from '../../types/merchantPortalIntegrations.types'
import { getApiErrorMessage } from '../../../../../shared/api/api-error'
import { ErrorState } from '../../../../../shared/components/states/ErrorState'

type MerchantCreateTokenModalProps = {
  open: boolean
  onClose: () => void
  onCreated: (token: MerchantIntegrationToken) => void
}

const AVAILABLE_ABILITIES = [
  { id: 'integrations.me', label: 'Check connection (integrations.me)' },
  { id: 'orders.create', label: 'Create delivery orders (orders.create)' },
  { id: 'orders.view', label: 'View orders (orders.view)' },
  { id: 'shipments.view', label: 'View shipments (shipments.view)' },
  { id: 'tracking.view', label: 'Query tracking (tracking.view)' },
]

export function MerchantCreateTokenModal({
  open,
  onClose,
  onCreated,
}: MerchantCreateTokenModalProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const [name, setName] = useState('')
  const [provider, setProvider] = useState('woocommerce')
  const [expiresAt, setExpiresAt] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedAbilities, setSelectedAbilities] = useState<string[]>([
    'integrations.me',
    'orders.create',
    'orders.view',
    'shipments.view',
    'tracking.view',
  ])

  const createMutation = useMutation({
    mutationFn: (payload: CreateMerchantIntegrationTokenPayload) =>
      createMerchantIntegrationToken(payload),
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({
        queryKey: ['merchant-portal', 'integration-tokens'],
      })
      setName('')
      setProvider('woocommerce')
      setExpiresAt('')
      setNotes('')
      setSelectedAbilities([
        'integrations.me',
        'orders.create',
        'orders.view',
        'shipments.view',
        'tracking.view',
      ])
      onCreated(response.data)
      onClose()
    },
  })

  function handleToggleAbility(abilityId: string) {
    setSelectedAbilities((prev) =>
      prev.includes(abilityId)
        ? prev.filter((id) => id !== abilityId)
        : [...prev, abilityId]
    )
  }

  function handleSelectAllAbilities() {
    setSelectedAbilities(AVAILABLE_ABILITIES.map((a) => a.id))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    createMutation.mutate({
      name: name.trim(),
      provider,
      notes: notes.trim() || null,
      expires_at: expiresAt || null,
      abilities: selectedAbilities.length > 0 ? selectedAbilities : undefined,
      permissions: selectedAbilities.length > 0 ? selectedAbilities : undefined,
    })
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={
        <CardTitle>
          {t('Create Integration Token', {
            defaultValue: 'Create Integration Token',
          })}
        </CardTitle>
      }
    >
      {createMutation.isError ? (
        <div style={{ marginBottom: '1rem' }}>
          <ErrorState
            title={t('Failed to create token', {
              defaultValue: 'Failed to create token',
            })}
            message={getApiErrorMessage(createMutation.error)}
          />
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="form-grid">
        {/* Token Name */}
        <div className="form-group">
          <label htmlFor="token_name" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
            {t('Token Name', { defaultValue: 'Token Name' })}{' '}
            <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <Input
            id="token_name"
            placeholder={t('e.g. WooCommerce Production', {
              defaultValue: 'e.g. WooCommerce Production',
            })}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
        </div>

        {/* Provider */}
        <div className="form-group">
          <label htmlFor="token_provider" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
            {t('Provider', { defaultValue: 'Provider' })}
          </label>
          <Select
            id="token_provider"
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
          >
            <option value="woocommerce">woocommerce</option>
            <option value="shopify">shopify</option>
            <option value="custom">custom</option>
          </Select>
        </div>

        {/* Capabilities / Abilities */}
        <div className="form-group">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.4rem',
            }}
          >
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>
              {t('Token Abilities', { defaultValue: 'Token Abilities' })}
            </label>
            <button
              type="button"
              onClick={handleSelectAllAbilities}
              style={{
                background: 'none',
                border: 'none',
                color: '#38bdf8',
                fontSize: '0.75rem',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              {t('Select all', { defaultValue: 'Select all' })}
            </button>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
              padding: '0.75rem',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border)',
              borderRadius: '0.5rem',
            }}
          >
            {AVAILABLE_ABILITIES.map((ability) => (
              <label
                key={ability.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.825rem',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedAbilities.includes(ability.id)}
                  onChange={() => handleToggleAbility(ability.id)}
                />
                <span>{ability.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Expiration Date */}
        <div className="form-group">
          <label htmlFor="token_expires" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
            {t('Expires At (Optional)', { defaultValue: 'Expires At (Optional)' })}
          </label>
          <Input
            id="token_expires"
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
          />
        </div>

        {/* Notes */}
        <div className="form-group">
          <label htmlFor="token_notes" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
            {t('Notes (Optional)', { defaultValue: 'Notes (Optional)' })}
          </label>
          <Input
            id="token_notes"
            placeholder={t('e.g. Used for store sync service', {
              defaultValue: 'e.g. Used for store sync service',
            })}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Modal Actions */}
        <div className="form-actions" style={{ marginTop: '0.5rem' }}>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={createMutation.isPending}
          >
            {t('Cancel')}
          </Button>
          <Button
            type="submit"
            className="merchant-integrations-btn--create"
            disabled={createMutation.isPending || !name.trim()}
          >
            {createMutation.isPending
              ? t('Creating...', { defaultValue: 'Creating...' })
              : t('+ Create Token', { defaultValue: '+ Create Token' })}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
