import { Link } from 'react-router-dom'
import { useState } from 'react'
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
  const [filters, setFilters] = useState(initialFilters)
  const params = compactFilters(filters)
  return (
    <ResourceListPage<MerchantInvoice>
      title="Merchant Invoices"
      description="Merchant invoice records and payable totals."
      actions={<Can permission={PERMISSIONS.INVOICES_CREATE}><Link className="ui-link-reset" to={adminPath('/finance/merchant-invoices/create')}><Button>Create Invoice</Button></Link></Can>}
      queryKey={['merchant-invoices', params]}
      queryFn={() => listMerchantInvoices(params)}
      filters={
        <ApiFilterBar
          filters={filters}
          fields={[
            { label: 'Date From', name: 'date_from', type: 'date' },
            { label: 'Date To', name: 'date_to', type: 'date' },
            { label: 'Merchant ID', name: 'merchant_id', type: 'number' },
            { label: 'Status', name: 'status', type: 'select', options: [{ label: 'draft', value: 'draft' }, { label: 'issued', value: 'issued' }, { label: 'paid', value: 'paid' }, { label: 'cancelled', value: 'cancelled' }] },
          ]}
          onChange={(name, value) => setFilters((current) => ({ ...current, [name]: value }))}
          onReset={() => setFilters(initialFilters)}
        />
      }
      columns={[
        { header: 'Invoice', render: (invoice) => <Link className="table-link" to={adminPath(`/finance/merchant-invoices/${invoice.id}`)}>{invoice.invoice_number}</Link> },
        { header: 'Merchant', render: (invoice) => invoice.merchant_name },
        { header: 'Payable', render: (invoice) => formatMoney(invoice.total_payable) },
        { header: 'Status', render: (invoice) => <StatusBadge value={invoice.status} /> },
        { header: 'Period', render: (invoice) => `${invoice.period_start} to ${invoice.period_end}` },
        { header: 'Created', render: (invoice) => formatDate(invoice.created_at) },
        { header: 'Actions', render: (invoice) => <Can permission={PERMISSIONS.INVOICES_UPDATE}><Link className="table-link" to={adminPath(`/finance/merchant-invoices/${invoice.id}/edit`)}>Edit</Link></Can> },
      ]}
    />
  )
}
