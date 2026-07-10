import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Ban, Calendar, Clock, MapPin, Package, ClipboardList } from 'lucide-react'
import { getApiErrorMessage } from '../../../../shared/api/api-error'
import { ErrorState } from '../../../../shared/components/states/ErrorState'
import { LoadingState } from '../../../../shared/components/states/LoadingState'
import { Button } from '../../../../shared/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../shared/components/ui/Card'
import { PageHeader } from '../../../../shared/components/ui/PageHeader'
import { StatusBadge } from '../../../../shared/components/ui/StatusBadge'
import { Table, TableCell, TableContainer, TableHead } from '../../../../shared/components/ui/Table'
import { merchantPath } from '../../../../shared/routing/paths'
import { formatDate } from '../../../../shared/utils/formatters'
import { CanMerchant } from '../../components/CanMerchant'
import {
  getMerchantPortalInboundRequest,
  cancelMerchantPortalInboundRequest,
} from '../api/merchantPortalWarehouse.api'
import { Timeline } from '../../../../shared/components/timeline/Timeline'
import type { TimelineItem } from '../../../../shared/components/timeline/Timeline'
import { ConfirmActionModal } from '../../../../shared/components/modals/ConfirmActionModal'
import { useState } from 'react'

export function MerchantInboundRequestDetailsPage() {
  const { t } = useTranslation()
  const { inboundRequestId } = useParams<{ inboundRequestId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['merchant-portal', 'inbound-request', inboundRequestId],
    queryFn: () => getMerchantPortalInboundRequest(inboundRequestId!),
    enabled: !!inboundRequestId,
  })

  const cancelMutation = useMutation({
    mutationFn: () => cancelMerchantPortalInboundRequest(inboundRequestId!),
    onSuccess: () => {
      // toast.success(t('Inbound request cancelled successfully.'))
      queryClient.invalidateQueries({ queryKey: ['merchant-portal', 'inbound-request', inboundRequestId] })
      setIsCancelModalOpen(false)
    },
    onError: (err) => {
      console.error(getApiErrorMessage(err, t('Failed to cancel inbound request.')))
    },
  })

  if (isLoading) {
    return <LoadingState title={t('Loading inbound request details...')} />
  }

  if (isError) {
    return (
      <ErrorState
        actions={
          <Button variant="secondary" onClick={() => navigate(merchantPath('/warehouse/inbound-requests'))}>
            {t('Back to Inbound Requests')}
          </Button>
        }
        message={getApiErrorMessage(error, t('Failed to load inbound request details.'))}
        onRetry={refetch}
      />
    )
  }

  if (!data?.data) {
    return (
      <ErrorState
        actions={
          <Button variant="secondary" onClick={() => navigate(merchantPath('/warehouse/inbound-requests'))}>
            {t('Back to Inbound Requests')}
          </Button>
        }
        message={t('Inbound request not found.')}
      />
    )
  }

  const request = data.data

  const isCancellable = request.status === 'draft' || request.status === 'submitted'

  return (
    <>
      <div className="mb-4">
        <Link
          className="inline-flex items-center text-sm text-muted hover:text-foreground"
          to={merchantPath('/warehouse/inbound-requests')}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          {t('Back to Inbound Requests')}
        </Link>
      </div>

      <PageHeader
        actions={
          <CanMerchant capability="warehouse.inbound_requests.cancel">
            {isCancellable && (
              <Button variant="danger" onClick={() => setIsCancelModalOpen(true)}>
                <Ban className="mr-2 h-4 w-4" />
                {t('Cancel Request')}
              </Button>
            )}
          </CanMerchant>
        }
        description={t('Detailed view of your inbound stock request.')}
        title={request.request_number}
      />
      <div className="mb-6">
        <StatusBadge value={request.status}>
          {request.status_label || request.status}
        </StatusBadge>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ClipboardList className="mr-2 h-5 w-5 text-muted" />
                {t('Request Details')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-muted">{t('Warehouse')}</dt>
                  <dd className="mt-1 text-sm font-medium text-foreground">{request.warehouse_summary?.name || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted">{t('Expected Arrival Date')}</dt>
                  <dd className="mt-1 text-sm text-foreground">{formatDate(request.expected_arrival_date) || '-'}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-muted">{t('Notes')}</dt>
                  <dd className="mt-1 text-sm text-foreground whitespace-pre-wrap">{request.notes || '-'}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center">
                <Package className="mr-2 h-5 w-5 text-muted" />
                {t('Items')}
              </CardTitle>
              <div className="text-sm text-muted">
                {t('Total Requested: {{count}}', { count: request.total_requested_quantity })}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <TableContainer>
                <Table>
                  <thead>
                    <tr>
                      <TableHead>{t('Product')}</TableHead>
                      <TableHead>{t('SKU')}</TableHead>
                      <TableHead className="text-right">{t('Requested')}</TableHead>
                      <TableHead className="text-right">{t('Received')}</TableHead>
                      <TableHead>{t('Status')}</TableHead>
                    </tr>
                  </thead>
                  <tbody>
                    {request.items?.map((item) => (
                      <tr key={item.id}>
                        <TableCell>
                          {item.product_summary?.id ? (
                            <Link
                              className="text-primary hover:underline font-medium"
                              to={merchantPath(`/warehouse/products/${item.product_summary.id}`)}
                            >
                              {item.product_summary.name}
                            </Link>
                          ) : (
                            <span className="font-medium text-foreground">
                              {item.requested_product_name || '-'}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="font-mono text-sm text-foreground">
                            {item.product_summary?.sku || item.requested_sku || '-'}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="text-right text-success font-medium">
                          {item.received_quantity}
                        </TableCell>
                        <TableCell>
                          <StatusBadge value={item.status} />
                        </TableCell>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="mr-2 h-5 w-5 text-muted" />
                {t('Timeline')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Timeline
                items={[
                  {
                    id: 'created',
                    title: t('Request Created'),
                    description: t('The inbound request was created.'),
                    timestamp: request.created_at,
                  },
                  ...(request.submitted_at ? [{
                    id: 'submitted',
                    title: t('Request Submitted'),
                    description: t('The inbound request was submitted for processing.'),
                    timestamp: request.submitted_at,
                  }] : []),
                  ...(request.closed_at ? [{
                    id: 'closed',
                    title: t('Request Closed'),
                    description: t('The inbound request has been closed.'),
                    timestamp: request.closed_at,
                  }] : []),
                  ...(request.cancelled_at ? [{
                    id: 'cancelled',
                    title: t('Request Cancelled'),
                    description: t('The inbound request was cancelled.'),
                    timestamp: request.cancelled_at,
                  }] : []),
                ]}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmActionModal
        confirmLabel={t('Cancel Request')}
        variant="destructive"
        description={t('Are you sure you want to cancel this inbound request? This action cannot be undone.')}
        open={isCancelModalOpen}
        loading={cancelMutation.isPending}
        title={t('Cancel Inbound Request')}
        onCancel={() => setIsCancelModalOpen(false)}
        onConfirm={() => cancelMutation.mutate()}
      />
    </>
  )
}
