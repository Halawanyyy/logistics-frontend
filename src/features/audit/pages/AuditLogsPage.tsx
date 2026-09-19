import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { listAuditLogs } from '../../../shared/api/audit.api'
import type { AuditLogItem, AuditLogsFilters } from '../../../shared/types/audit.types'
import { getApiErrorMessage } from '../../../shared/api/api-error'
import {
  FilterButton,
  FilterPopover,
  FilterField,
  AppliedFilterChips,
  DateRangeFilter,
  type AppliedChip,
} from '../../../shared/components/filters'
import { EmptyState } from '../../../shared/components/states/EmptyState'
import { ErrorState } from '../../../shared/components/states/ErrorState'
import { LoadingState } from '../../../shared/components/states/LoadingState'
import { Button } from '../../../shared/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/Card'
import { Dialog } from '../../../shared/components/ui/Dialog'
import { Input } from '../../../shared/components/ui/Input'
import { PageHeader } from '../../../shared/components/ui/PageHeader'
import { Select } from '../../../shared/components/ui/Select'
import { Table, TableCell, TableContainer, TableHead } from '../../../shared/components/ui/Table'
import { formatDate } from '../../../shared/utils/formatters'

type AuditFiltersState = {
  user_id: string
  event_type: string
  action: string
  auditable_type: string
  auditable_id: string
  date_from: string
  date_to: string
  search: string
  per_page: string
}

const initialFilters: AuditFiltersState = {
  user_id: '',
  event_type: '',
  action: '',
  auditable_type: '',
  auditable_id: '',
  date_from: '',
  date_to: '',
  search: '',
  per_page: '50',
}

const sensitiveKeys = new Set([
  'password',
  'remember_token',
  'token',
  'api_token',
  'api_key',
  'secret',
  'secret',
])

const AUDIT_ACTION_MAP: Record<string, string> = {
  created: 'Created',
  updated: 'Updated',
  deleted: 'Deleted',
  company_catalog_item_created: 'Company Catalog Item Created',
  company_catalog_item_updated: 'Company Catalog Item Updated',
  company_catalog_item_deleted: 'Company Catalog Item Deleted',
  merchant_shop_previewed: 'Merchant Shop Previewed',
  settings_updated: 'Settings Updated',
}

function getAuditActionLabel(action: string | null | undefined, t: any) {
  if (!action) return '-'
  const mapped = AUDIT_ACTION_MAP[action]
  return mapped ? t(mapped, { defaultValue: mapped }) : action
}

function sanitizeRecordPayload(value: Record<string, unknown> | null | undefined) {
  if (!value) {
    return null
  }

  return Object.fromEntries(
    Object.entries(value).filter(([key]) => !sensitiveKeys.has(key)),
  )
}

function renderAuditMeta(record: AuditLogItem) {
  const metadata = sanitizeRecordPayload(record.metadata)
  if (metadata?.request_path) {
    return String(metadata.request_path)
  }
  if (record.notes) {
    return record.notes
  }
  return '-'
}

function JsonBlock({ title, value }: { title: string; value: Record<string, unknown> | null }) {
  if (!value || !Object.keys(value).length) {
    return null
  }

  return (
    <div className="page-stack">
      <h3>{title}</h3>
      <pre className="ui-code-block">{JSON.stringify(value, null, 2)}</pre>
    </div>
  )
}

