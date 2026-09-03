import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { createMerchantPortalExport, listMerchantPortalExportTypes } from '../api/merchantPortalExports.api'
import type { CreateMerchantExportPayload, MerchantExportType } from '../types/merchantPortalExports.types'
import { merchantPath } from '../../../../shared/routing/paths'
import { Button } from '../../../../shared/components/ui/Button'
import { PageHeader } from '../../../../shared/components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../shared/components/ui/Card'
import { Select } from '../../../../shared/components/ui/Select'
import { Input } from '../../../../shared/components/ui/Input'
import { FieldError } from '../../../../shared/components/forms/FieldError'
import { getApiErrorMessage } from '../../../../shared/api/api-error'

export function MerchantExportCreatePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [type, setType] = useState<MerchantExportType>('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const typesQuery = useQuery({
    queryKey: ['merchant-portal', 'export-types'],
    queryFn: listMerchantPortalExportTypes,
  })

  const createMutation = useMutation({
    mutationFn: (payload: CreateMerchantExportPayload) => createMerchantPortalExport(payload),
    onSuccess: (data) => {
      navigate(merchantPath(`/exports/${data.data.id}`))
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!type) return

    createMutation.mutate({
      type,
      format: 'csv',
      filters: {
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        status: statusFilter || undefined,
      },
    })
  }

  // Handle various response shapes for export types
  let availableTypes: { id: string; name: string }[] = []
  if (typesQuery.data?.data) {
    const rawData = typesQuery.data.data
    if (Array.isArray(rawData)) {
      if (typeof rawData[0] === 'string') {
        availableTypes = (rawData as string[]).map(t => ({ id: t, name: t }))
      } else {
        availableTypes = rawData as { id: string; name: string }[]
      }
    }
  }

  return (
    <div className="page-stack">
      <PageHeader
        title={t('Create Export', { defaultValue: 'Create Export' })}
        description={t('Request a new data export from your account.', { defaultValue: 'Request a new data export from your account.' })}
      />

      <Card>
        <CardHeader>
          <CardTitle>{t('Export Configuration', { defaultValue: 'Export Configuration' })}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="form-grid max-w-2xl">
            {createMutation.isError ? (
              <FieldError error={getApiErrorMessage(createMutation.error)} />
            ) : null}

            <div className="form-group">
              <label htmlFor="export_type">{t('Export Type', { defaultValue: 'Export Type' })} *</label>
              <Select
                id="export_type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                required
              >
                <option value="">{t('Select an option', { defaultValue: 'Select an option' })}</option>
                {availableTypes.map((tItem) => (
                  <option key={tItem.id} value={tItem.id}>
                    {t(tItem.name, { defaultValue: tItem.name })}
                  </option>
                ))}
              </Select>
            </div>

            <div className="form-group">
              <label htmlFor="date_from">{t('Date From (Optional)', { defaultValue: 'Date From (Optional)' })}</label>
              <Input
                id="date_from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="date_to">{t('Date To (Optional)', { defaultValue: 'Date To (Optional)' })}</label>
              <Input
                id="date_to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="status_filter">{t('Status Filter (Optional)', { defaultValue: 'Status Filter (Optional)' })}</label>
              <Input
                id="status_filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                placeholder={t('e.g. pending, delivered', { defaultValue: 'e.g. pending, delivered' })}
              />
            </div>

            <div className="form-actions">
              <Button type="submit" variant="primary" disabled={createMutation.isPending || !type}>
                {createMutation.isPending ? t('Creating...', { defaultValue: 'Creating...' }) : t('Create Export', { defaultValue: 'Create Export' })}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
