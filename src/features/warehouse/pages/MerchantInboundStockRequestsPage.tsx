import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  approveMerchantInboundStockRequest,
  getMerchantInboundStockRequest,
  linkMerchantInboundStockRequestReceipt,
  listMerchantInboundStockRequests,
  rejectMerchantInboundStockRequestAction,
} from '../api/warehouse.api'
import type { MerchantInboundStockRequest } from '../types/warehouse.types'
import { getApiErrorMessage } from '../../../shared/api/api-error'
import { PERMISSIONS } from '../../../shared/auth/permission-keys'
import { Can } from '../../../shared/auth/Can'
import { ResourceListPage } from '../../../shared/components/data/ResourceListPage'
import { ApiFilterBar, compactFilters } from '../../../shared/components/data/ApiFilterBar'
import { FieldError } from '../../../shared/components/forms/FieldError'
import { EmptyState } from '../../../shared/components/states/EmptyState'
import { ErrorState } from '../../../shared/components/states/ErrorState'
import { LoadingState } from '../../../shared/components/states/LoadingState'
import { Button } from '../../../shared/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/Card'
import { Dialog } from '../../../shared/components/ui/Dialog'
import { Input } from '../../../shared/components/ui/Input'
import { StatusBadge } from '../../../shared/components/ui/StatusBadge'
import { Table, TableCell, TableContainer, TableHead } from '../../../shared/components/ui/Table'
import { useFormApiErrors } from '../../../shared/hooks/useFormApiErrors'
import { pickDisplayLabel } from '../../../shared/i18n/locale'
import { formatDate } from '../../../shared/utils/formatters'

type InboundFilters = {
  merchant_id: string
  warehouse_id: string
  status: string
}

type ActionFormValues = {
  rejection_reason: string
  warehouse_receipt_id: number
  notes: string
}

const initialFilters: InboundFilters = {
  merchant_id: '',
  warehouse_id: '',
  status: '',
}

