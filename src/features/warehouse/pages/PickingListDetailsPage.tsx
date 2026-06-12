import { useState } from 'react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
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
    return <LoadingState title={t('Loading picking list', { defaultValue: 'Loading picking list' })} />
  }

  if (query.isError && isApiNotFound(query.error)) {
    return (
      <NotFoundState
        title={t('Picking list not found', { defaultValue: 'Picking list not found' })}
        description={t('No picking list with this ID was returned by the warehouse API.', { defaultValue: 'No picking list with this ID was returned by the warehouse API.' })}
      />
    )
  }

  if (query.isError || !query.data) {
    return <ErrorState title={t('Unable to load picking list', { defaultValue: 'Unable to load picking list' })} message={getApiErrorMessage(query.error)} onRetry={() => void query.refetch()} />
  }

  const pickingList = query.data.data
  const rows = pickingList.items ?? []
  const canScan = pickingList.status !== 'completed' && pickingList.status !== 'cancelled'
  const canCancel = pickingList.status !== 'completed' && pickingList.status !== 'cancelled'

  return (
    <section className="page-section">
      <PageHeader
        title={pickingList.picking_number ?? pickingList.picking_list_number ?? t('Picking List #{{id}}', { id: pickingList.id, defaultValue: `Picking List #${pickingList.id}` })}
        description={t('Detail data is loaded from the documented picking list detail endpoint.', { defaultValue: 'Detail data is loaded from the documented picking list detail endpoint.' })}
        actions={(
          <div className="page-header__button-row">
            <Can permission={PERMISSIONS.PICKING_LISTS_CANCEL}>
              {canCancel ? (
                <Button type="button" variant="secondary" onClick={() => setCancelOpen(true)}>
                  {t('Cancel Picking List', { defaultValue: 'Cancel Picking List' })}
                </Button>
              ) : null}
            </Can>
            <Link className="ui-link-reset" to={adminPath('/warehouse/picking-lists')}>
              <Button variant="secondary">{t('Back')}</Button>
            </Link>
          </div>
        )}
      />

      {scanMutation.error ? <div className="form-error">{getApiErrorMessage(scanMutation.error)}</div> : null}
      {cancelMutation.error ? <div className="form-error">{getApiErrorMessage(cancelMutation.error)}</div> : null}

      <div className="details-grid">
        <Card className="detail-card">
          <CardHeader>
            <CardTitle>{t('Overview')}</CardTitle>
            <CardDescription>{t('Picking batch summary and assignment.', { defaultValue: 'Picking batch summary and assignment.' })}</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="detail-list">
              <div><dt>{t('Warehouse')}</dt><dd>{pickingList.warehouse_name ?? '-'}</dd></div>
              <div><dt>{t('Assigned To', { defaultValue: 'Assigned To' })}</dt><dd>{pickingList.assigned_to_name ?? '-'}</dd></div>
              <div><dt>{t('Created By')}</dt><dd>{pickingList.created_by_name ?? '-'}</dd></div>
              <div><dt>{t('Status')}</dt><dd><StatusBadge value={pickingList.status ?? 'pending'} /></dd></div>
              <div><dt>{t('Total Orders', { defaultValue: 'Total Orders' })}</dt><dd>{pickingList.total_orders ?? '-'}</dd></div>
              <div><dt>{t('Total Items', { defaultValue: 'Total Items' })}</dt><dd>{pickingList.total_items ?? '-'}</dd></div>
              <div><dt>{t('Picked Items', { defaultValue: 'Picked Items' })}</dt><dd>{pickingList.picked_items ?? '-'}</dd></div>
              <div><dt>{t('Picked At', { defaultValue: 'Picked At' })}</dt><dd>{pickingList.picked_at ? formatDate(pickingList.picked_at) : '-'}</dd></div>
              <div><dt>{t('Notes')}</dt><dd>{pickingList.notes ?? '-'}</dd></div>
              <div><dt>{t('Created')}</dt><dd>{formatDate(pickingList.created_at)}</dd></div>
            </dl>
          </CardContent>
        </Card>

        <Can permission={PERMISSIONS.PICKING_LISTS_SCAN}>
          <Card className="detail-card">
            <CardHeader>
              <CardTitle>{t('Scan Pick', { defaultValue: 'Scan Pick' })}</CardTitle>
              <CardDescription>{t('Scanner input behaves as keyboard input and submits on Enter.', { defaultValue: 'Scanner input behaves as keyboard input and submits on Enter.' })}</CardDescription>
            </CardHeader>
            <CardContent className="form-grid">
              <label className="field">
                <span>{t('Barcode')}</span>
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
                <span>{t('Quantity')}</span>
                <Input type="number" min="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} />
              </label>
              <div className="form-actions">
                <Button type="button" disabled={!canScan} loading={scanMutation.isPending} onClick={() => scanMutation.mutate()}>
                  {t('Scan Pick', { defaultValue: 'Scan Pick' })}
                </Button>
              </div>
            </CardContent>
          </Card>
        </Can>
      </div>

      <Card className="table-card">
        <CardHeader>
          <CardTitle>{t('Picking Rows', { defaultValue: 'Picking Rows' })}</CardTitle>
          <CardDescription>{t('Item rows returned by the picking list detail payload.', { defaultValue: 'Item rows returned by the picking list detail payload.' })}</CardDescription>
        </CardHeader>
        <CardContent>
          {!rows.length ? (
            <EmptyState
              title={t('No picking rows returned', { defaultValue: 'No picking rows returned' })}
              description={t('This picking list did not return any item rows in the detail payload.', { defaultValue: 'This picking list did not return any item rows in the detail payload.' })}
            />
          ) : (
            <TableContainer>
              <Table variant="compact">
                <thead>
                  <tr>
                    <TableHead>{t('Order')}</TableHead>
                    <TableHead>{t('Product')}</TableHead>
                    <TableHead>{t('Warehouse Product')}</TableHead>
                    <TableHead>{t('Bin', { defaultValue: 'Bin' })}</TableHead>
                    <TableHead>{t('Required', { defaultValue: 'Required' })}</TableHead>
                    <TableHead>{t('Picked', { defaultValue: 'Picked' })}</TableHead>
                    <TableHead>{t('Status')}</TableHead>
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
        title={t('Cancel picking list', { defaultValue: 'Cancel picking list' })}
        description={t('Cancel {{pickingNumber}}?', { pickingNumber: pickingList.picking_number ?? pickingList.picking_list_number ?? `#${pickingList.id}`, defaultValue: `Cancel ${pickingList.picking_number ?? pickingList.picking_list_number ?? `#${pickingList.id}`}?` })}
        confirmLabel={t('Cancel picking list', { defaultValue: 'Cancel picking list' })}
        variant="danger"
        loading={cancelMutation.isPending}
        onCancel={() => setCancelOpen(false)}
        onConfirm={() => cancelMutation.mutate()}
      />
    </section>
  )
}
