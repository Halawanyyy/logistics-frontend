import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { getMerchantPortalExport } from '../api/merchantPortalExports.api'
import { merchantPath } from '../../../../shared/routing/paths'
import { PageHeader } from '../../../../shared/components/ui/PageHeader'
import { Card, CardContent } from '../../../../shared/components/ui/Card'
import { StatusBadge } from '../../../../shared/components/ui/StatusBadge'
import { LoadingState } from '../../../../shared/components/states/LoadingState'
import { ErrorState } from '../../../../shared/components/states/ErrorState'
import { getApiErrorMessage } from '../../../../shared/api/api-error'
import { formatDate } from '../../../../shared/utils/formatters'
import { MerchantExportDownloadButton } from './components/MerchantExportDownloadButton'
import { CanMerchant } from '../../components/CanMerchant'

export function MerchantExportDetailsPage() {
  const { exportId } = useParams<{ exportId: string }>()
  const { t } = useTranslation()

  const exportQuery = useQuery({
    queryKey: ['merchant-portal', 'export', exportId],
    queryFn: () => getMerchantPortalExport(exportId as string),
    enabled: Boolean(exportId),
  })

  if (exportQuery.isLoading) {
    return (
      <div className="page-stack">
        <PageHeader title={t('Export Details', { defaultValue: 'Export Details' })} backTo={merchantPath('/exports')} />
        <Card>
          <LoadingState title={t('Loading export...', { defaultValue: 'Loading export...' })} />
        </Card>
      </div>
    )
  }

  if (exportQuery.isError) {
    return (
      <div className="page-stack">
        <PageHeader title={t('Export Details', { defaultValue: 'Export Details' })} backTo={merchantPath('/exports')} />
        <Card>
          <ErrorState
            title={t('Failed to load export.', { defaultValue: 'Failed to load export.' })}
            message={getApiErrorMessage(exportQuery.error)}
            onRetry={() => void exportQuery.refetch()}
          />
        </Card>
      </div>
    )
  }

  const exportData = exportQuery.data?.data
  if (!exportData) return null

  return (
    <div className="page-stack">
      <PageHeader
        title={t('Export Details', { defaultValue: 'Export Details' })}
        backTo={merchantPath('/exports')}
        actions={
          <CanMerchant capability="exports.download">
            <MerchantExportDownloadButton exportItem={exportData} />
          </CanMerchant>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-muted">{t('Export Type', { defaultValue: 'Export Type' })}</dt>
                <dd className="mt-1 text-sm">{exportData.export_type || exportData.type || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted">{t('Export Status', { defaultValue: 'Export Status' })}</dt>
                <dd className="mt-1">
                  <StatusBadge value={exportData.status} />
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted">{t('Export Format', { defaultValue: 'Export Format' })}</dt>
                <dd className="mt-1 text-sm uppercase">{exportData.format || 'CSV'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted">{t('File Name', { defaultValue: 'File Name' })}</dt>
                <dd className="mt-1 text-sm font-mono break-all">{exportData.file_name || '-'}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-muted">{t('Created Date', { defaultValue: 'Created Date' })}</dt>
                <dd className="mt-1 text-sm">{formatDate(exportData.created_at)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted">{t('Completed Date', { defaultValue: 'Completed Date' })}</dt>
                <dd className="mt-1 text-sm">{exportData.completed_at ? formatDate(exportData.completed_at) : '-'}</dd>
              </div>
              {exportData.failed_at && (
                <div>
                  <dt className="text-sm font-medium text-red-500">{t('Failed Date', { defaultValue: 'Failed Date' })}</dt>
                  <dd className="mt-1 text-sm text-red-500">{formatDate(exportData.failed_at)}</dd>
                </div>
              )}
              {exportData.error_message && (
                <div>
                  <dt className="text-sm font-medium text-red-500">{t('Error Message', { defaultValue: 'Error Message' })}</dt>
                  <dd className="mt-1 text-sm text-red-500 bg-red-50 p-2 rounded break-all">{exportData.error_message}</dd>
                </div>
              )}
              {exportData.filters && Object.keys(exportData.filters).length > 0 && (
                <div>
                  <dt className="text-sm font-medium text-muted">{t('Filters', { defaultValue: 'Filters' })}</dt>
                  <dd className="mt-1 text-sm">
                    <pre className="bg-muted p-2 rounded whitespace-pre-wrap font-mono">
                      {JSON.stringify(exportData.filters, null, 2)}
                    </pre>
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
