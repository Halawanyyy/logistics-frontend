import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { listMerchantInvoices } from '../api/finance.api'
import type { MerchantInvoice } from '../types/finance.types'
import { ResourceListPage } from '../../../shared/components/data/ResourceListPage'
import { StatusBadge } from '../../../shared/components/ui/StatusBadge'
import { formatDate, formatMoney } from '../../../shared/utils/formatters'
import { Button } from '../../../shared/components/ui/Button'
import { ApiFilterBar, compactFilters } from '../../../shared/components/data/ApiFilterBar'
import { Can } from '../../../shared/auth/Can'
import { PERMISSIONS } from '../../../shared/auth/permission-keys'
import { adminPath } from '../../../shared/routing/paths'

const initialFilters = {
  date_from: '',
  date_to: '',
  merchant_id: '',
  status: '',
}

export function MerchantInvoicesPage() {
  const { t } = useTranslation()
  const [filters, setFilters] = useState(initialFilters)
  const params = compactFilters(filters)
  return (
    <ResourceListPage<MerchantInvoice>
      title={t('Merchant Invoices', { defaultValue: 'Merchant Invoices' })}
      description={t('Merchant invoice records and payable totals.', {
        defaultValue: 'Merchant invoice records and payable totals.',
      })}
      actions={<Can permission={PERMISSIONS.FINANCE_INVOICES_CREATE}><Link className="ui-link-reset" to={adminPath('/finance/merchant-invoices/create')}><Button>{t('Create Invoice', { defaultValue: 'Create Invoice' })}</Button></Link></Can>}
      queryKey={['merchant-invoices', params]}
      queryFn={() => listMerchantInvoices(params)}
      filters={
        <ApiFilterBar
          filters={filters}
          fields={[
            { label: t('Date From'), name: 'date_from', type: 'date' },
            { label: t('Date To'), name: 'date_to', type: 'date' },
            { label: t('Merchant ID', { defaultValue: 'Merchant ID' }), name: 'merchant_id', type: 'number' },
            {
              label: t('Status'),
              name: 'status',
              type: 'select',
              options: [
                { label: t('draft', { defaultValue: 'draft' }), value: 'draft' },
                { label: t('issued', { defaultValue: 'issued' }), value: 'issued' },
                { label: t('paid', { defaultValue: 'paid' }), value: 'paid' },
                { label: t('cancelled', { defaultValue: 'cancelled' }), value: 'cancelled' },
              ],
            },
          ]}
          onChange={(name, value) => setFilters((current) => ({ ...current, [name]: value }))}
          onReset={() => setFilters(initialFilters)}
        />
      }
      columns={[
        { header: t('Invoice', { defaultValue: 'Invoice' }), render: (invoice) => <Link className="table-link" to={adminPath(`/finance/merchant-invoices/${invoice.id}`)}>{invoice.invoice_number}</Link> },
        { header: t('Merchant'), render: (invoice) => invoice.merchant_name },
        { header: t('Payable', { defaultValue: 'Payable' }), render: (invoice) => formatMoney(invoice.total_payable) },
        { header: t('Status'), render: (invoice) => <StatusBadge value={invoice.status} /> },
        { header: t('Period', { defaultValue: 'Period' }), render: (invoice) => `${invoice.period_start} ${t('to', { defaultValue: 'to' })} ${invoice.period_end}` },
        { header: t('Created'), render: (invoice) => formatDate(invoice.created_at) },
        { header: t('Actions'), render: (invoice) => <Can permission={PERMISSIONS.FINANCE_INVOICES_UPDATE}><Link className="table-link" to={adminPath(`/finance/merchant-invoices/${invoice.id}/edit`)}>{t('Edit')}</Link></Can> },
      ]}
    />
  )
}
