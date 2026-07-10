import { useQuery, useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Download, FileText, CheckCircle2 } from 'lucide-react'
import { getApiErrorMessage } from '../../../../shared/api/api-error'
import { ErrorState } from '../../../../shared/components/states/ErrorState'
import { LoadingState } from '../../../../shared/components/states/LoadingState'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../shared/components/ui/Card'
import { PageHeader } from '../../../../shared/components/ui/PageHeader'
import { merchantPath } from '../../../../shared/routing/paths'
import { formatDate } from '../../../../shared/utils/formatters'
import { getMerchantPortalInvoice, downloadMerchantPortalInvoice, previewMerchantPortalInvoice } from '../api/merchantPortalFinance.api'
import { MoneyDisplay } from '../../../../shared/components/ui/MoneyDisplay'
import { StatusBadge } from '../../../../shared/components/ui/StatusBadge'
import { Button } from '../../../../shared/components/ui/Button'
import { CanMerchant } from '../../components/CanMerchant'
import { LabelDocumentDialog } from '../../../../shared/components/labels/LabelDocumentDialog'
import { useState } from 'react'

export function MerchantInvoiceDetailsPage() {
  const { t } = useTranslation()
  const { invoiceId } = useParams<{ invoiceId: string }>()

  const [previewOpen, setPreviewOpen] = useState(false)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['merchant-portal', 'invoice', invoiceId],
    queryFn: () => getMerchantPortalInvoice(invoiceId!),
    enabled: !!invoiceId,
  })

  const { mutate: downloadInvoice, isPending: isDownloading } = useMutation({
    mutationFn: (id: string | number) => downloadMerchantPortalInvoice(id),
    onSuccess: (data, id) => {
      const url = window.URL.createObjectURL(new Blob([data as any]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `invoice-${id}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.parentNode?.removeChild(link)
    },
  })

  if (isLoading) {
    return <LoadingState title={t('Loading invoice details...')} />
  }

  if (isError) {
    return (
      <ErrorState
        actions={
          <Link to={merchantPath('/finance/invoices')} className="btn btn-secondary">
            {t('Back to Invoices')}
          </Link>
        }
        message={getApiErrorMessage(error, t('Failed to load invoice details.'))}
        onRetry={refetch}
      />
    )
  }

  if (!data?.data) {
    return (
      <ErrorState
        actions={
          <Link to={merchantPath('/finance/invoices')} className="btn btn-secondary">
            {t('Back to Invoices')}
          </Link>
        }
        message={t('Invoice not found.')}
      />
    )
  }

  const invoice = data.data

  return (
    <>
      <div className="mb-4">
        <Link
          className="inline-flex items-center text-sm text-muted hover:text-foreground"
          to={merchantPath('/finance/invoices')}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          {t('Back to Invoices')}
        </Link>
      </div>

      <PageHeader
        description={t('Detailed view of your invoice.')}
        title={`${t('Invoice')} #${invoice.invoice_number || invoice.number}`}
        actions={
          <div className="flex gap-2">
            <CanMerchant capability="invoices.download">
              <Button 
                variant="secondary"
                onClick={() => setPreviewOpen(true)}
              >
                <FileText className="mr-2 h-4 w-4" />
                {t('Preview')}
              </Button>
              <Button 
                variant="primary"
                onClick={() => downloadInvoice(invoice.id)}
                disabled={isDownloading}
              >
                <Download className="mr-2 h-4 w-4" />
                {t('Download PDF')}
              </Button>
            </CanMerchant>
          </div>
        }
      />

      {previewOpen && (
        <LabelDocumentDialog
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          request={{
            referenceId: invoice.id as number,
            type: 'invoice',
            fetchDocument: previewMerchantPortalInvoice,
          }}
          title={`${t('Invoice')} #${invoice.invoice_number || invoice.number}`}
        />
      )}

      <div className="mb-6">
        <StatusBadge value={invoice.status} />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle2 className="mr-2 h-5 w-5 text-muted" />
                {t('Invoice Summary')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-6">
                <div>
                  <dt className="text-sm font-medium text-muted">{t('Invoice Number')}</dt>
                  <dd className="mt-1 text-sm font-medium">{invoice.invoice_number || invoice.number}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted">{t('Total Amount')}</dt>
                  <dd className="mt-1 text-lg font-bold">
                    <MoneyDisplay amount={invoice.total_amount} currency={invoice.currency} />
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted">{t('Issue Date')}</dt>
                  <dd className="mt-1 text-sm">{formatDate(invoice.issue_date)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted">{t('Due Date')}</dt>
                  <dd className="mt-1 text-sm">{formatDate(invoice.due_date)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted">{t('Paid Amount')}</dt>
                  <dd className="mt-1 text-sm text-success">
                    {invoice.paid_amount !== undefined ? <MoneyDisplay amount={invoice.paid_amount} currency={invoice.currency} /> : '-'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted">{t('Remaining Amount')}</dt>
                  <dd className="mt-1 text-sm text-destructive font-medium">
                    {invoice.remaining_amount !== undefined ? <MoneyDisplay amount={invoice.remaining_amount} currency={invoice.currency} /> : '-'}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {invoice.items && invoice.items.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('Invoice Items')}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border-t border-border">
                    <thead className="bg-muted text-muted-foreground uppercase">
                      <tr>
                        <th className="px-6 py-3 font-medium">{t('Description')}</th>
                        <th className="px-6 py-3 font-medium text-right">{t('Unit Price')}</th>
                        <th className="px-6 py-3 font-medium text-right">{t('Qty')}</th>
                        <th className="px-6 py-3 font-medium text-right">{t('Total')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.items.map((item) => (
                        <tr key={item.id} className="border-b border-border/50">
                          <td className="px-6 py-4">{item.description}</td>
                          <td className="px-6 py-4 text-right">
                            <MoneyDisplay amount={item.amount} currency={invoice.currency} />
                          </td>
                          <td className="px-6 py-4 text-right">{item.quantity}</td>
                          <td className="px-6 py-4 text-right font-medium">
                            <MoneyDisplay amount={item.total} currency={invoice.currency} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  )
}
