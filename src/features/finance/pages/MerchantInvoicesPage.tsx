import { Link } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MoreVertical } from 'lucide-react'
import { listMerchantInvoices } from '../api/finance.api'
import type { MerchantInvoice } from '../types/finance.types'
import { ResourceListPage } from '../../../shared/components/data/ResourceListPage'
import { StatusBadge } from '../../../shared/components/ui/StatusBadge'
import { formatDate, formatMoney } from '../../../shared/utils/formatters'
import { Button } from '../../../shared/components/ui/Button'
import { compactFilters } from '../../../shared/components/data/ApiFilterBar'
import { Can } from '../../../shared/auth/Can'
import { PERMISSIONS } from '../../../shared/auth/permission-keys'
import { adminPath } from '../../../shared/routing/paths'
import { MoneyDisplay } from '../../../shared/components/display/MoneyDisplay'
import { Card, CardContent } from '../../../shared/components/ui/Card'
import { FilterButton } from '../../../shared/components/filters/FilterButton'
import { FilterPopover } from '../../../shared/components/filters/FilterPopover'
import { FilterField } from '../../../shared/components/filters/FilterField'
import { AppliedFilterChips, type AppliedFilterChip } from '../../../shared/components/filters/AppliedFilterChips'
import { DateRangeFilter } from '../../../shared/components/filters/DateRangeFilter'
import { MerchantSelector } from '../../../shared/components/selectors/MerchantSelector'
import { Select } from '../../../shared/components/ui/Select'
import { DropdownContent, DropdownItem, DropdownMenu, DropdownTrigger } from '../../../shared/components/ui/Dropdown'

const initialFilters = {
  date_from: '',
  date_to: '',
  merchant_id: '',
  status: '',
}

