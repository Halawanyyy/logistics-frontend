import { useMemo, useState } from 'react'
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
import { Select } from '../../../../shared/components/ui/Select'
import {
  FilterButton,
  FilterPopover,
  FilterField,
  AppliedFilterChips,
  DateRangeFilter,
  type AppliedChip,
} from '../../../../shared/components/filters'
import { getApiErrorMessage } from '../../../../shared/api/api-error'
import { formatDate } from '../../../../shared/utils/formatters'
import type { MerchantExportFilters } from '../types/merchantPortalExports.types'
import { MerchantExportDownloadButton } from './components/MerchantExportDownloadButton'

export function MerchantExportsPage() {
  const { t } = useTranslation()
  const initialFilters: MerchantExportFilters = {
    page: 1,
    per_page: 50,
  }
  const [appliedFilters, setAppliedFilters] = useState<MerchantExportFilters>(initialFilters)
  const [draftFilters, setDraftFilters] = useState<MerchantExportFilters>(initialFilters)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filterError, setFilterError] = useState('')

  const exportsQuery = useQuery({
    queryKey: ['merchant-portal', 'exports', appliedFilters],
    queryFn: () => listMerchantPortalExports(appliedFilters),
  })

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (appliedFilters.export_type) count += 1
    if (appliedFilters.status) count += 1
    if (appliedFilters.date_from || appliedFilters.date_to) count += 1
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
    setAppliedFilters({ ...draftFilters, page: 1 })
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
        label: t('Export Type', { defaultValue: 'Export Type' }),
        value: String(appliedFilters.export_type),
      })
    }
    if (appliedFilters.status) {
      chips.push({
        id: 'status',
        label: t('Status', { defaultValue: 'Status' }),
        value: appliedFilters.status,
      })
    }
    if (appliedFilters.date_from || appliedFilters.date_to) {
      chips.push({
        id: 'date_range',
        label: t('Date', { defaultValue: 'Date' }),
        value: `${appliedFilters.date_from || ''} → ${appliedFilters.date_to || ''}`,
      })
    }
    return chips
  }, [appliedFilters, t])

  const handleRemoveChip = (chipId: string) => {
    if (chipId === 'date_range') {
      setAppliedFilters((c) => ({ ...c, date_from: undefined, date_to: undefined, page: 1 }))
    } else {
      setAppliedFilters((c) => ({ ...c, [chipId]: undefined, page: 1 }))
    }
  }

  const handleClearAllChips = () => {
    setAppliedFilters(initialFilters)
  }

  const exports = exportsQuery.data?.data ?? []

  return (
    <div className="page-stack">
      <PageHeader
        title={t('Exports', { defaultValue: 'Exports' })}
        description={t('Create and download exports for your merchant data.', { defaultValue: 'Create and download exports for your merchant data.' })}
        actions={
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
              <FilterField label={t('Export Type', { defaultValue: 'Export Type' })}>
                <Select
                  value={draftFilters.export_type ?? ''}
                  onChange={(e) => setDraftFilters((prev) => ({ ...prev, export_type: (e.target.value || undefined) as any }))}
                >
                  <option value="">{t('All types', { defaultValue: 'All types' })}</option>
                  <option value="orders">{t('Orders', { defaultValue: 'Orders' })}</option>
                  <option value="shipments">{t('Shipments', { defaultValue: 'Shipments' })}</option>
                  <option value="warehouse_inventory">{t('Warehouse Inventory', { defaultValue: 'Warehouse Inventory' })}</option>
                  <option value="stock_movements">{t('Stock Movements', { defaultValue: 'Stock Movements' })}</option>
                  <option value="wallet_transactions">{t('Wallet Transactions', { defaultValue: 'Wallet Transactions' })}</option>
                  <option value="invoices">{t('Invoices', { defaultValue: 'Invoices' })}</option>
                  <option value="payouts">{t('Payouts', { defaultValue: 'Payouts' })}</option>
                  <option value="inbound_stock_requests">{t('Inbound Stock Requests', { defaultValue: 'Inbound Stock Requests' })}</option>
                </Select>
              </FilterField>
              <FilterField label={t('Export Status', { defaultValue: 'Export Status' })}>
                <Select
                  value={draftFilters.status ?? ''}
                  onChange={(e) => setDraftFilters((prev) => ({ ...prev, status: e.target.value || undefined }))}
                >
                  <option value="">{t('All statuses', { defaultValue: 'All statuses' })}</option>
                  <option value="pending">{t('pending', { defaultValue: 'pending' })}</option>
                  <option value="processing">{t('processing', { defaultValue: 'processing' })}</option>
                  <option value="completed">{t('completed', { defaultValue: 'completed' })}</option>
                  <option value="failed">{t('failed', { defaultValue: 'failed' })}</option>
                </Select>
              </FilterField>
              <DateRangeFilter
                dateFrom={draftFilters.date_from ?? ''}
                dateTo={draftFilters.date_to ?? ''}
                onChange={({ date_from, date_to }) => setDraftFilters((prev) => ({ ...prev, date_from, date_to }))}
                error={filterError}
              />
            </FilterPopover>

            <CanMerchant capability="exports.create">
              <Link className="ui-link-reset" to={merchantPath('/exports/create')}>
                <Button variant="primary">
                  {t('Create Export', { defaultValue: 'Create Export' })}
                </Button>
              </Link>
            </CanMerchant>
          </div>
        }
      />

      <AppliedFilterChips
        chips={appliedChips}
        onRemove={handleRemoveChip}
        onClearAll={handleClearAllChips}
      />

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
