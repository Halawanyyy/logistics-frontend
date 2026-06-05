import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  closeWarehouseReturn,
  deleteWarehouse,
  deleteWarehouseCharge,
  deleteWarehouseProduct,
  getInventoryStock,
  getStockMovement,
  getWarehouse,
  getWarehouseCharge,
  getWarehouseProduct,
  getWarehouseReturn,
  inspectWarehouseReturn,
  markWarehouseReturnDamaged,
  receiveWarehouseReturn,
  rejectWarehouseReturn,
  restockWarehouseReturn,
} from '../api/warehouse.api'
import { getWarehouseProductLabel } from '../../../shared/api/labels.api'
import { listAuditTimeline } from '../../../shared/api/audit.api'
import { getApiErrorMessage, isApiNotFound } from '../../../shared/api/api-error'
import { Attachments } from '../../../shared/components/attachments/Attachments'
import { LabelDocumentDialog } from '../../../shared/components/labels/LabelDocumentDialog'
import { ConfirmActionModal } from '../../../shared/components/modals/ConfirmActionModal'
import { ErrorState } from '../../../shared/components/states/ErrorState'
import { LoadingState } from '../../../shared/components/states/LoadingState'
import { Button } from '../../../shared/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../shared/components/ui/Card'
import { PageHeader } from '../../../shared/components/ui/PageHeader'
import { StatusBadge } from '../../../shared/components/ui/StatusBadge'
import { Table, TableCell, TableContainer, TableHead } from '../../../shared/components/ui/Table'
import { pickDisplayLabel } from '../../../shared/i18n/locale'
import { adminPath } from '../../../shared/routing/paths'
import { formatDate, formatMoney } from '../../../shared/utils/formatters'
import { Can } from '../../../shared/auth/Can'
import { PERMISSIONS } from '../../../shared/auth/permission-keys'
import { useAuthStore } from '../../auth/store/auth.store'
import { hasPermission } from '../../../shared/auth/permissions'
import { NotFoundState } from '../../../shared/components/states/NotFoundState'
import { Timeline } from '../../../shared/components/timeline/Timeline'

type WarehouseDetailsKind = 'warehouse' | 'product' | 'inventory-stock' | 'stock-movement' | 'return' | 'charge'

const detailsConfig = {
  warehouse: { title: 'Warehouse', back: adminPath('/warehouses'), queryKey: 'warehouses', get: getWarehouse, delete: deleteWarehouse, updatePermission: PERMISSIONS.WAREHOUSE_UPDATE, deletePermission: PERMISSIONS.WAREHOUSE_DELETE },
  product: { title: 'Warehouse Product', back: adminPath('/warehouse-products'), queryKey: 'warehouse-products', get: getWarehouseProduct, delete: deleteWarehouseProduct, updatePermission: PERMISSIONS.INVENTORY_UPDATE, deletePermission: PERMISSIONS.INVENTORY_DELETE },
  'inventory-stock': { title: 'Inventory Stock', back: adminPath('/inventory-stocks'), queryKey: 'inventory-stocks', get: getInventoryStock },
  'stock-movement': { title: 'Stock Movement', back: adminPath('/stock-movements'), queryKey: 'stock-movements', get: getStockMovement },
  return: { title: 'Warehouse Return', back: adminPath('/warehouse-returns'), queryKey: 'warehouse-returns', get: getWarehouseReturn },
  charge: { title: 'Warehouse Charge', back: adminPath('/warehouse-charges'), queryKey: 'warehouse-charges', get: getWarehouseCharge, delete: deleteWarehouseCharge, updatePermission: PERMISSIONS.WAREHOUSE_CHARGES_UPDATE, deletePermission: PERMISSIONS.WAREHOUSE_CHARGES_DELETE },
} as const

