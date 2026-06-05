import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import {
  cancelWarehouseTransfer,
  confirmWarehouseTransfer,
  dispatchWarehouseTransfer,
  getWarehouseTransfer,
  receiveWarehouseTransfer,
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

export function WarehouseTransferDetailsPage() {
  const { transferId } = useParams()
  const [pendingAction, setPendingAction] = useState<'confirm' | 'dispatch' | 'receive' | 'cancel' | null>(null)
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: ['warehouse-transfers', transferId],
    queryFn: () => getWarehouseTransfer(transferId!),
    enabled: Boolean(transferId),
  })
  const actionMutation = useMutation({
    mutationFn: (kind: 'confirm' | 'dispatch' | 'receive' | 'cancel') => {
      switch (kind) {
        case 'confirm':
          return confirmWarehouseTransfer(transferId!)
        case 'dispatch':
          return dispatchWarehouseTransfer(transferId!)
        case 'receive':
          return receiveWarehouseTransfer(transferId!)
        case 'cancel':
          return cancelWarehouseTransfer(transferId!)
      }
    },
    onSuccess: async () => {
      setPendingAction(null)
      await queryClient.invalidateQueries({ queryKey: ['warehouse-transfers'] })
      await query.refetch()
    },
  })

  if (query.isLoading) {
    return <LoadingState title="Loading warehouse transfer" />
  }

  if (query.isError && isApiNotFound(query.error)) {
    return <NotFoundState title="Transfer not found" description="This warehouse transfer could not be found." />
  }

  if (query.isError || !query.data) {
    return <ErrorState message={getApiErrorMessage(query.error)} onRetry={() => void query.refetch()} />
  }

  const transfer = query.data.data

  return (
    <section className="page-section">
      <PageHeader
        title={transfer.transfer_number ?? `Transfer #${transfer.id}`}
        description="Warehouse transfer details and lifecycle actions."
        actions={
          <div className="page-header__button-row">
            {transfer.status === 'draft' ? <Button type="button" variant="secondary" onClick={() => setPendingAction('confirm')}>Confirm</Button> : null}
            {transfer.status === 'confirmed' ? <Button type="button" variant="secondary" onClick={() => setPendingAction('dispatch')}>Dispatch</Button> : null}
            {transfer.status === 'in_transit' ? <Button type="button" variant="secondary" onClick={() => setPendingAction('receive')}>Receive</Button> : null}
            {['draft', 'confirmed'].includes(transfer.status) ? <Button type="button" variant="danger" onClick={() => setPendingAction('cancel')}>Cancel</Button> : null}
            <Link className="ui-link-reset" to={adminPath('/warehouse/transfers')}>
              <Button variant="secondary">Back</Button>
            </Link>
          </div>
        }
      />

      {actionMutation.error ? <div className="form-error">{getApiErrorMessage(actionMutation.error)}</div> : null}

      <div className="details-grid">
        <Card className="detail-card">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>Source, destination, and workflow status.</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="detail-list">
              <div><dt>Source</dt><dd>{transfer.source_warehouse_name ?? transfer.source_warehouse_id}</dd></div>
              <div><dt>Destination</dt><dd>{transfer.destination_warehouse_name ?? transfer.destination_warehouse_id}</dd></div>
              <div><dt>Status</dt><dd><StatusBadge value={transfer.status}>{pickDisplayLabel(transfer.status, transfer.status_label)}</StatusBadge></dd></div>
              <div><dt>Created By</dt><dd>{transfer.created_by_name ?? '-'}</dd></div>
              <div><dt>Notes</dt><dd>{transfer.notes ?? '-'}</dd></div>
              <div><dt>Created</dt><dd>{formatDate(transfer.created_at)}</dd></div>
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card className="table-card">
        <CardHeader>
          <CardTitle>Transfer Items</CardTitle>
          <CardDescription>Source and destination stock context appears when the backend returns it.</CardDescription>
        </CardHeader>
        <CardContent>
          {transfer.items.length ? (
            <TableContainer>
              <Table variant="compact">
                <thead>
                  <tr>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Source Available</TableHead>
                    <TableHead>Destination Available</TableHead>
                    <TableHead>Notes</TableHead>
                  </tr>
                </thead>
                <tbody>
                  {transfer.items.map((item, index) => (
                    <tr key={`${transfer.id}-${item.id ?? index}`}>
                      <TableCell>{item.product_name ?? item.warehouse_product_id}</TableCell>
                      <TableCell>{item.sku ?? '-'}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{item.source_available_quantity ?? '-'}</TableCell>
                      <TableCell>{item.destination_available_quantity ?? '-'}</TableCell>
                      <TableCell>{item.notes ?? '-'}</TableCell>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableContainer>
          ) : (
            <EmptyState title="No transfer items" description="This transfer did not return any item rows." />
          )}
        </CardContent>
      </Card>

      <ConfirmActionModal
        open={Boolean(pendingAction)}
        title={pendingAction ? `${pendingAction.charAt(0).toUpperCase()}${pendingAction.slice(1)} transfer` : ''}
        description={pendingAction ? `${pendingAction.charAt(0).toUpperCase()}${pendingAction.slice(1)} ${transfer.transfer_number ?? `transfer #${transfer.id}`}?` : ''}
        confirmLabel={pendingAction ? `${pendingAction.charAt(0).toUpperCase()}${pendingAction.slice(1)} transfer` : 'Confirm'}
        variant={pendingAction === 'cancel' ? 'danger' : 'default'}
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