function InboundActionDialog({
  action,
  error,
  isSubmitting,
  onClose,
  onSubmit,
  open,
}: {
  action: 'approve' | 'reject' | 'link'
  error?: unknown
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (values: ActionFormValues) => void
  open: boolean
}) {
  const { t } = useTranslation()
  const { formError, getFieldError } = useFormApiErrors(error)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ActionFormValues>({
    defaultValues: {
      rejection_reason: '',
      warehouse_receipt_id: 0,
      notes: '',
    },
  })

  return (
    <Dialog open={open} onClose={() => { reset(); onClose() }} title={<CardTitle>{action === 'approve' ? t('Approve Request', { defaultValue: 'Approve Request' }) : action === 'reject' ? t('Reject Request', { defaultValue: 'Reject Request' }) : t('Link Receipt', { defaultValue: 'Link Receipt' })}</CardTitle>}>
      <form className="form-grid" onSubmit={handleSubmit(onSubmit)}>
        {action === 'reject' ? (
          <label className="field">
            <span>{t('Rejection Reason', { defaultValue: 'Rejection Reason' })}</span>
            <Input {...register('rejection_reason')} />
            <FieldError error={errors.rejection_reason?.message ?? getFieldError('rejection_reason')} />
          </label>
        ) : null}
        {action === 'link' ? (
          <label className="field">
            <span>{t('Warehouse Receipt ID', { defaultValue: 'Warehouse Receipt ID' })}</span>
            <Input type="number" {...register('warehouse_receipt_id', { valueAsNumber: true })} />
            <FieldError error={errors.warehouse_receipt_id?.message ?? getFieldError('warehouse_receipt_id')} />
          </label>
        ) : null}
        <label className="field">
          <span>{t('Notes')}</span>
          <Input {...register('notes')} />
          <FieldError error={errors.notes?.message ?? getFieldError('notes')} />
        </label>
        {formError ? <div className="form-error">{formError}</div> : null}
        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t('Cancel')}
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {action === 'approve' ? t('Approve', { defaultValue: 'Approve' }) : action === 'reject' ? t('Reject', { defaultValue: 'Reject' }) : t('Link Receipt', { defaultValue: 'Link Receipt' })}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

export function MerchantInboundStockRequestsPage() {
  const { t } = useTranslation()
  const [filters, setFilters] = useState(initialFilters)
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null)
  const [pendingAction, setPendingAction] = useState<'approve' | 'reject' | 'link' | null>(null)
  const params = compactFilters(filters)
  const queryClient = useQueryClient()
  const detailsQuery = useQuery({
    queryKey: ['merchant-inbound-stock-requests', selectedRequestId],
    queryFn: () => getMerchantInboundStockRequest(selectedRequestId!),
    enabled: Boolean(selectedRequestId),
  })
  const actionMutation = useMutation({
    mutationFn: ({ action, requestId, values }: { action: 'approve' | 'reject' | 'link'; requestId: number; values: ActionFormValues }) => {
      switch (action) {
        case 'approve':
          return approveMerchantInboundStockRequest(requestId, {
            notes: values.notes || undefined,
          })
        case 'reject':
          return rejectMerchantInboundStockRequestAction(requestId, {
            notes: values.notes || undefined,
            rejection_reason: values.rejection_reason,
          })
        case 'link':
          return linkMerchantInboundStockRequestReceipt(requestId, {
            notes: values.notes || undefined,
            warehouse_receipt_id: values.warehouse_receipt_id,
          })
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['merchant-inbound-stock-requests'] })
      if (selectedRequestId) {
        await detailsQuery.refetch()
      }
      setPendingAction(null)
    },
  })

  return (
    <>
      <ResourceListPage<MerchantInboundStockRequest>
        title={t('Inbound Stock Requests', { defaultValue: 'Inbound Stock Requests' })}
        description={t('Admin review for merchant inbound stock requests before warehouse receipt confirmation.', { defaultValue: 'Admin review for merchant inbound stock requests before warehouse receipt confirmation.' })}
        queryKey={['merchant-inbound-stock-requests', params]}
        queryFn={() => listMerchantInboundStockRequests(params)}
        filters={(
          <ApiFilterBar
            filters={filters}
            fields={[
              { label: t('Merchant ID', { defaultValue: 'Merchant ID' }), name: 'merchant_id', type: 'number' },
              { label: t('Warehouse ID', { defaultValue: 'Warehouse ID' }), name: 'warehouse_id', type: 'number' },
              { label: t('Status'), name: 'status', type: 'select', options: [{ label: t('pending', { defaultValue: 'pending' }), value: 'pending' }, { label: t('approved', { defaultValue: 'approved' }), value: 'approved' }, { label: t('rejected', { defaultValue: 'rejected' }), value: 'rejected' }, { label: t('received', { defaultValue: 'received' }), value: 'received' }, { label: t('partially_received', { defaultValue: 'partially_received' }), value: 'partially_received' }] },
            ]}
            onChange={(name, value) => setFilters((current) => ({ ...current, [name]: value }))}
            onReset={() => setFilters(initialFilters)}
          />
        )}
        columns={[
          { header: t('Request', { defaultValue: 'Request' }), render: (request) => <Button variant="ghost" onClick={() => setSelectedRequestId(request.id)}>{request.request_number ?? t('Request #{{id}}', { id: request.id, defaultValue: `Request #${request.id}` })}</Button> },
          { header: t('Merchant'), render: (request) => request.merchant_name ?? request.merchant_id },
          { header: t('Warehouse'), render: (request) => request.warehouse_name ?? '-' },
          { header: t('Status'), render: (request) => <StatusBadge value={request.status}>{pickDisplayLabel(request.status, request.status_label)}</StatusBadge> },
          { header: t('Linked Receipt', { defaultValue: 'Linked Receipt' }), render: (request) => request.linked_warehouse_receipt_number ?? '-' },
          { header: t('Created'), render: (request) => formatDate(request.created_at) },
          {
            header: t('Actions'),
            render: (request) => (
              <div className="page-header__button-row">
                <Can permission={PERMISSIONS.MERCHANT_INBOUND_REQUESTS_MANAGE}>
                  <Button type="button" variant="secondary" onClick={() => { setSelectedRequestId(request.id); setPendingAction('approve') }}>
                    {t('Approve', { defaultValue: 'Approve' })}
                  </Button>
                </Can>
                <Can permission={PERMISSIONS.MERCHANT_INBOUND_REQUESTS_MANAGE}>
                  <Button type="button" variant="danger" onClick={() => { setSelectedRequestId(request.id); setPendingAction('reject') }}>
                    {t('Reject', { defaultValue: 'Reject' })}
                  </Button>
                </Can>
                <Can permission={PERMISSIONS.MERCHANT_INBOUND_REQUESTS_MANAGE}>
                  <Button type="button" variant="secondary" onClick={() => { setSelectedRequestId(request.id); setPendingAction('link') }}>
                    {t('Link Receipt', { defaultValue: 'Link Receipt' })}
                  </Button>
                </Can>
              </div>
            ),
          },
        ]}
      />

      <Dialog open={Boolean(selectedRequestId)} onClose={() => setSelectedRequestId(null)} title={<CardTitle>{t('Inbound Request Details', { defaultValue: 'Inbound Request Details' })}</CardTitle>}>
        {detailsQuery.isLoading ? <LoadingState title={t('Loading inbound request', { defaultValue: 'Loading inbound request' })} /> : null}
        {detailsQuery.isError ? <ErrorState message={getApiErrorMessage(detailsQuery.error)} onRetry={() => void detailsQuery.refetch()} /> : null}
        {detailsQuery.data ? (
          <div className="page-stack">
            <Card>
              <CardHeader>
                <CardTitle>{detailsQuery.data.data.request_number ?? t('Request #{{id}}', { id: detailsQuery.data.data.id, defaultValue: `Request #${detailsQuery.data.data.id}` })}</CardTitle>
                <CardDescription>
                  {t('Inbound request creation does not increase stock. Only confirmed warehouse receipts increase stock.', { defaultValue: 'Inbound request creation does not increase stock. Only confirmed warehouse receipts increase stock.' })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="detail-list">
                  <div><dt>{t('Merchant')}</dt><dd>{detailsQuery.data.data.merchant_name ?? detailsQuery.data.data.merchant_id}</dd></div>
                  <div><dt>{t('Warehouse')}</dt><dd>{detailsQuery.data.data.warehouse_name ?? '-'}</dd></div>
                  <div><dt>{t('Status')}</dt><dd><StatusBadge value={detailsQuery.data.data.status}>{pickDisplayLabel(detailsQuery.data.data.status, detailsQuery.data.data.status_label)}</StatusBadge></dd></div>
                  <div><dt>{t('Linked Receipt', { defaultValue: 'Linked Receipt' })}</dt><dd>{detailsQuery.data.data.linked_warehouse_receipt_number ?? '-'}</dd></div>
                  <div><dt>{t('Rejection Reason', { defaultValue: 'Rejection Reason' })}</dt><dd>{detailsQuery.data.data.rejection_reason ?? '-'}</dd></div>
                  <div><dt>{t('Notes')}</dt><dd>{detailsQuery.data.data.notes ?? '-'}</dd></div>
                </dl>
              </CardContent>
            </Card>

            {detailsQuery.data.data.items?.length ? (
              <Card>
                <CardHeader>
                  <CardTitle>{t('Request Items', { defaultValue: 'Request Items' })}</CardTitle>
                </CardHeader>
                <CardContent>
                  <TableContainer>
                    <Table variant="compact">
                      <thead>
                        <tr>
                          <TableHead>{t('Product')}</TableHead>
                          <TableHead>{t('SKU', { defaultValue: 'SKU' })}</TableHead>
                          <TableHead>{t('Requested', { defaultValue: 'Requested' })}</TableHead>
                          <TableHead>{t('Approved', { defaultValue: 'Approved' })}</TableHead>
                          <TableHead>{t('Received', { defaultValue: 'Received' })}</TableHead>
                        </tr>
                      </thead>
                      <tbody>
                        {detailsQuery.data.data.items.map((item, index) => (
                          <tr key={`${detailsQuery.data?.data.id}-${item.id ?? index}`}>
                            <TableCell>{item.product_name ?? item.warehouse_product_id ?? '-'}</TableCell>
                            <TableCell>{item.sku ?? '-'}</TableCell>
                            <TableCell>{item.requested_quantity ?? '-'}</TableCell>
                            <TableCell>{item.approved_quantity ?? '-'}</TableCell>
                            <TableCell>{item.received_quantity ?? '-'}</TableCell>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            ) : (
              <EmptyState title={t('No inbound request items', { defaultValue: 'No inbound request items' })} description={t('The backend did not return any request items.', { defaultValue: 'The backend did not return any request items.' })} />
            )}
          </div>
        ) : null}
      </Dialog>

      {selectedRequestId && pendingAction ? (
        <InboundActionDialog
          action={pendingAction}
          error={actionMutation.error}
          isSubmitting={actionMutation.isPending}
          onClose={() => setPendingAction(null)}
          onSubmit={(values) => actionMutation.mutate({ action: pendingAction, requestId: selectedRequestId, values })}
          open={Boolean(pendingAction)}
        />
      ) : null}
    </>
  )
}
