import { useMutation, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { downloadExport, getExport } from '../api/exports.api'
import { getApiErrorMessage, isApiNotFound } from '../../../shared/api/api-error'
import { Can } from '../../../shared/auth/Can'
import { PERMISSIONS } from '../../../shared/auth/permission-keys'
import { EmptyState } from '../../../shared/components/states/EmptyState'
import { ErrorState } from '../../../shared/components/states/ErrorState'
import { LoadingState } from '../../../shared/components/states/LoadingState'
import { NotFoundState } from '../../../shared/components/states/NotFoundState'
import { Button } from '../../../shared/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../shared/components/ui/Card'
import { PageHeader } from '../../../shared/components/ui/PageHeader'
import { StatusBadge } from '../../../shared/components/ui/StatusBadge'
import { adminPath } from '../../../shared/routing/paths'
import { formatDate } from '../../../shared/utils/formatters'

function triggerBlobDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

export function ExportLogDetailsPage() {
  const { t } = useTranslation()
  const { exportLogId } = useParams()
  const exportQuery = useQuery({
    queryKey: ['exports', exportLogId, 'detail'],
    queryFn: () => getExport(exportLogId!),
    enabled: Boolean(exportLogId),
  })
  const downloadMutation = useMutation({
    mutationFn: () => downloadExport(exportLogId!),
    onSuccess: (blob) => {
      const exportLog = exportQuery.data?.data
      const fallbackFileName = exportLog
        ? `${String(exportLog.export_type)}-export.${exportLog.format || 'csv'}`
        : 'export.csv'
      triggerBlobDownload(blob, exportLog?.file_name ?? fallbackFileName)
    },
  })

  if (exportQuery.isLoading) {
    return <LoadingState title={t('Loading export details', { defaultValue: 'Loading export details' })} />
  }

  if (exportQuery.isError && isApiNotFound(exportQuery.error)) {
    return (
      <NotFoundState
        title={t('Export log not found', { defaultValue: 'Export log not found' })}
        description={t('This export log could not be found.', { defaultValue: 'This export log could not be found.' })}
        action={(
          <Link className="ui-link-reset" to={adminPath('/exports')}>
            <Button variant="secondary">{t('Back to export history', { defaultValue: 'Back to export history' })}</Button>
          </Link>
        )}
      />
    )
  }

  if (exportQuery.isError || !exportQuery.data) {
    return (
      <ErrorState
        title={t('Unable to load export details', { defaultValue: 'Unable to load export details' })}
        message={getApiErrorMessage(exportQuery.error)}
        onRetry={() => void exportQuery.refetch()}
      />
    )
  }

  const exportLog = exportQuery.data.data
  const hasFilters = Boolean(exportLog.filters && Object.keys(exportLog.filters).length)
  const hasMetadata = Boolean(exportLog.metadata && Object.keys(exportLog.metadata).length)
  const canDownload = exportLog.status === 'completed' && Boolean(exportLog.download_url)

  return (
    <section className="page-section">
      <PageHeader
        title={t('Export Log Details', { defaultValue: 'Export Log Details' })}
        description={`${exportLog.export_type} #${exportLog.id}`}
        actions={(
          <div className="page-header__button-row">
            <Can permission={PERMISSIONS.EXPORTS_DOWNLOAD}>
              <Button
                type="button"
                variant="secondary"
                disabled={!canDownload}
                loading={downloadMutation.isPending}
                onClick={() => downloadMutation.mutate()}
              >
                {t('Download')}
              </Button>
            </Can>
            <Link className="ui-link-reset" to={adminPath('/exports')}>
              <Button variant="secondary">{t('Back to export history', { defaultValue: 'Back to export history' })}</Button>
            </Link>
          </div>
        )}
      />

      {downloadMutation.error ? <div className="form-error">{getApiErrorMessage(downloadMutation.error)}</div> : null}

      <Card>
        <CardHeader>
          <CardTitle>{t('Export Summary', { defaultValue: 'Export Summary' })}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="detail-list">
            <div>
              <dt>{t('Export ID', { defaultValue: 'Export ID' })}</dt>
              <dd>{exportLog.id}</dd>
            </div>
            <div>
              <dt>{t('Type')}</dt>
              <dd>{exportLog.export_type}</dd>
            </div>
            <div>
              <dt>{t('Format')}</dt>
              <dd>{exportLog.format}</dd>
            </div>
            <div>
              <dt>{t('Status')}</dt>
              <dd><StatusBadge value={exportLog.status} /></dd>
            </div>
            <div>
              <dt>{t('Created By')}</dt>
              <dd>{exportLog.created_by_name ?? exportLog.generated_by_name ?? '-'}</dd>
            </div>
            <div>
              <dt>{t('Created At')}</dt>
              <dd>{formatDate(exportLog.created_at)}</dd>
            </div>
            <div>
              <dt>{t('Generated At')}</dt>
              <dd>{exportLog.generated_at ? formatDate(exportLog.generated_at) : '-'}</dd>
            </div>
            <div>
              <dt>{t('Completed At', { defaultValue: 'Completed At' })}</dt>
              <dd>{exportLog.completed_at ? formatDate(exportLog.completed_at) : '-'}</dd>
            </div>
            <div>
              <dt>{t('Failed At', { defaultValue: 'Failed At' })}</dt>
              <dd>{exportLog.failed_at ? formatDate(exportLog.failed_at) : '-'}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('File Info', { defaultValue: 'File Info' })}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="detail-list">
            <div>
              <dt>{t('File', { defaultValue: 'File' })}</dt>
              <dd>{exportLog.file_name ?? exportLog.file_path ?? '-'}</dd>
            </div>
            <div>
              <dt>{t('Download Available', { defaultValue: 'Download Available' })}</dt>
              <dd>{canDownload ? t('Available', { defaultValue: 'Available' }) : t('Not available', { defaultValue: 'Not available' })}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {exportLog.error_message ? (
        <Card className="feedback-card feedback-card--error">
          <CardHeader>
            <CardTitle>{t('Error Message', { defaultValue: 'Error Message' })}</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{exportLog.error_message}</p>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{t('Filters Used', { defaultValue: 'Filters Used' })}</CardTitle>
        </CardHeader>
        <CardContent>
          {hasFilters ? (
            <pre className="table-meta">{JSON.stringify(exportLog.filters, null, 2)}</pre>
          ) : (
            <EmptyState
              title={t('Filters', { defaultValue: 'Filters' })}
              description={t('No filters were recorded for this export.', { defaultValue: 'No filters were recorded for this export.' })}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('Metadata')}</CardTitle>
        </CardHeader>
        <CardContent>
          {hasMetadata ? (
            <pre className="table-meta">{JSON.stringify(exportLog.metadata, null, 2)}</pre>
          ) : (
            <EmptyState
              title={t('Metadata')}
              description={t('No metadata was returned for this export.', { defaultValue: 'No metadata was returned for this export.' })}
            />
          )}
        </CardContent>
      </Card>
    </section>
  )
}