export function WarehouseRecordDetailsPage({ kind }: { kind: WarehouseDetailsKind }) {
  const { recordId } = useParams()
  const user = useAuthStore((state) => state.user)
  const [pendingReturnAction, setPendingReturnAction] = useState<'receive' | 'inspect' | 'restock' | 'mark-damaged' | 'reject' | 'close' | null>(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const entry = detailsConfig[kind]
  const canViewTimeline = hasPermission(user, PERMISSIONS.AUDIT_LOGS_TIMELINE)
  const query = useQuery<any>({
    queryKey: [entry.queryKey, recordId],
    queryFn: () => entry.get(recordId!) as Promise<any>,
    enabled: Boolean(recordId),
  })
  const timelineQuery = useQuery({
    queryKey: ['warehouse-details', kind, recordId, 'timeline'],
    queryFn: () => listAuditTimeline({
      auditable_type: kind === 'product' ? 'warehouse_product' : kind,
      auditable_id: recordId!,
    }),
    enabled: Boolean(recordId) && canViewTimeline && (kind === 'product'),
  })
  const deleteMutation = useMutation({
    mutationFn: () => ('delete' in entry ? entry.delete(recordId!) : Promise.reject(new Error('Delete is not available for this record.'))) as Promise<any>,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [entry.queryKey] })
      navigate(entry.back)
    },
  })
  const returnActionMutation = useMutation({
    mutationFn: (action: 'receive' | 'inspect' | 'restock' | 'mark-damaged' | 'reject' | 'close') => {
      switch (action) {
        case 'receive':
          return receiveWarehouseReturn(recordId!)
        case 'inspect':
          return inspectWarehouseReturn(recordId!)
        case 'restock':
          return restockWarehouseReturn(recordId!)
        case 'mark-damaged':
          return markWarehouseReturnDamaged(recordId!)
        case 'reject':
          return rejectWarehouseReturn(recordId!)
        case 'close':
          return closeWarehouseReturn(recordId!)
      }
    },
    onSuccess: async () => {
      setPendingReturnAction(null)
      await query.refetch()
      await queryClient.invalidateQueries({ queryKey: [entry.queryKey] })
    },
  })
  if (query.isLoading) return <LoadingState title="Loading warehouse record" />
  if (query.isError && isApiNotFound(query.error)) {
    return (
      <NotFoundState
        title={`${entry.title} not found`}
        description={`This ${entry.title.toLowerCase()} record could not be found in the warehouse APIs.`}
      />
    )
  }
  if (query.isError || !query.data) return <ErrorState message={getApiErrorMessage(query.error)} />
  const record = query.data.data as any
  const canEdit = 'updatePermission' in entry && entry.updatePermission
  const canDelete = 'deletePermission' in entry && 'delete' in entry && entry.deletePermission
  const timelineItems = (timelineQuery.data?.data ?? []).map((item) => ({
    id: item.id,
    title: `${item.event_type} - ${item.action}`,
    subtitle: item.user?.name ?? 'System',
    description: item.notes ?? 'No notes were recorded for this event.',
    timestamp: item.created_at,
  }))
  const returnActionButtons = kind === 'return' ? getReturnActionButtons(record.status as string | undefined) : []
  return (
    <section className="page-section">
      <PageHeader title={entry.title} description={record.description ?? record.product_name ?? record.name ?? record.code} actions={<div className="page-header__button-row">{kind === 'product' ? <LabelDocumentDialog defaultFormat="html" fetchDocument={(options) => getWarehouseProductLabel(record.id, options)} title={`Product Label - ${record.name ?? record.product_name ?? record.id}`} triggerLabel="Label" /> : null}{returnActionButtons.map((action) => <Button key={action.value} variant={action.variant} loading={returnActionMutation.isPending && pendingReturnAction === action.value} onClick={() => setPendingReturnAction(action.value)}>{action.label}</Button>)}{canEdit ? <Can permission={entry.updatePermission}><Link className="ui-link-reset" to={`${entry.back}/${record.id}/edit`}><Button variant="secondary">Edit</Button></Link></Can> : null}{canDelete ? <Can permission={entry.deletePermission}><Button variant="danger" loading={deleteMutation.isPending} onClick={() => { if (window.confirm(`Delete this ${entry.title.toLowerCase()}?`)) deleteMutation.mutate() }}>Delete</Button></Can> : null}<Link className="ui-link-reset" to={entry.back}><Button variant="secondary">Back</Button></Link></div>} />
      {deleteMutation.error ? <div className="form-error">{getApiErrorMessage(deleteMutation.error)}</div> : null}
      {returnActionMutation.error ? <div className="form-error">{getApiErrorMessage(returnActionMutation.error)}</div> : null}
      <Card><CardHeader><CardTitle>Details</CardTitle></CardHeader><CardContent><dl className="detail-list">{Object.entries(record).filter(([, value]) => typeof value !== 'object').map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{formatValue(key, value)}</dd></div>)}</dl></CardContent></Card>
      {kind === 'return' ? (
        <Card className="table-card">
          <CardHeader>
            <CardTitle>Return Lifecycle</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="detail-list">
              <div>
                <dt>Status</dt>
                <dd>
                  <StatusBadge value={record.status}>
                    {pickDisplayLabel(record.status, record.status_label)}
                  </StatusBadge>
                </dd>
              </div>
              <div>
                <dt>Condition</dt>
                <dd>{pickDisplayLabel(record.condition, record.condition_label)}</dd>
              </div>
              <div>
                <dt>Stock Rule</dt>
                <dd>Stock changes stay under backend return lifecycle controls only.</dd>
              </div>
            </dl>
            {record.items?.length ? (
              <TableContainer>
                <Table variant="compact">
                  <thead>
                    <tr>
                      <TableHead>Product</TableHead>
                      <TableHead>Expected</TableHead>
                      <TableHead>Received</TableHead>
                      <TableHead>Restocked</TableHead>
                      <TableHead>Damaged</TableHead>
                      <TableHead>Rejected</TableHead>
                      <TableHead>Condition</TableHead>
                    </tr>
                  </thead>
                  <tbody>
                    {record.items.map((item: any, index: number) => (
                      <tr key={`${record.id}-${item.id ?? index}`}>
                        <TableCell>{item.product_name ?? item.warehouse_product_id ?? '-'}</TableCell>
                        <TableCell>{item.expected_quantity ?? '-'}</TableCell>
                        <TableCell>{item.received_quantity ?? '-'}</TableCell>
                        <TableCell>{item.restocked_quantity ?? '-'}</TableCell>
                        <TableCell>{item.damaged_quantity ?? '-'}</TableCell>
                        <TableCell>{item.rejected_quantity ?? '-'}</TableCell>
                        <TableCell>{pickDisplayLabel(item.condition, item.condition_label)}</TableCell>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </TableContainer>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
      {kind === 'return' ? <Attachments attachableType="warehouse_returns" attachableId={record.id} /> : null}
      {kind === 'product' && canViewTimeline ? (
        <>
          {timelineQuery.isLoading ? <LoadingState title="Loading activity timeline" /> : null}
          {timelineQuery.isError ? (
            <ErrorState
              title="Unable to load warehouse product activity timeline"
              message={getApiErrorMessage(timelineQuery.error)}
              onRetry={() => void timelineQuery.refetch()}
            />
          ) : null}
          {!timelineQuery.isLoading && !timelineQuery.isError ? (
            <Timeline
              title="Activity Timeline"
              items={timelineItems}
              emptyDescription="No warehouse product activity timeline entries were returned."
            />
          ) : null}
        </>
      ) : null}
      <ConfirmActionModal
        open={Boolean(pendingReturnAction)}
        title={pendingReturnAction ? pendingReturnAction.replace('-', ' ') : 'Update return'}
        description={pendingReturnAction ? `Run ${pendingReturnAction.replace('-', ' ')} on this warehouse return?` : ''}
        confirmLabel={pendingReturnAction ? pendingReturnAction.replace('-', ' ') : 'Confirm'}
        variant={pendingReturnAction === 'reject' || pendingReturnAction === 'mark-damaged' || pendingReturnAction === 'close' ? 'danger' : 'default'}
        loading={returnActionMutation.isPending}
        onCancel={() => setPendingReturnAction(null)}
        onConfirm={() => {
          if (pendingReturnAction) {
            returnActionMutation.mutate(pendingReturnAction)
          }
        }}
      />
    </section>
  )
}

function formatValue(key: string, value: unknown) {
  if (value == null) return '-'
  if (key.includes('amount') || key.includes('price')) return formatMoney(String(value))
  if (key.includes('_at') || key.includes('date')) return formatDate(String(value))
  return String(value)
}

function getReturnActionButtons(status: string | undefined) {
  switch (status) {
    case 'pending':
      return [{ label: 'Receive', value: 'receive' as const, variant: 'secondary' as const }]
    case 'received':
      return [{ label: 'Inspect', value: 'inspect' as const, variant: 'secondary' as const }]
    case 'inspected':
      return [
        { label: 'Restock', value: 'restock' as const, variant: 'secondary' as const },
        { label: 'Mark Damaged', value: 'mark-damaged' as const, variant: 'danger' as const },
        { label: 'Reject', value: 'reject' as const, variant: 'danger' as const },
      ]
    case 'restocked':
    case 'damaged':
    case 'rejected':
      return [{ label: 'Close', value: 'close' as const, variant: 'danger' as const }]
    default:
      return []
  }
}