export function AuditLogsPage() {
  const { t } = useTranslation()
  const [appliedFilters, setAppliedFilters] = useState<AuditFiltersState>(initialFilters)
  const [draftFilters, setDraftFilters] = useState<AuditFiltersState>(initialFilters)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filterError, setFilterError] = useState('')
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null)
  const params: AuditLogsFilters = useMemo(
    () => ({
      ...(appliedFilters.user_id ? { user_id: appliedFilters.user_id } : {}),
      ...(appliedFilters.event_type ? { event_type: appliedFilters.event_type } : {}),
      ...(appliedFilters.action ? { action: appliedFilters.action } : {}),
      ...(appliedFilters.auditable_type ? { auditable_type: appliedFilters.auditable_type } : {}),
      ...(appliedFilters.auditable_id ? { auditable_id: appliedFilters.auditable_id } : {}),
      ...(appliedFilters.date_from ? { date_from: appliedFilters.date_from } : {}),
      ...(appliedFilters.date_to ? { date_to: appliedFilters.date_to } : {}),
      ...(appliedFilters.search ? { search: appliedFilters.search } : {}),
      ...(appliedFilters.per_page ? { per_page: appliedFilters.per_page } : {}),
    }),
    [appliedFilters],
  )
  const auditLogsQuery = useQuery({
    queryKey: ['audit-logs', params],
    queryFn: () => listAuditLogs(params),
  })
  const logs = auditLogsQuery.data?.data ?? []

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (appliedFilters.user_id) count += 1
    if (appliedFilters.event_type) count += 1
    if (appliedFilters.action) count += 1
    if (appliedFilters.auditable_type) count += 1
    if (appliedFilters.auditable_id) count += 1
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
    setDraftFilters((c) => ({ ...initialFilters, search: c.search }))
    setAppliedFilters((c) => ({ ...initialFilters, search: c.search }))
    setFilterError('')
    setFiltersOpen(false)
  }

  const appliedChips = useMemo<AppliedChip[]>(() => {
    const chips: AppliedChip[] = []
    if (appliedFilters.user_id) chips.push({ id: 'user_id', label: t('User ID'), value: appliedFilters.user_id })
    if (appliedFilters.event_type) chips.push({ id: 'event_type', label: t('Event Type'), value: appliedFilters.event_type })
    if (appliedFilters.action) chips.push({ id: 'action', label: t('Action'), value: appliedFilters.action })
    if (appliedFilters.auditable_type) chips.push({ id: 'auditable_type', label: t('Auditable Type'), value: appliedFilters.auditable_type })
    if (appliedFilters.auditable_id) chips.push({ id: 'auditable_id', label: t('Auditable ID'), value: appliedFilters.auditable_id })
    if (appliedFilters.date_from || appliedFilters.date_to) {
      chips.push({
        id: 'date_range',
        label: t('Date'),
        value: `${appliedFilters.date_from || ''} → ${appliedFilters.date_to || ''}`,
      })
    }
    if (appliedFilters.per_page && appliedFilters.per_page !== '50') {
      chips.push({ id: 'per_page', label: t('Per Page'), value: appliedFilters.per_page })
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
    setAppliedFilters((c) => ({ ...initialFilters, search: c.search }))
  }

  return (
    <section className="page-section page-layout--fullwidth">
      <PageHeader
        title={t('Audit Logs', { defaultValue: 'Audit Logs' })}
        description={t('Global operational, finance, and security audit records.', { defaultValue: 'Global operational, finance, and security audit records.' })}
      />

      <div className="page-toolbar">
        <Input
          value={appliedFilters.search}
          placeholder={t('Search audit logs...', { defaultValue: 'Search audit logs...' })}
          onChange={(event) => setAppliedFilters((c) => ({ ...c, search: event.target.value }))}
          className="page-toolbar__search"
        />

        <div className="page-toolbar__actions">
          <FilterPopover
            title={t('Audit log filters', { defaultValue: 'Audit log filters' })}
            activeCount={activeFilterCount}
            open={filtersOpen}
            onOpenChange={handleOpenChange}
            onApply={handleApply}
            onReset={handleReset}
            trigger={<FilterButton activeCount={activeFilterCount} />}
          >
            <FilterField label={t('User ID')}>
              <Input
                value={draftFilters.user_id}
                onChange={(event) => setDraftFilters((current) => ({ ...current, user_id: event.target.value }))}
              />
            </FilterField>
            <FilterField label={t('Event Type')}>
              <Input
                value={draftFilters.event_type}
                onChange={(event) => setDraftFilters((current) => ({ ...current, event_type: event.target.value }))}
              />
            </FilterField>
            <FilterField label={t('Action')}>
              <Input
                value={draftFilters.action}
                onChange={(event) => setDraftFilters((current) => ({ ...current, action: event.target.value }))}
              />
            </FilterField>
            <FilterField label={t('Auditable Type')}>
              <Input
                value={draftFilters.auditable_type}
                onChange={(event) => setDraftFilters((current) => ({ ...current, auditable_type: event.target.value }))}
              />
            </FilterField>
            <FilterField label={t('Auditable ID')}>
              <Input
                value={draftFilters.auditable_id}
                onChange={(event) => setDraftFilters((current) => ({ ...current, auditable_id: event.target.value }))}
              />
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
        </div>
      </div>

      <AppliedFilterChips
        chips={appliedChips}
        onRemove={handleRemoveChip}
        onClearAll={handleClearAllChips}
      />
      <Card className="table-card">
        <CardHeader>
          <CardTitle>{t('Global Audit History')}</CardTitle>
          <CardDescription>
            {t('Search across user actions, workflow events, and entity activity logs.')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {auditLogsQuery.isLoading ? <LoadingState title={t('Loading audit logs')} /> : null}
          {auditLogsQuery.isError ? (
            <ErrorState
              title={t('Unable to load audit logs', { defaultValue: 'Unable to load audit logs' })}
              message={getApiErrorMessage(auditLogsQuery.error)}
              onRetry={() => void auditLogsQuery.refetch()}
            />
          ) : null}
          {!auditLogsQuery.isLoading && !auditLogsQuery.isError && !logs.length ? (
            <EmptyState
              title={t('No audit logs found', { defaultValue: 'No audit logs found' })}
              description={t('No audit events matched the selected filters.', { defaultValue: 'No audit events matched the selected filters.' })}
            />
          ) : null}
          {logs.length ? (
            <TableContainer>
              <Table variant="compact">
                <thead>
                  <tr>
                    <TableHead>{t('User')}</TableHead>
                    <TableHead>{t('Event Type')}</TableHead>
                    <TableHead>{t('Action')}</TableHead>
                    <TableHead>{t('Auditable')}</TableHead>
                    <TableHead>{t('Notes')}</TableHead>
                    <TableHead>{t('IP Address')}</TableHead>
                    <TableHead>{t('Created')}</TableHead>
                    <TableHead>{t('Actions')}</TableHead>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <TableCell>{log.user?.name ?? t('System')}</TableCell>
                      <TableCell>{log.event_type}</TableCell>
                      <TableCell>{getAuditActionLabel(log.action, t)}</TableCell>
                      <TableCell>
                        {log.auditable_type}
                        <p className="table-meta">#{log.auditable_id}</p>
                      </TableCell>
                      <TableCell>{renderAuditMeta(log)}</TableCell>
                      <TableCell>{log.ip_address ?? '-'}</TableCell>
                      <TableCell>{formatDate(log.created_at)}</TableCell>
                      <TableCell>
                          <Button type="button" variant="secondary" onClick={() => setSelectedLog(log)}>
                            {t('View Details')}
                          </Button>
                      </TableCell>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableContainer>
          ) : null}
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
        title={<CardTitle>{t('Audit Log Details')}</CardTitle>}
      >
        {selectedLog ? (
          <div className="page-stack">
            <dl className="detail-list">
              <div><dt>{t('User')}</dt><dd>{selectedLog.user?.name ?? t('System')}</dd></div>
              <div><dt>{t('Event Type')}</dt><dd>{selectedLog.event_type}</dd></div>
              <div><dt>{t('Action')}</dt><dd>{getAuditActionLabel(selectedLog.action, t)}</dd></div>
              <div><dt>{t('Auditable Type')}</dt><dd>{selectedLog.auditable_type}</dd></div>
              <div><dt>{t('Auditable ID')}</dt><dd>{selectedLog.auditable_id}</dd></div>
              <div><dt>{t('Notes')}</dt><dd>{selectedLog.notes ?? '-'}</dd></div>
              <div><dt>{t('IP Address')}</dt><dd>{selectedLog.ip_address ?? '-'}</dd></div>
              <div><dt>{t('Created')}</dt><dd>{formatDate(selectedLog.created_at)}</dd></div>
            </dl>
            <JsonBlock title={t('Old Values')} value={sanitizeRecordPayload(selectedLog.old_values)} />
            <JsonBlock title={t('New Values')} value={sanitizeRecordPayload(selectedLog.new_values)} />
            <JsonBlock title={t('Metadata')} value={sanitizeRecordPayload(selectedLog.metadata)} />
          </div>
        ) : null}
      </Dialog>
    </section>
  )
}
