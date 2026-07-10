import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { listAuditLogs } from '../../../shared/api/audit.api'
import type { AuditLogItem, AuditLogsFilters } from '../../../shared/types/audit.types'
import { getApiErrorMessage } from '../../../shared/api/api-error'
import { DateRangeFilter } from '../../../shared/components/filters/DateRangeFilter'
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
  const [filters, setFilters] = useState<AuditFiltersState>(initialFilters)
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null)
  const params: AuditLogsFilters = useMemo(
    () => ({
      ...(filters.user_id ? { user_id: filters.user_id } : {}),
      ...(filters.event_type ? { event_type: filters.event_type } : {}),
      ...(filters.action ? { action: filters.action } : {}),
      ...(filters.auditable_type ? { auditable_type: filters.auditable_type } : {}),
      ...(filters.auditable_id ? { auditable_id: filters.auditable_id } : {}),
      ...(filters.date_from ? { date_from: filters.date_from } : {}),
      ...(filters.date_to ? { date_to: filters.date_to } : {}),
      ...(filters.search ? { search: filters.search } : {}),
      ...(filters.per_page ? { per_page: filters.per_page } : {}),
    }),
    [filters],
  )
  const auditLogsQuery = useQuery({
    queryKey: ['audit-logs', params],
    queryFn: () => listAuditLogs(params),
  })
  const logs = auditLogsQuery.data?.data ?? []

  return (
    <section className="page-section page-section--with-sidebar">
      <PageHeader
        title={t('Audit Logs', { defaultValue: 'Audit Logs' })}
        description={t('Global operational, finance, and security audit records.', { defaultValue: 'Global operational, finance, and security audit records.' })}
      />

      <aside className="page-sidebar-filters">
        <Card variant="flat" className="dashboard-filter-card">
          <CardContent className="dashboard-filters dashboard-filters--sidebar">
          <label className="field">
            <span>{t('User ID')}</span>
            <Input
              value={filters.user_id}
              onChange={(event) => setFilters((current) => ({ ...current, user_id: event.target.value }))}
            />
          </label>
          <label className="field">
            <span>{t('Event Type')}</span>
            <Input
              value={filters.event_type}
              onChange={(event) => setFilters((current) => ({ ...current, event_type: event.target.value }))}
            />
          </label>
          <label className="field">
            <span>{t('Action')}</span>
            <Input
              value={filters.action}
              onChange={(event) => setFilters((current) => ({ ...current, action: event.target.value }))}
            />
          </label>
          <label className="field">
            <span>{t('Auditable Type')}</span>
            <Input
              value={filters.auditable_type}
              onChange={(event) => setFilters((current) => ({ ...current, auditable_type: event.target.value }))}
            />
          </label>
          <label className="field">
            <span>{t('Auditable ID')}</span>
            <Input
              value={filters.auditable_id}
              onChange={(event) => setFilters((current) => ({ ...current, auditable_id: event.target.value }))}
            />
          </label>
          <DateRangeFilter
            dateFrom={filters.date_from}
            dateTo={filters.date_to}
            onChange={({ date_from, date_to }) => setFilters((current) => ({ ...current, date_from, date_to }))}
          />
          <label className="field">
            <span>{t('Search')}</span>
            <Input
              value={filters.search}
              onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
            />
          </label>
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
          </div>
        </CardContent>
      </Card>
      </aside>

      <main className="page-main-content">
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
      </main>
    </section>
  )
}
