import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { listMerchantPortalExports } from '../api/merchantPortalExports.api'
import { CanMerchant } from '../../components/CanMerchant'
import { merchantPath } from '../../../../shared/routing/paths'
import { Button } from '../../../../shared/components/ui/Button'
import { PageHeader } from '../../../../shared/components/ui/PageHeader'
import { Card } from '../../../../shared/components/ui/Card'
import { Table, TableCell, TableContainer, TableHead } from '../../../../shared/components/ui/Table'
import { StatusBadge } from '../../../../shared/components/ui/StatusBadge'
import { LoadingState } from '../../../../shared/components/states/LoadingState'
import { ErrorState } from '../../../../shared/components/states/ErrorState'
import { EmptyState } from '../../../../shared/components/states/EmptyState'
import { DateRangeFilter } from '../../../../shared/components/filters/DateRangeFilter'
import { getApiErrorMessage } from '../../../../shared/api/api-error'
import { formatDate } from '../../../../shared/utils/formatters'
import type { MerchantExportFilters } from '../types/merchantPortalExports.types'
import { MerchantExportDownloadButton } from './components/MerchantExportDownloadButton'

export function MerchantExportsPage() {
  const { t } = useTranslation()
  const [filters, setFilters] = useState<MerchantExportFilters>({
    page: 1,
    per_page: 50,
  })

  const exportsQuery = useQuery({
    queryKey: ['merchant-portal', 'exports', filters],
    queryFn: () => listMerchantPortalExports(filters),
  })

  
  const handleReset = () => {
    setFilters({ page: 1, per_page: 50 })
  }

  const exports = exportsQuery.data?.data ?? []

  return (
    <div className="page-stack">
      <PageHeader
        title={t('Exports', { defaultValue: 'Exports' })}
        description={t('Create and download exports for your merchant data.', { defaultValue: 'Create and download exports for your merchant data.' })}
        actions={
          <CanMerchant capability="exports.create">
            <Link className="ui-link-reset" to={merchantPath('/exports/create')}>
              <Button variant="primary">
                {t('Create Export', { defaultValue: 'Create Export' })}
              </Button>
            </Link>
          </CanMerchant>
        }
      />

      <Card className="p-4 mb-4">
        <div className="filters-grid">
          <DateRangeFilter
            dateFrom={filters.date_from ?? ''}
            dateTo={filters.date_to ?? ''}
            onChange={(range: any) => { const from = range?.date_from || ""; const to = range?.date_to || ""; setFilters((prev: any) => ({ ...prev, date_from: from, date_to: to })) }}
          />
          <Button variant="secondary" onClick={handleReset}>
            {t('Reset', { defaultValue: 'Reset' })}
          </Button>
        </div>
      </Card>

      <Card>
        {exportsQuery.isLoading ? (
          <LoadingState title={t('Loading exports...', { defaultValue: 'Loading exports...' })} />
        ) : exportsQuery.isError ? (
          <ErrorState
            title={t('Failed to load exports.', { defaultValue: 'Failed to load exports.' })}
            message={getApiErrorMessage(exportsQuery.error)}
            onRetry={() => void exportsQuery.refetch()}
          />
        ) : exports.length === 0 ? (
          <EmptyState
            title={t('No exports found.', { defaultValue: 'No exports found.' })}
            description={t('Create your first export to get started.', { defaultValue: 'Create your first export to get started.' })}
          />
        ) : (
          <TableContainer>
            <Table>
              <thead>
                <tr>
                  <TableHead>{t('Export Type', { defaultValue: 'Export Type' })}</TableHead>
                  <TableHead>{t('Export Status', { defaultValue: 'Export Status' })}</TableHead>
                  <TableHead>{t('File Name', { defaultValue: 'File Name' })}</TableHead>
                  <TableHead>{t('Created Date', { defaultValue: 'Created Date' })}</TableHead>
                  <TableHead>{t('Completed Date', { defaultValue: 'Completed Date' })}</TableHead>
                  <TableHead className="text-right">{t('Actions', { defaultValue: 'Actions' })}</TableHead>
                </tr>
              </thead>
              <tbody>
                {exports.map((exp) => (
                  <tr key={exp.id}>
                    <TableCell>
                      {exp.export_type || exp.type || '-'}
                    </TableCell>
                    <TableCell>
                      <StatusBadge value={exp.status} />
                    </TableCell>
                    <TableCell className="font-mono text-sm max-w-[200px] truncate">
                      {exp.file_name || '-'}
                    </TableCell>
                    <TableCell>{formatDate(exp.created_at)}</TableCell>
                    <TableCell>{exp.completed_at ? formatDate(exp.completed_at) : '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link className="ui-link-reset" to={merchantPath(`/exports/${exp.id}`)}>
                          <Button
                            variant="secondary"
                            size="sm"
                          >
                            {t('View', { defaultValue: 'View' })}
                          </Button>
                        </Link>
                        <CanMerchant capability="exports.download">
                          <MerchantExportDownloadButton exportItem={exp} />
                        </CanMerchant>
                      </div>
                    </TableCell>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableContainer>
        )}
      </Card>
    </div>
  )
}