export function MerchantInvoicesPanel({
  embedded = false,
  onCountChange,
}: {
  embedded?: boolean
  onCountChange?: (count: number) => void
}) {
  const { t } = useTranslation()
  const [filters, setFilters] = useState(initialFilters)
  const [draftFilters, setDraftFilters] = useState(initialFilters)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const params = compactFilters(filters)

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.merchant_id) count++
    if (filters.status) count++
    if (filters.date_from || filters.date_to) count++
    return count
  }, [filters])

  const appliedChips: AppliedFilterChip[] = useMemo(() => {
    const chips: AppliedFilterChip[] = []
    if (filters.merchant_id) {
      chips.push({ key: 'merchant_id', label: t('Merchant'), value: filters.merchant_id })
    }
    if (filters.status) {
      chips.push({ key: 'status', label: t('Status'), value: t(filters.status) })
    }
    if (filters.date_from || filters.date_to) {
      chips.push({
        key: 'date_range',
        label: t('Date Range', { defaultValue: 'Date Range' }),
        value: `${filters.date_from || '...'} → ${filters.date_to || '...'}`,
      })
    }
    return chips
  }, [filters, t])

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) setDraftFilters(filters)
    setFiltersOpen(nextOpen)
  }

  const handleApply = () => {
    setFilters(draftFilters)
    setFiltersOpen(false)
  }

  const handleReset = () => {
    setDraftFilters(initialFilters)
    setFilters(initialFilters)
    setFiltersOpen(false)
  }

  const handleRemoveChip = (key: string) => {
    if (key === 'merchant_id') {
      setFilters((c) => ({ ...c, merchant_id: '' }))
      setDraftFilters((c) => ({ ...c, merchant_id: '' }))
    }
    if (key === 'status') {
      setFilters((c) => ({ ...c, status: '' }))
      setDraftFilters((c) => ({ ...c, status: '' }))
    }
    if (key === 'date_range') {
      setFilters((c) => ({ ...c, date_from: '', date_to: '' }))
      setDraftFilters((c) => ({ ...c, date_from: '', date_to: '' }))
    }
  }

  return (
    <ResourceListPage<MerchantInvoice>
      title={t('Merchant Invoices', { defaultValue: 'Merchant Invoices' })}
      description={t('Merchant invoice records and payable totals.', {
        defaultValue: 'Merchant invoice records and payable totals.',
      })}
      hideHeader={embedded}
      onCountChange={onCountChange}
      actions={<Can permission={PERMISSIONS.FINANCE_INVOICES_CREATE}><Link className="ui-link-reset" to={adminPath('/finance/merchant-invoices/create')}><Button>{t('Create Invoice', { defaultValue: 'Create Invoice' })}</Button></Link></Can>}
      queryKey={['merchant-invoices', params]}
      queryFn={() => listMerchantInvoices(params)}
      filters={
        <div className="page-toolbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', gap: '1rem', flexWrap: 'wrap' }}>
          <AppliedFilterChips
            chips={appliedChips}
            onRemove={handleRemoveChip}
            onClearAll={handleReset}
          />
          <div style={{ marginInlineStart: 'auto' }}>
            <FilterPopover
              title={t('Filter Invoices', { defaultValue: 'Filter Invoices' })}
              open={filtersOpen}
              onOpenChange={handleOpenChange}
              onApply={handleApply}
              onReset={handleReset}
              activeCount={activeFilterCount}
              trigger={
                <FilterButton
                  activeCount={activeFilterCount}
                  open={filtersOpen}
                  onClick={() => handleOpenChange(!filtersOpen)}
                />
              }
            >
              <div className="space-y-4">
                <FilterField label={t('Merchant')}>
                  <MerchantSelector
                    includeAllOption
                    value={draftFilters.merchant_id}
                    onChange={(merchant_id) => setDraftFilters((current) => ({ ...current, merchant_id }))}
                  />
                </FilterField>
                <FilterField label={t('Status')}>
                  <Select
                    value={draftFilters.status}
                    onChange={(event) => setDraftFilters((current) => ({ ...current, status: event.target.value }))}
                  >
                    <option value="">{t('All statuses')}</option>
                    <option value="draft">draft</option>
                    <option value="issued">issued</option>
                    <option value="paid">paid</option>
                    <option value="overdue">overdue</option>
                    <option value="cancelled">cancelled</option>
                  </Select>
                </FilterField>
                <FilterField label={t('Date Range', { defaultValue: 'Date Range' })}>
                  <DateRangeFilter
                    dateFrom={draftFilters.date_from}
                    dateTo={draftFilters.date_to}
                    onChange={({ date_from, date_to }) => setDraftFilters((current) => ({ ...current, date_from, date_to }))}
                  />
                </FilterField>
              </div>
            </FilterPopover>
          </div>
        </div>
      }
      renderSummary={(invoices) => {
        const totalInvoiced = invoices.reduce((sum, invoice) => sum + Number(invoice.total_payable || 0), 0)
        const paid = invoices
          .filter((invoice) => invoice.status === 'paid')
          .reduce((sum, invoice) => sum + Number(invoice.total_payable || 0), 0)
        const overdue = invoices
          .filter((invoice) => invoice.status === 'overdue')
          .reduce((sum, invoice) => sum + Number(invoice.total_payable || 0), 0)
        const paidCount = invoices.filter((invoice) => invoice.status === 'paid').length
        const overdueCount = invoices.filter((invoice) => invoice.status === 'overdue').length

        return (
          <div className="stats-grid finance-summary-grid">
            <Card variant="stat" className="finance-summary-card finance-summary-card--info" data-accent="finance"><CardContent><div className="compact-stat"><span className="compact-stat__label">{t('Total Invoiced', { defaultValue: 'Total Invoiced' })}</span><span className="compact-stat__value text-info"><MoneyDisplay value={totalInvoiced} /></span><span className="compact-stat__count">{t('{{count}} invoices', { count: invoices.length, defaultValue: `${invoices.length} invoices` })}</span></div></CardContent></Card>
            <Card variant="stat" className="finance-summary-card finance-summary-card--success" data-accent="success"><CardContent><div className="compact-stat"><span className="compact-stat__label">{t('Paid', { defaultValue: 'Paid' })}</span><span className="compact-stat__value text-success"><MoneyDisplay value={paid} /></span><span className="compact-stat__count">{t('{{count}} invoices', { count: paidCount, defaultValue: `${paidCount} invoices` })}</span></div></CardContent></Card>
            <Card variant="stat" className="finance-summary-card finance-summary-card--danger" data-accent="danger"><CardContent><div className="compact-stat"><span className="compact-stat__label">{t('Overdue', { defaultValue: 'Overdue' })}</span><span className="compact-stat__value text-danger"><MoneyDisplay value={overdue} /></span><span className="compact-stat__count">{t('{{count}} invoices', { count: overdueCount, defaultValue: `${overdueCount} invoices` })}</span></div></CardContent></Card>
          </div>
        )
      }}
      columns={[
        { header: t('Invoice', { defaultValue: 'Invoice' }), render: (invoice) => <Link className="table-link" to={adminPath(`/finance/merchant-invoices/${invoice.id}`)}>{invoice.invoice_number}</Link> },
        { header: t('Merchant'), render: (invoice) => invoice.merchant_name },
        { header: t('Payable', { defaultValue: 'Payable' }), render: (invoice) => formatMoney(invoice.total_payable) },
        { header: t('Status'), render: (invoice) => <StatusBadge value={invoice.status} /> },
        { header: t('Period', { defaultValue: 'Period' }), render: (invoice) => `${invoice.period_start} ${t('to', { defaultValue: 'to' })} ${invoice.period_end}` },
        { header: t('Created'), render: (invoice) => formatDate(invoice.created_at) },
        { header: t('Actions'), render: (invoice) => <div className="finance-row-actions"><Link className="ui-link-reset" to={adminPath(`/finance/merchant-invoices/${invoice.id}`)}><Button size="sm" variant="ghost">{t('View')}</Button></Link><DropdownMenu><DropdownTrigger aria-label={t('More actions', { defaultValue: 'More actions' })}><MoreVertical size={18} /></DropdownTrigger><DropdownContent><Can permission={PERMISSIONS.FINANCE_INVOICES_UPDATE}><DropdownItem><Link className="ui-link-reset" to={adminPath(`/finance/merchant-invoices/${invoice.id}/edit`)}>{t('Edit')}</Link></DropdownItem></Can></DropdownContent></DropdownMenu></div> },
      ]}
    />
  )
}

export function MerchantInvoicesPage() {
  return <MerchantInvoicesPanel />
}
