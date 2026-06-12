import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import {
  cancelWarehouseReceipt,
  confirmWarehouseReceipt,
  getWarehouseReceipt,
} from '../api/warehouse.api'
import { getApiErrorMessage, isApiNotFound } from '../../../shared/api/api-error'
import { ConfirmActionModal } from '../../../shared/components/modals/ConfirmActionModal'
import { EmptyState } from '../../../shared/components/states/EmptyState'
import { ErrorState } from '../../../shared/components/states/ErrorState'
import { LoadingState } from '../../../shared/components/states/LoadingState'
import { NotFoundState } from '../../../shared/components/states/NotFoundState'
import { Button } from '../../../shared/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/Card'
import { PageHeader } from '../../../shared/components/ui/PageHeader'
import { StatusBadge } from '../../../shared/components/ui/StatusBadge'
import { Table, TableCell, TableContainer, TableHead } from '../../../shared/components/ui/Table'
import { pickDisplayLabel } from '../../../shared/i18n/locale'
import { adminPath } from '../../../shared/routing/paths'
import { formatDate } from '../../../shared/utils/formatters'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

export function WarehouseReceiptDetailsPage() {
  const { t } = useTranslation()
  const { receiptId } = useParams()
  const [pendingAction, setPendingAction] = useState<'confirm' | 'cancel' | null>(null)
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: ['warehouse-receipts', receiptId],
    queryFn: () => getWarehouseReceipt(receiptId!),
    enabled: Boolean(receiptId),
  })
  const actionMutation = useMutation({
    mutationFn: (kind: 'confirm' | 'cancel') => (
      kind === 'confirm'
        ? confirmWarehouseReceipt(receiptId!)
        : cancelWarehouseReceipt(receiptId!)
    ),
    onSuccess: async () => {
      setPendingAction(null)
      await queryClient.invalidateQueries({ queryKey: ['warehouse-receipts'] })
      await query.refetch()
    },
  })

  if (query.isLoading) {
    return <LoadingState title={t('Loading warehouse receipt')} />
  }

  if (query.isError && isApiNotFound(query.error)) {
    return <NotFoundState title={t('Receipt not found')} description={t('This warehouse receipt could not be found.')} />
  }

  if (query.isError || !query.data) {
    return <ErrorState message={getApiErrorMessage(query.error)} onRetry={() => void query.refetch()} />
  }

  const receipt = query.data.data

  return (
    <section className="page-section">
      <PageHeader
        title={receipt.receipt_number ?? `Receipt #${receipt.id}`}
        description={t('Inbound merchant stock receipt details.')}
        actions={
          <div className="page-header__button-row">
            {receipt.status === 'draft' ? (
              <Button type="button" variant="secondary" onClick={() => setPendingAction('confirm')}>
                {t('Confirm')}
              </Button>
            ) : null}
            {receipt.status === 'draft' ? (
              <Button type="button" variant="danger" onClick={() => setPendingAction('cancel')}>
                {t('Cancel')}
              </Button>
            ) : null}
            <Link className="ui-link-reset" to={adminPath('/warehouse/receipts')}>
              <Button variant="secondary">{t('Back to Receipts')}</Button>
            </Link>
          </div>
        }
      />

      {actionMutation.error ? <div className="form-error">{getApiErrorMessage(actionMutation.error)}</div> : null}

      <div className="details-grid">
        <Card className="detail-card">
          <CardHeader>
            <CardTitle>{t('Overview')}</CardTitle>
            <CardDescription>{t('Receipt status and ownership details.')}</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="detail-list">
              <div><dt>{t('Merchant')}</dt><dd>{receipt.merchant_name ?? receipt.merchant_id}</dd></div>
              <div><dt>{t('Warehouse')}</dt><dd>{receipt.warehouse_name ?? receipt.warehouse_id}</dd></div>
              <div><dt>{t('Status')}</dt><dd><StatusBadge value={receipt.status}>{pickDisplayLabel(receipt.status, receipt.status_label)}</StatusBadge></dd></div>
              <div><dt>{t('Created By')}</dt><dd>{receipt.created_by_name ?? '-'}</dd></div>
              <div><dt>{t('Notes')}</dt><dd>{receipt.notes ?? '-'}</dd></div>
              <div><dt>{t('Created')}</dt><dd>{formatDate(receipt.created_at)}</dd></div>
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card className="table-card">
        <CardHeader>
          <CardTitle>{t('Receipt Items')}</CardTitle>
          <CardDescription>{t('Accepted quantities increase stock when the receipt is confirmed.')}</CardDescription>
        </CardHeader>
        <CardContent>
          {receipt.items.length ? (
            <TableContainer>
              <Table variant="compact">
                <thead>
                  <tr>
                    <TableHead>{t('Product')}</TableHead>
                    <TableHead>{t('SKU')}</TableHead>
                    <TableHead>{t('Quantity')}</TableHead>
                    <TableHead>{t('Accepted')}</TableHead>
                    <TableHead>{t('Rejected')}</TableHead>
                    <TableHead>{t('Condition')}</TableHead>
                    <TableHead>{t('Notes')}</TableHead>
                  </tr>
                </thead>
                <tbody>
                  {receipt.items.map((item, index) => (
                    <tr key={`${receipt.id}-${item.id ?? index}`}>
                      <TableCell>{item.product_name ?? item.warehouse_product_id}</TableCell>
                      <TableCell>{item.sku ?? '-'}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{item.accepted_quantity}</TableCell>
                      <TableCell>{item.rejected_quantity}</TableCell>
                      <TableCell>{item.condition ? t(item.condition) : '-'}</TableCell>
                      <TableCell>{item.notes ?? '-'}</TableCell>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableContainer>
          ) : (
            <EmptyState title={t('No receipt items')} description={t('This receipt did not return any item rows.')} />
          )}
        </CardContent>
      </Card>

      <ConfirmActionModal
        open={Boolean(pendingAction)}
        title={pendingAction === 'confirm' ? t('Confirm receipt') : t('Cancel receipt')}
        description={pendingAction ? t('{{action}} {{name}}?', { action: pendingAction === 'confirm' ? t('Confirm') : t('Cancel'), name: receipt.receipt_number ?? `receipt #${receipt.id}` }) : ''}
        confirmLabel={pendingAction === 'confirm' ? t('Confirm receipt') : t('Cancel receipt')}
        variant={pendingAction === 'confirm' ? 'default' : 'danger'}
        loading={actionMutation.isPending}
        onCancel={() => setPendingAction(null)}
        onConfirm={() => {
          if (pendingAction) {
            actionMutation.mutate(pendingAction)
          }
        }}
      />
    </section>
  )
}
