import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Dialog } from '../../../../shared/components/ui/Dialog'
import { Button } from '../../../../shared/components/ui/Button'
import { Input } from '../../../../shared/components/ui/Input'
import { CardTitle } from '../../../../shared/components/ui/Card'
import { createMerchantIntegrationToken } from '../api/merchantPortalIntegrations.api'
import type { CreateMerchantIntegrationTokenPayload, MerchantIntegrationToken } from '../types/merchantPortalIntegrations.types'
import { getApiErrorMessage } from '../../../../shared/api/api-error'
import { ErrorState } from '../../../../shared/components/states/ErrorState'

type MerchantCreateTokenModalProps = {
  open: boolean
  onClose: () => void
  onCreated: (token: MerchantIntegrationToken) => void
}

export function MerchantCreateTokenModal({ open, onClose, onCreated }: MerchantCreateTokenModalProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [provider, setProvider] = useState('')
  const [notes, setNotes] = useState('')
  
  const createMutation = useMutation({
    mutationFn: (payload: CreateMerchantIntegrationTokenPayload) => createMerchantIntegrationToken(payload),
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({ queryKey: ['merchant-portal', 'integration-tokens'] })
      setName('')
      setProvider('')
      setNotes('')
      onCreated(response.data)
      onClose()
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    createMutation.mutate({ name, provider, notes: notes || null })
  }

  return (
    <Dialog open={open} onClose={onClose} title={<CardTitle>{t('Create API Token', { defaultValue: 'Create API Token' })}</CardTitle>}>
      {createMutation.isError ? (
        <ErrorState
          title={t('Failed to create token')}
          message={getApiErrorMessage(createMutation.error)}
          className="mb-4"
        />
      ) : null}
      <form onSubmit={handleSubmit} className="form-grid">
        <div className="form-group">
          <label htmlFor="token_name">{t('Token Name', { defaultValue: 'Token Name' })} *</label>
          <Input
            id="token_name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder={t('e.g., WooCommerce Main Store')}
          />
        </div>
        <div className="form-group">
          <label htmlFor="token_provider">{t('Provider', { defaultValue: 'Provider' })}</label>
          <Input
            id="token_provider"
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            placeholder={t('e.g., woocommerce, custom')}
          />
        </div>
        <div className="form-group">
          <label htmlFor="token_notes">{t('Notes', { defaultValue: 'Notes' })}</label>
          <Input
            id="token_notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={onClose} disabled={createMutation.isPending}>
            {t('Cancel')}
          </Button>
          <Button type="submit" disabled={createMutation.isPending || !name}>
            {createMutation.isPending ? t('Creating...') : t('Create Token', { defaultValue: 'Create Token' })}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
