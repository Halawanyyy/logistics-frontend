import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getApiErrorMessage } from '../../../shared/api/api-error'
import { Attachments } from '../../../shared/components/attachments/Attachments'
import { ErrorState } from '../../../shared/components/feedback/ErrorState'
import { LoadingState } from '../../../shared/components/feedback/LoadingState'
import { Button } from '../../../shared/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../shared/components/ui/Card'
import { PageHeader } from '../../../shared/components/ui/PageHeader'
import { Table, TableCell, TableContainer, TableHead } from '../../../shared/components/ui/Table'
import { StatusBadge } from '../../../shared/components/ui/StatusBadge'
import { formatDate, formatMoney } from '../../../shared/utils/formatters'
import { Can } from '../../../shared/auth/Can'
import { PERMISSIONS, type Permission } from '../../../shared/auth/permission-keys'
import { adminPath } from '../../../shared/routing/paths'
import {
  deleteDriverCashClosure,
  deleteExpense,
  deleteMerchantInvoice,
  deleteMerchantPayout,
  downloadMerchantInvoice,
  getDriverCashClosure,
  getExpense,
  getMerchantInvoice,
  getMerchantInvoicePreview,
  getMerchantPayout,
  verifyDriverCashClosure,
} from '../api/finance.api'

type FinanceKind = 'payouts' | 'cash-closures' | 'expenses' | 'invoices'

type FinanceRecord = Record<string, unknown> & {
  id: number
  status?: string
  invoice_number?: string
  merchant_name?: string
  driver_name?: string
  category?: string
}

type FinanceRecordResponse = {
  data: FinanceRecord
}

const config = {
  payouts: { title: 'Merchant Payout', back: adminPath('/finance/merchant-payouts'), queryKey: 'merchant-payouts', get: getMerchantPayout, remove: deleteMerchantPayout },
  'cash-closures': { title: 'Driver Cash Closure', back: adminPath('/finance/driver-cash-closures'), queryKey: 'driver-cash-closures', get: getDriverCashClosure, remove: deleteDriverCashClosure },
  expenses: { title: 'Expense', back: adminPath('/finance/expenses'), queryKey: 'expenses', get: getExpense, remove: deleteExpense },
  invoices: { title: 'Merchant Invoice', back: adminPath('/finance/merchant-invoices'), queryKey: 'merchant-invoices', get: getMerchantInvoice, remove: deleteMerchantInvoice },
} as const

const actionPermissions: Record<FinanceKind, { update: Permission; remove: Permission; download?: Permission }> = {
  payouts: { update: PERMISSIONS.PAYOUTS_UPDATE, remove: PERMISSIONS.PAYOUTS_DELETE },
  'cash-closures': { update: PERMISSIONS.CASH_CLOSURES_UPDATE, remove: PERMISSIONS.CASH_CLOSURES_DELETE },
  expenses: { update: PERMISSIONS.EXPENSES_UPDATE, remove: PERMISSIONS.EXPENSES_DELETE },
  invoices: {
    update: PERMISSIONS.FINANCE_INVOICES_UPDATE,
    remove: PERMISSIONS.FINANCE_INVOICES_DELETE,
    download: PERMISSIONS.FINANCE_INVOICES_DOWNLOAD,
  },
}


