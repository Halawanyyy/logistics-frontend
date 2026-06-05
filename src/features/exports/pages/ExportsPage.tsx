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
import { DateRangeFilter } from '../../../shared/components/filters/DateRangeFilter'
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
]

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
              <option key={type} value={type}>{type}</option>
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
            <option value="">All statuses</option>
            <option value="pending">pending</option>
            <option value="approved">approved</option>
            <option value="completed">completed</option>
            <option value="failed">failed</option>
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
  const [filters, setFilters] = useState<ExportFiltersState>(initialFilters)
  const [generateOpen, setGenerateOpen] = useState(false)
  const params: ExportLogFilters = useMemo(
    () => ({
      ...(filters.export_type ? { export_type: filters.export_type } : {}),
      ...(filters.format ? { format: filters.format } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.date_from ? { date_from: filters.date_from } : {}),
      ...(filters.date_to ? { date_to: filters.date_to } : {}),
      ...(filters.per_page ? { per_page: filters.per_page } : {}),
    }),
    [filters],
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
  })
  const exportLogs = exportsQuery.data?.data ?? []

  return (
    <section className="page-section">
      <PageHeader
        title="Exports"
        description="Asynchronous-ready export history and CSV generation."
        actions={(
          <Can permission={PERMISSIONS.EXPORTS_CREATE}>
            <ExportButton onExport={() => setGenerateOpen(true)} />
          </Can>
        )}
      />

      <Card variant="flat" className="dashboard-filter-card">
        <CardContent className="dashboard-filters">
          <label className="field">
            <span>{t('Export Type')}</span>
            <Select
              value={filters.export_type}
              onChange={(event) => setFilters((current) => ({ ...current, export_type: event.target.value }))}
            >
              <option value="">{t('All types')}</option>
              {exportTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </Select>
          </label>
          <label className="field">
            <span>{t('Format')}</span>
            <Select
              value={filters.format}
              onChange={(event) => setFilters((current) => ({ ...current, format: event.target.value }))}
            >
              <option value="">{t('All formats')}</option>
              <option value="csv">csv</option>
            </Select>
          </label>
          <label className="field">
            <span>{t('Status')}</span>
            <Select
              value={filters.status}
              onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
            >
              <option value="">All statuses</option>
              <option value="pending">pending</option>
              <option value="processing">processing</option>
              <option value="completed">completed</option>
              <option value="failed">failed</option>
            </Select>
          </label>
          <DateRangeFilter
            dateFrom={filters.date_from}
            dateTo={filters.date_to}
            onChange={({ date_from, date_to }) => setFilters((current) => ({ ...current, date_from, date_to }))}
          />
          <label className="field">
            <span>{t('Per Page')}</span>
            <Select
              value={filters.per_page}
              onChange={(event) => setFilters((current) => ({ ...current, per_page: event.target.value }))}
            >
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </Select>
          </label>
        </CardContent>
        <CardContent>
          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => setFilters(initialFilters)}>
              {t('Reset filters')}
            </Button>
            <Button type="button" variant="secondary" onClick={() => void exportsQuery.refetch()}>
              {t('Refresh')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="table-card">
        <CardHeader>
          <CardTitle>{t('Export History')}</CardTitle>
          <CardDescription>{t('Generated admin exports and current processing status.')}</CardDescription>
        </CardHeader>
        <CardContent>
          {exportsQuery.isLoading ? <LoadingState title={t('Loading export history')} /> : null}
          {exportsQuery.isError ? (
            <ErrorState
              title="Unable to load export history"
              message={getApiErrorMessage(exportsQuery.error)}
              onRetry={() => void exportsQuery.refetch()}
            />
          ) : null}
          {!exportsQuery.isLoading && !exportsQuery.isError && !exportLogs.length ? (
            <EmptyState
              title="No exports found"
              description="No export logs matched the selected filters."
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
                          {exportLog.export_type}
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
                              loading={downloadMutation.isPending}
                              onClick={() => downloadMutation.mutate({
                                id: exportLog.id,
                                exportType: String(exportLog.export_type),
                              })}
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
