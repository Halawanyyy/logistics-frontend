import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { createExport, downloadExport, listExports } from '../api/exports.api'
import type { CreateExportPayload, ExportLog, ExportLogFilters, ExportType } from '../types/exports.types'
import { getApiErrorMessage } from '../../../shared/api/api-error'
import { Can } from '../../../shared/auth/Can'
import { PERMISSIONS } from '../../../shared/auth/permission-keys'
import { ExportButton } from '../../../shared/components/export/ExportButton'
import { FieldError } from '../../../shared/components/forms/FieldError'
import {
  FilterButton,
  FilterPopover,
  FilterField,
  AppliedFilterChips,
  DateRangeFilter,
  type AppliedChip,
} from '../../../shared/components/filters'
import { DriverSelector } from '../../../shared/components/selectors/DriverSelector'
import { MerchantSelector } from '../../../shared/components/selectors/MerchantSelector'
import { EmptyState } from '../../../shared/components/states/EmptyState'
import { ErrorState } from '../../../shared/components/states/ErrorState'
import { LoadingState } from '../../../shared/components/states/LoadingState'
import { Button } from '../../../shared/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/Card'
import { Dialog } from '../../../shared/components/ui/Dialog'
import { PageHeader } from '../../../shared/components/ui/PageHeader'
import { Select } from '../../../shared/components/ui/Select'
import { StatusBadge } from '../../../shared/components/ui/StatusBadge'
import { Table, TableCell, TableContainer, TableHead } from '../../../shared/components/ui/Table'
import { useFormApiErrors } from '../../../shared/hooks/useFormApiErrors'
import { adminPath } from '../../../shared/routing/paths'
import { formatDate } from '../../../shared/utils/formatters'

type ExportFiltersState = {
  export_type: string
  format: string
  status: string
  date_from: string
  date_to: string
  per_page: string
}

type GenerateExportFormValues = {
  type: ExportType
  format: 'csv'
  date_from: string
  date_to: string
  merchant_id: string
  driver_id: string
  status: string
}

const initialFilters: ExportFiltersState = {
  export_type: '',
  format: '',
  status: '',
  date_from: '',
  date_to: '',
  per_page: '50',
}

const exportTypes: ExportType[] = [
  'orders',
  'shipments',
  'driver_manifests',
  'merchant_wallet_transactions',
  'finance_reports',
  'warehouse_inventory',
  'treasury_transactions',
  'audit_logs',
  'company_catalog_items',
]

const EXPORT_TYPE_LABEL_MAP: Record<string, string> = {
  orders: 'Orders',
  shipments: 'Shipments',
  driver_manifests: 'Driver Manifests',
  merchant_wallet_transactions: 'Merchant Wallet Transactions',
  finance_reports: 'Finance Reports',
  warehouse_inventory: 'Warehouse Inventory',
  treasury_transactions: 'Treasury Transactions',
  audit_logs: 'Audit Logs',
  company_catalog_items: 'Company Catalog Items',
}

function getExportTypeLabel(type: string | null | undefined, t: any) {
  if (!type) return '-'
  const mapped = EXPORT_TYPE_LABEL_MAP[type]
  return mapped ? t(mapped, { defaultValue: mapped }) : type
}

function triggerBlobDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

