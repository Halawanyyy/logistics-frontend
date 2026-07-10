import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import { Download } from 'lucide-react'
import { getApiErrorMessage } from '../../../../shared/api/api-error'
import { EmptyState } from '../../../../shared/components/states/EmptyState'
import { ErrorState } from '../../../../shared/components/states/ErrorState'
import { LoadingState } from '../../../../shared/components/states/LoadingState'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../shared/components/ui/Card'
import { Input } from '../../../../shared/components/ui/Input'
import { PageHeader } from '../../../../shared/components/ui/PageHeader'
import { Select } from '../../../../shared/components/ui/Select'
import { Table, TableCell, TableContainer, TableHead } from '../../../../shared/components/ui/Table'
import { StatusBadge } from '../../../../shared/components/ui/StatusBadge'
import { Button } from '../../../../shared/components/ui/Button'
import { merchantPath } from '../../../../shared/routing/paths'
import { formatDate } from '../../../../shared/utils/formatters'
import { listMerchantPortalInvoices, downloadMerchantPortalInvoice } from '../api/merchantPortalFinance.api'
import type { MerchantInvoiceFilters } from '../types/merchantPortalFinance.types'
import { MoneyDisplay } from '../../../../shared/components/ui/MoneyDisplay'
import { CanMerchant } from '../../components/CanMerchant'
import { useMutation } from '@tanstack/react-query'

const initialFilters: MerchantInvoiceFilters = {
  search: '',
  invoice_number: '',
  status: '',
  date_from: '',
  date_to: '',
}

export function MerchantInvoicesPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const searchText = searchParams.get('search') ?? ''

  const [filters, setFilters] = useState<MerchantInvoiceFilters>(() => ({
    ...initialFilters,
    search: searchText,
  }))
  const [page, setPage] = useState(1)

  const params = useMemo(() => ({
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.invoice_number ? { invoice_number: filters.invoice_number } : {}),
    ...(filters.date_from ? { date_from: filters.date_from } : {}),
    ...(filters.date_to ? { date_to: filters.date_to } : {}),
    ...(filters.search ? { search: filters.search } : {}),
  }), [filters])

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['merchant-portal', 'invoices', page, params],
    queryFn: () => listMerchantPortalInvoices(page, params),
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

  function handleClearFilters() {
    setFilters({ ...initialFilters })
    setPage(1)
  }

  const hasActiveFilters = Object.values(filters).some((value) => Boolean(value))

  function renderContent() {
    if (isLoading) {
      return <LoadingState title={t('Loading invoices...')} />
    }

    if (isError) {
      return (
        <ErrorState
          message={getApiErrorMessage(error, t('Failed to load invoices.'))}
          onRetry={refetch}
        />
      )
    }

    if (!data?.data || data.data.length === 0) {
      if (hasActiveFilters) {
        return (
          <EmptyState
            description={t('No invoices match your current filters.')}
            title={t('No results found')}
            actionLabel={t('Clear filters')}
            onAction={handleClearFilters}
          />
        )
      }

      return (
        <EmptyState
          description={t('You have no invoices.')}
          title={t('No invoices')}
        />
      )
    }

    return (
      <TableContainer>
        <Table>
          <thead>
            <tr>
              <TableHead>{t('Invoice Number')}</TableHead>
              <TableHead>{t('Issue Date')}</TableHead>
              <TableHead>{t('Due Date')}</TableHead>
              <TableHead className="text-right">{t('Total Amount')}</TableHead>
              <TableHead>{t('Status')}</TableHead>
              <TableHead className="text-right">{t('Actions')}</TableHead>
            </tr>
          </thead>
          <tbody>
            {data.data.map((invoice) => (
              <tr key={invoice.id}>
                <TableCell className="whitespace-nowrap font-medium">{invoice.invoice_number || invoice.number}</TableCell>
                <TableCell>{formatDate(invoice.issue_date)}</TableCell>
                <TableCell>{formatDate(invoice.due_date)}</TableCell>
                <TableCell className="text-right font-medium">
                  <MoneyDisplay amount={invoice.total_amount} currency={invoice.currency} />
                </TableCell>
                <TableCell>
                  <StatusBadge value={invoice.status} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <CanMerchant capability="invoices.view">
                      <Button variant="neutral" asChild size="sm">
                        <Link to={merchantPath(`/finance/invoices/${invoice.id}`)}>
                          {t('View')}
                        </Link>
                      </Button>
                    </CanMerchant>
                    <CanMerchant capability="invoices.download">
                      <Button 
                        variant="neutral" 
                        size="sm" 
                        onClick={() => downloadInvoice(invoice.id)}
                        disabled={isDownloading}
                        title={t('Download PDF')}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </CanMerchant>
                  </div>
                </TableCell>
              </tr>
            ))}
          </tbody>
        </Table>
      </TableContainer>
    )
  }

  return (
    <>
      <PageHeader
        description={t('View and download your invoices.')}
        title={t('Invoices')}
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">{t('Filters')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="form-group">
              <label className="form-label" htmlFor="search">
                {t('Search')}
              </label>
              <Input
                id="search"
                placeholder={t('Search...')}
                value={filters.search}
                onChange={(e) => {
                  setFilters((prev) => ({ ...prev, search: e.target.value }))
                  setPage(1)
                }}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="invoice_number">
                {t('Invoice Number')}
              </label>
              <Input
                id="invoice_number"
                placeholder={t('INV-0001')}
                value={filters.invoice_number}
                onChange={(e) => {
                  setFilters((prev) => ({ ...prev, invoice_number: e.target.value }))
                  setPage(1)
                }}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="status">
                {t('Status')}
              </label>
              <Select
                id="status"
                value={filters.status}
                onChange={(e) => {
                  setFilters((prev) => ({ ...prev, status: e.target.value }))
                  setPage(1)
                }}
              >
                <option value="">{t('All Statuses')}</option>
                <option value="draft">{t('Draft')}</option>
                <option value="issued">{t('Issued')}</option>
                <option value="paid">{t('Paid')}</option>
                <option value="cancelled">{t('Cancelled')}</option>
              </Select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="date_from">
                {t('Date From')}
              </label>
              <Input
                id="date_from"
                type="date"
                value={filters.date_from}
                onChange={(e) => {
                  setFilters((prev) => ({ ...prev, date_from: e.target.value }))
                  setPage(1)
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {renderContent()}
    </>
  )
}
