import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { BarcodeScannerInput } from '../../../shared/components/barcode/BarcodeScannerInput'
import { ConfirmActionModal } from '../../../shared/components/modals/ConfirmActionModal'
import { EmptyState } from '../../../shared/components/states/EmptyState'
import { ErrorState } from '../../../shared/components/states/ErrorState'
import { LoadingState } from '../../../shared/components/states/LoadingState'
import { Button } from '../../../shared/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/Card'
import { Input } from '../../../shared/components/ui/Input'
import { NotFoundState } from '../../../shared/components/states/NotFoundState'
import { PageHeader } from '../../../shared/components/ui/PageHeader'
import { StatusBadge } from '../../../shared/components/ui/StatusBadge'
import { Table, TableCell, TableContainer, TableHead } from '../../../shared/components/ui/Table'
import { adminPath } from '../../../shared/routing/paths'
import { formatDate } from '../../../shared/utils/formatters'
import { getApiErrorMessage, isApiNotFound } from '../../../shared/api/api-error'
import { Can } from '../../../shared/auth/Can'
import { PERMISSIONS } from '../../../shared/auth/permission-keys'
import { cancelPickingList, getPickingList, scanPickingList } from '../api/warehouse.api'

export function PickingListDetailsPage() {
  const { pickingListId } = useParams()
  const queryClient = useQueryClient()
  const [barcode, setBarcode] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [cancelOpen, setCancelOpen] = useState(false)
  const query = useQuery({
    queryKey: ['picking-lists', pickingListId],
    queryFn: () => getPickingList(pickingListId!),
    enabled: Boolean(pickingListId),
  })

  const scanMutation = useMutation({
    mutationFn: () => scanPickingList(pickingListId!, {
      barcode,
      quantity: Number(quantity || 1),
    }),
    onSuccess: async () => {
      setBarcode('')
      await queryClient.invalidateQueries({ queryKey: ['picking-lists'] })
      await query.refetch()
    },
  })
  const cancelMutation = useMutation({
    mutationFn: () => cancelPickingList(pickingListId!),
    onSuccess: async () => {
      setCancelOpen(false)
      await queryClient.invalidateQueries({ queryKey: ['picking-lists'] })
      await query.refetch()
    },
  })

  if (query.isLoading) {
    return <LoadingState title="Loading picking list" />
  }

  if (query.isError && isApiNotFound(query.error)) {
    return (
      <NotFoundState
        title="Picking list not found"
        description="No picking list with this ID was returned by the warehouse API."
      />
    )
  }

  if (query.isError || !query.data) {
    return <ErrorState title="Unable to load picking list" message={getApiErrorMessage(query.error)} onRetry={() => void query.refetch()} />
  }

  const pickingList = query.data.data
  const rows = pickingList.items ?? []
  const canScan = pickingList.status !== 'completed' && pickingList.status !== 'cancelled'
  const canCancel = pickingList.status !== 'completed' && pickingList.status !== 'cancelled'

  return (
    <section className="page-section">
      <PageHeader
        title={pickingList.picking_number ?? pickingList.picking_list_number ?? `Picking List #${pickingList.id}`}
        description="Detail data is loaded from the documented picking list detail endpoint."
        actions={(
          <div className="page-header__button-row">
            <Can permission={PERMISSIONS.PICKING_LISTS_CANCEL}>
              {canCancel ? (
                <Button type="button" variant="secondary" onClick={() => setCancelOpen(true)}>
                  Cancel Picking List
                </Button>
              ) : null}
            </Can>
            <Link className="ui-link-reset" to={adminPath('/warehouse/picking-lists')}>
              <Button variant="secondary">Back</Button>
            </Link>
          </div>
        )}
      />

      {scanMutation.error ? <div className="form-error">{getApiErrorMessage(scanMutation.error)}</div> : null}
      {cancelMutation.error ? <div className="form-error">{getApiErrorMessage(cancelMutation.error)}</div> : null}

      <div className="details-grid">
        <Card className="detail-card">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>Picking batch summary and assignment.</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="detail-list">
              <div><dt>Warehouse</dt><dd>{pickingList.warehouse_name ?? '-'}</dd></div>
              <div><dt>Assigned To</dt><dd>{pickingList.assigned_to_name ?? '-'}</dd></div>
              <div><dt>Created By</dt><dd>{pickingList.created_by_name ?? '-'}</dd></div>
              <div><dt>Status</dt><dd><StatusBadge value={pickingList.status ?? 'pending'} /></dd></div>
              <div><dt>Total Orders</dt><dd>{pickingList.total_orders ?? '-'}</dd></div>
              <div><dt>Total Items</dt><dd>{pickingList.total_items ?? '-'}</dd></div>
              <div><dt>Picked Items</dt><dd>{pickingList.picked_items ?? '-'}</dd></div>
              <div><dt>Picked At</dt><dd>{pickingList.picked_at ? formatDate(pickingList.picked_at) : '-'}</dd></div>
              <div><dt>Notes</dt><dd>{pickingList.notes ?? '-'}</dd></div>
              <div><dt>Created</dt><dd>{formatDate(pickingList.created_at)}</dd></div>
            </dl>
          </CardContent>
        </Card>

        <Can permission={PERMISSIONS.PICKING_LISTS_SCAN}>
          <Card className="detail-card">
            <CardHeader>
              <CardTitle>Scan Pick</CardTitle>
              <CardDescription>Scanner input behaves as keyboard input and submits on Enter.</CardDescription>
            </CardHeader>
            <CardContent className="form-grid">
              <label className="field">
                <span>Barcode</span>
                <BarcodeScannerInput
                  autoFocus
                  value={barcode}
                  onChange={setBarcode}
                  onScan={() => {
                    if (canScan) {
                      scanMutation.mutate()
                    }
                  }}
                />
              </label>
              <label className="field">
                <span>Quantity</span>
                <Input type="number" min="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} />
              </label>
              <div className="form-actions">
                <Button type="button" disabled={!canScan} loading={scanMutation.isPending} onClick={() => scanMutation.mutate()}>
                  Scan Pick
                </Button>
              </div>
            </CardContent>
          </Card>
        </Can>
      </div>

      <Card className="table-card">
        <CardHeader>
          <CardTitle>Picking Rows</CardTitle>
          <CardDescription>Item rows returned by the picking list detail payload.</CardDescription>
        </CardHeader>
        <CardContent>
          {!rows.length ? (
            <EmptyState
              title="No picking rows returned"
              description="This picking list did not return any item rows in the detail payload."
            />
          ) : (
            <TableContainer>
              <Table variant="compact">
                <thead>
                  <tr>
                    <TableHead>Order</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Warehouse Product</TableHead>
                    <TableHead>Bin</TableHead>
                    <TableHead>Required</TableHead>
                    <TableHead>Picked</TableHead>
                    <TableHead>Status</TableHead>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={String(row.id ?? index)}>
                      <TableCell>{row.order_number ?? '-'}</TableCell>
                      <TableCell>{row.product_name ?? '-'}</TableCell>
                      <TableCell>
                        {row.warehouse_product_name ?? '-'}
                        {row.warehouse_product_barcode ? <p className="table-meta">{row.warehouse_product_barcode}</p> : null}
                      </TableCell>
                      <TableCell>
                        {row.bin_name ?? '-'}
                        {(row.bin_code || row.bin_barcode) ? (
                          <p className="table-meta">{[row.bin_code, row.bin_barcode].filter(Boolean).join(' / ')}</p>
                        ) : null}
                      </TableCell>
                      <TableCell>{row.quantity_required ?? '-'}</TableCell>
                      <TableCell>{row.quantity_picked ?? '-'}</TableCell>
                      <TableCell>{row.status ? <StatusBadge value={row.status} /> : '-'}</TableCell>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <ConfirmActionModal
        open={cancelOpen}
        title="Cancel picking list"
        description={`Cancel ${pickingList.picking_number ?? pickingList.picking_list_number ?? `#${pickingList.id}`}?`}
        confirmLabel="Cancel picking list"
        variant="danger"
        loading={cancelMutation.isPending}
        onCancel={() => setCancelOpen(false)}
        onConfirm={() => cancelMutation.mutate()}
      />
    </section>
  )
}