function GenerateExportDialog({
  error,
  isSubmitting,
  onClose,
  onSubmit,
  open,
}: {
  error?: unknown
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (values: GenerateExportFormValues) => void
  open: boolean
}) {
  const { t } = useTranslation()
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<GenerateExportFormValues>({
    defaultValues: {
      type: 'orders',
      format: 'csv',
      date_from: '',
      date_to: '',
      merchant_id: '',
      driver_id: '',
      status: '',
    },
  })
  const { formError, getFieldError } = useFormApiErrors(error)

  return (
    <Dialog open={open} onClose={onClose} title={<CardTitle>{t('Generate Export')}</CardTitle>}>
      <form className="form-grid" onSubmit={handleSubmit(onSubmit)}>
        <label className="field">
          <span>{t('Export Type')}</span>
          <Select {...register('type')}>
            {exportTypes.map((type) => (
              <option key={type} value={type}>{getExportTypeLabel(type, t)}</option>
            ))}
          </Select>
        </label>
        <label className="field">
          <span>{t('Format')}</span>
          <Select {...register('format')}>
            <option value="csv">csv</option>
          </Select>
        </label>
        <DateRangeFilter
          dateFrom={watch('date_from')}
          dateTo={watch('date_to')}
          onChange={({ date_from, date_to }) => {
            setValue('date_from', date_from)
            setValue('date_to', date_to)
          }}
        />
        <label className="field">
          <span>{t('Merchant')}</span>
          <MerchantSelector
            value={watch('merchant_id')}
            includeAllOption
            onChange={(merchant_id) => setValue('merchant_id', merchant_id)}
          />
        </label>
        <label className="field">
          <span>{t('Driver')}</span>
          <DriverSelector
            value={watch('driver_id')}
            includeAllOption
            onChange={(driver_id) => setValue('driver_id', driver_id)}
          />
        </label>
        <label className="field">
          <span>{t('Status')}</span>
          <Select {...register('status')}>
            <option value="">{t('All statuses')}</option>
            <option value="pending">{t('pending', { defaultValue: 'pending' })}</option>
            <option value="approved">{t('approved', { defaultValue: 'approved' })}</option>
            <option value="completed">{t('completed', { defaultValue: 'completed' })}</option>
            <option value="failed">{t('failed', { defaultValue: 'failed' })}</option>
          </Select>
          <FieldError error={errors.status?.message ?? getFieldError('status')} />
        </label>
        {formError ? <div className="form-error">{formError}</div> : null}
        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t('Cancel')}
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {t('Generate Export')}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

export function ExportsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [appliedFilters, setAppliedFilters] = useState<ExportFiltersState>(initialFilters)
  const [draftFilters, setDraftFilters] = useState<ExportFiltersState>(initialFilters)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filterError, setFilterError] = useState('')
  const [generateOpen, setGenerateOpen] = useState(false)
  const [downloadingExportId, setDownloadingExportId] = useState<number | null>(null)
  const params: ExportLogFilters = useMemo(
    () => ({
      ...(appliedFilters.export_type ? { export_type: appliedFilters.export_type } : {}),
      ...(appliedFilters.format ? { format: appliedFilters.format } : {}),
      ...(appliedFilters.status ? { status: appliedFilters.status } : {}),
      ...(appliedFilters.date_from ? { date_from: appliedFilters.date_from } : {}),
      ...(appliedFilters.date_to ? { date_to: appliedFilters.date_to } : {}),
      ...(appliedFilters.per_page ? { per_page: appliedFilters.per_page } : {}),
    }),
    [appliedFilters],
  )
  const exportsQuery = useQuery({
    queryKey: ['exports', params],
    queryFn: () => listExports(params),
  })
  const generateMutation = useMutation({
    mutationFn: (values: GenerateExportFormValues) => {
      const payload: CreateExportPayload = {
        format: values.format,
        filters: {
          ...(values.date_from ? { date_from: values.date_from } : {}),
          ...(values.date_to ? { date_to: values.date_to } : {}),
          ...(values.merchant_id ? { merchant_id: values.merchant_id } : {}),
          ...(values.driver_id ? { driver_id: values.driver_id } : {}),
          ...(values.status ? { status: values.status } : {}),
        },
      }
      return createExport(values.type, payload)
    },
    onSuccess: async () => {
      setGenerateOpen(false)
      await queryClient.invalidateQueries({ queryKey: ['exports'] })
    },
  })
  const downloadMutation = useMutation({
    mutationFn: ({ id, exportType }: { id: number; exportType: string }) =>
      downloadExport(id).then((blob) => ({ blob, exportType })),
    onSuccess: ({ blob, exportType }) => {
      triggerBlobDownload(blob, `${exportType}-export.csv`)
    },
    onSettled: () => {
      setDownloadingExportId(null)
    },
  })
  const exportLogs = exportsQuery.data?.data ?? []

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (appliedFilters.export_type) count += 1
    if (appliedFilters.format) count += 1
    if (appliedFilters.status) count += 1
    if (appliedFilters.date_from || appliedFilters.date_to) count += 1
    if (appliedFilters.per_page && appliedFilters.per_page !== '50') count += 1
    return count
  }, [appliedFilters])

  const handleOpenChange = (open: boolean) => {
    setFiltersOpen(open)
    if (open) {
      setDraftFilters(appliedFilters)
      setFilterError('')
    }
  }

  const handleApply = () => {
    if (draftFilters.date_from && draftFilters.date_to && draftFilters.date_from > draftFilters.date_to) {
      setFilterError(t('Date From must not be later than Date To.', { defaultValue: 'Date From must not be later than Date To.' }))
      return
    }
    setFilterError('')
    setAppliedFilters(draftFilters)
    setFiltersOpen(false)
  }

  const handleReset = () => {
    setDraftFilters(initialFilters)
    setAppliedFilters(initialFilters)
    setFilterError('')
    setFiltersOpen(false)
  }

  const appliedChips = useMemo<AppliedChip[]>(() => {
    const chips: AppliedChip[] = []
    if (appliedFilters.export_type) {
      chips.push({
        id: 'export_type',
        label: t('Export Type'),
        value: getExportTypeLabel(appliedFilters.export_type, t),
      })
    }
    if (appliedFilters.format) {
      chips.push({
        id: 'format',
        label: t('Format'),
        value: appliedFilters.format,
      })
    }
    if (appliedFilters.status) {
      chips.push({
        id: 'status',
        label: t('Status'),
        value: appliedFilters.status,
      })
    }
    if (appliedFilters.date_from || appliedFilters.date_to) {
      chips.push({
        id: 'date_range',
        label: t('Date'),
        value: `${appliedFilters.date_from || ''} → ${appliedFilters.date_to || ''}`,
      })
    }
    if (appliedFilters.per_page && appliedFilters.per_page !== '50') {
      chips.push({
        id: 'per_page',
        label: t('Per Page'),
        value: appliedFilters.per_page,
      })
    }
    return chips
  }, [appliedFilters, t])

  const handleRemoveChip = (chipId: string) => {
    if (chipId === 'date_range') {
      setAppliedFilters((c) => ({ ...c, date_from: '', date_to: '' }))
    } else if (chipId === 'per_page') {
      setAppliedFilters((c) => ({ ...c, per_page: '50' }))
    } else {
      setAppliedFilters((c) => ({ ...c, [chipId]: '' }))
    }
  }

  const handleClearAllChips = () => {
    setAppliedFilters(initialFilters)
  }

  return (
    <section className="page-section page-layout--fullwidth">
      <PageHeader
        title={t('Exports')}
        description={t('Asynchronous-ready export history and CSV generation.', {
          defaultValue: 'Asynchronous-ready export history and CSV generation.',
        })}
        actions={(
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <FilterPopover
              title={t('Export filters', { defaultValue: 'Export filters' })}
              activeCount={activeFilterCount}
              open={filtersOpen}
              onOpenChange={handleOpenChange}
              onApply={handleApply}
              onReset={handleReset}
              trigger={<FilterButton activeCount={activeFilterCount} />}
            >
              <FilterField label={t('Export Type')}>
                <Select
                  value={draftFilters.export_type}
                  onChange={(event) => setDraftFilters((current) => ({ ...current, export_type: event.target.value }))}
                >
                  <option value="">{t('All types')}</option>
                  {exportTypes.map((type) => (
                    <option key={type} value={type}>{getExportTypeLabel(type, t)}</option>
                  ))}
                </Select>
              </FilterField>
              <FilterField label={t('Format')}>
                <Select
                  value={draftFilters.format}
                  onChange={(event) => setDraftFilters((current) => ({ ...current, format: event.target.value }))}
                >
                  <option value="">{t('All formats')}</option>
                  <option value="csv">csv</option>
                </Select>
              </FilterField>
              <FilterField label={t('Status')}>
                <Select
                  value={draftFilters.status}
                  onChange={(event) => setDraftFilters((current) => ({ ...current, status: event.target.value }))}
                >
                  <option value="">{t('All statuses')}</option>
                  <option value="pending">{t('pending', { defaultValue: 'pending' })}</option>
                  <option value="processing">{t('processing', { defaultValue: 'processing' })}</option>
                  <option value="completed">{t('completed', { defaultValue: 'completed' })}</option>
                  <option value="failed">{t('failed', { defaultValue: 'failed' })}</option>
                </Select>
              </FilterField>
              <DateRangeFilter
                dateFrom={draftFilters.date_from}
                dateTo={draftFilters.date_to}
                onChange={({ date_from, date_to }) => setDraftFilters((current) => ({ ...current, date_from, date_to }))}
                error={filterError}
              />
              <FilterField label={t('Per Page')}>
                <Select
                  value={draftFilters.per_page}
                  onChange={(event) => setDraftFilters((current) => ({ ...current, per_page: event.target.value }))}
                >
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </Select>
              </FilterField>
            </FilterPopover>

            <Can permission={PERMISSIONS.EXPORTS_CREATE}>
              <ExportButton onExport={() => setGenerateOpen(true)} />
            </Can>
          </div>
        )}
      />

      <AppliedFilterChips
        chips={appliedChips}
        onRemove={handleRemoveChip}
        onClearAll={handleClearAllChips}
      />
      <Card className="table-card">
        <CardHeader>
          <CardTitle>{t('Export History')}</CardTitle>
          <CardDescription>{t('Generated admin exports and current processing status.')}</CardDescription>
        </CardHeader>
        <CardContent>
          {exportsQuery.isLoading ? <LoadingState title={t('Loading export history')} /> : null}
          {exportsQuery.isError ? (
            <ErrorState
              title={t('Unable to load export history', { defaultValue: 'Unable to load export history' })}
              message={getApiErrorMessage(exportsQuery.error)}
              onRetry={() => void exportsQuery.refetch()}
            />
          ) : null}
          {!exportsQuery.isLoading && !exportsQuery.isError && !exportLogs.length ? (
            <EmptyState
              title={t('No exports found', { defaultValue: 'No exports found' })}
              description={t('No export logs matched the selected filters.', {
                defaultValue: 'No export logs matched the selected filters.',
              })}
            />
          ) : null}
          {exportLogs.length ? (
            <TableContainer>
              <Table variant="compact">
                <thead>
                  <tr>
                    <TableHead>{t('Type')}</TableHead>
                    <TableHead>{t('Format')}</TableHead>
                    <TableHead>{t('Filters')}</TableHead>
                    <TableHead>{t('Status')}</TableHead>
                    <TableHead>{t('Generated By')}</TableHead>
                    <TableHead>{t('Generated At')}</TableHead>
                    <TableHead>{t('Actions')}</TableHead>
                  </tr>
                </thead>
                <tbody>
                  {exportLogs.map((exportLog: ExportLog) => (
                    <tr key={exportLog.id}>
                      <TableCell>
                        <Link className="table-link" to={adminPath(`/exports/${exportLog.id}`)}>
                          {getExportTypeLabel(String(exportLog.export_type), t)}
                        </Link>
                      </TableCell>
                      <TableCell>{exportLog.format}</TableCell>
                      <TableCell>
                        <pre className="table-meta">
                          {JSON.stringify(exportLog.filters ?? {}, null, 2)}
                        </pre>
                      </TableCell>
                      <TableCell><StatusBadge value={exportLog.status} /></TableCell>
                      <TableCell>{exportLog.generated_by_name ?? '-'}</TableCell>
                      <TableCell>{exportLog.generated_at ? formatDate(exportLog.generated_at) : '-'}</TableCell>
                      <TableCell>
                        <div className="page-header__button-row">
                          <Can permission={PERMISSIONS.EXPORTS_VIEW}>
                            <Link className="table-link" to={adminPath(`/exports/${exportLog.id}`)}>
                              {t('View Details')}
                            </Link>
                          </Can>
                          <Can permission={PERMISSIONS.EXPORTS_DOWNLOAD}>
                            <Button
                              type="button"
                              variant="secondary"
                              disabled={exportLog.status !== 'completed' || !exportLog.download_url}
                              loading={downloadingExportId === exportLog.id && downloadMutation.isPending}
                              onClick={() => {
                                setDownloadingExportId(exportLog.id)
                                downloadMutation.mutate({
                                  id: exportLog.id,
                                  exportType: String(exportLog.export_type),
                                })
                              }}
                            >
                              {t('Download')}
                            </Button>
                          </Can>
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

      <GenerateExportDialog
        error={generateMutation.error}
        isSubmitting={generateMutation.isPending}
        onClose={() => setGenerateOpen(false)}
        onSubmit={(values) => generateMutation.mutate(values)}
        open={generateOpen}
      />
    </section>
  )
}