export function FinanceRecordDetailsPage({ kind }: { kind: FinanceKind }) {
  const { t } = useTranslation()
  const { recordId } = useParams()
  const entry = config[kind]
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const query = useQuery<FinanceRecordResponse>({
    queryKey: [entry.queryKey, recordId],
    queryFn: () => entry.get(recordId!) as Promise<FinanceRecordResponse>,
    enabled: Boolean(recordId),
  })
  const previewQuery = useQuery({ queryKey: ['merchant-invoices', recordId, 'preview'], queryFn: () => getMerchantInvoicePreview(recordId!), enabled: kind === 'invoices' && Boolean(recordId) })
    
  const deleteMutation = useMutation({
    mutationFn: () => entry.remove(recordId!),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [entry.queryKey] })
      navigate(entry.back)
    },
  })
  const downloadMutation = useMutation({
    mutationFn: () => downloadMerchantInvoice(recordId!),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `invoice-${recordId}.pdf`
      link.click()
      URL.revokeObjectURL(url)
    },
  })
  const verifyCashClosureMutation = useMutation({
    mutationFn: () => verifyDriverCashClosure(recordId!),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['driver-cash-closures'] }),
        queryClient.invalidateQueries({ queryKey: ['driver-manifests'] }),
        queryClient.invalidateQueries({ queryKey: ['finance-reports'] }),
        queryClient.invalidateQueries({ queryKey: ['treasury'] }),
      ])
    },
  })

  if (query.isLoading) {
    return <LoadingState title={t('Loading {{title}}', {
      title: t(entry.title, { defaultValue: entry.title }).toLowerCase(),
      defaultValue: `Loading ${entry.title.toLowerCase()}`,
    })} />
  }
  if (query.isError || !query.data) return <ErrorState message={getApiErrorMessage(query.error)} />

  const record = query.data.data
  const permissions = actionPermissions[kind]

  return (
    <section className="page-section">
      <PageHeader
        title={t(entry.title, { defaultValue: entry.title })}
        description={record.invoice_number ?? record.merchant_name ?? record.driver_name ?? record.category ?? `#${record.id}`}
        actions={(
          <div className="page-header__button-row">
            {kind === 'cash-closures' && record.status === 'pending' ? (
              <Can permission={PERMISSIONS.DRIVER_CASH_CLOSURES_VERIFY}>
                <Button
                  loading={verifyCashClosureMutation.isPending}
                  onClick={() => {
                    if (window.confirm(t('Verify this cash closure and sync it to treasury?', {
                      defaultValue: 'Verify this cash closure and sync it to treasury?',
                    }))) {
                      verifyCashClosureMutation.mutate()
                    }
                  }}
                >
                  {t('Verify', { defaultValue: 'Verify' })}
                </Button>
              </Can>
            ) : null}
            <Can permission={permissions.update}>
              <Link className="ui-link-reset" to={`${entry.back}/${record.id}/edit`}>
                <Button variant="secondary">{t('Edit')}</Button>
              </Link>
            </Can>
            {kind === 'invoices' && permissions.download ? (
              <Can permission={permissions.download}>
                <Button variant="secondary" loading={downloadMutation.isPending} onClick={() => downloadMutation.mutate()}>
                  {t('Download')}
                </Button>
              </Can>
            ) : null}
            <Can permission={permissions.remove}>
              <Button
                variant="danger"
                loading={deleteMutation.isPending}
                onClick={() => {
                  if (window.confirm(t('Delete this record?', { defaultValue: 'Delete this record?' }))) {
                    deleteMutation.mutate()
                  }
                }}
              >
                {t('Delete')}
              </Button>
            </Can>
            <Link className="ui-link-reset" to={entry.back}>
              <Button variant="secondary">{t('Back')}</Button>
            </Link>
          </div>
        )}
      />
      {deleteMutation.error ? <div className="form-error">{getApiErrorMessage(deleteMutation.error)}</div> : null}
      {downloadMutation.error ? <div className="form-error">{getApiErrorMessage(downloadMutation.error)}</div> : null}
      {verifyCashClosureMutation.error ? <div className="form-error">{getApiErrorMessage(verifyCashClosureMutation.error)}</div> : null}
      <Card>
        <CardHeader><CardTitle>{t('Details')}</CardTitle></CardHeader>
        <CardContent>
          <dl className="detail-list">
            {Object.entries(record)
              .filter(([, value]) => typeof value !== 'object')
              .map(([key, value]) => (
                <div key={key}>
                  <dt>{labelize(key, t)}</dt>
                  <dd>{formatValue(key, value)}</dd>
                </div>
              ))}
          </dl>
        </CardContent>
      </Card>
      {kind === 'invoices' && previewQuery.data ? (
        <Card>
          <CardHeader><CardTitle>{t('Invoice Preview', { defaultValue: 'Invoice Preview' })}</CardTitle></CardHeader>
          <CardContent>
            <div className="stats-grid">
              <div className="insight-tile"><span className="eyebrow">{t('Total COD', { defaultValue: 'Total COD' })}</span><strong>{formatMoney(previewQuery.data.data.totals.total_cod)}</strong></div>
              <div className="insight-tile"><span className="eyebrow">{t('Shipping Fees', { defaultValue: 'Shipping Fees' })}</span><strong>{formatMoney(previewQuery.data.data.totals.total_shipping_fees)}</strong></div>
              <div className="insight-tile"><span className="eyebrow">{t('Warehouse Charges', { defaultValue: 'Warehouse Charges' })}</span><strong>{formatMoney(previewQuery.data.data.totals.total_warehouse_charges)}</strong></div>
              <div className="insight-tile"><span className="eyebrow">{t('Payable', { defaultValue: 'Payable' })}</span><strong>{formatMoney(previewQuery.data.data.totals.total_payable)}</strong></div>
            </div>
            <TableContainer>
              <Table variant="compact">
                <thead>
                  <tr>
                    <TableHead>{t('Shipment', { defaultValue: 'Shipment' })}</TableHead>
                    <TableHead>{t('Customer')}</TableHead>
                    <TableHead>{t('COD')}</TableHead>
                    <TableHead>{t('Delivered', { defaultValue: 'Delivered' })}</TableHead>
                  </tr>
                </thead>
                <tbody>
                  {previewQuery.data.data.shipments.map((shipment) => (
                    <tr key={shipment.shipment_id}>
                      <TableCell>{shipment.shipment_number}</TableCell>
                      <TableCell>{shipment.customer_name}</TableCell>
                      <TableCell>{formatMoney(shipment.cod_amount)}</TableCell>
                      <TableCell>{formatDate(shipment.delivered_at)}</TableCell>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      ) : null}
      
      {kind === 'expenses' ? <Attachments attachableType="expenses" attachableId={record.id} /> : null}
      {kind === 'invoices' ? <Attachments attachableType="merchant_invoices" attachableId={record.id} /> : null}
    </section>
  )
}

function formatValue(key: string, value: unknown) {
  if (value == null) return '-'
  if (
    key === 'status'
    || key === 'type'
    || key === 'direction'
    || key === 'source_type'
    || key === 'transaction_type'
    || key === 'payment_type'
    || key === 'fulfillment_type'
    || key === 'condition'
    || key.endsWith('_status')
  ) {
    return <StatusBadge value={String(value)} />
  }
  if (key.includes('amount') || key.includes('total')) return formatMoney(String(value))
  if (key.includes('_at') || key.includes('date')) return formatDate(String(value))
  return String(value)
}

function labelize(
  value: string,
  t: (key: string, options?: Record<string, unknown>) => string,
) {
  const label = value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
  return t(label, { defaultValue: label })
}
