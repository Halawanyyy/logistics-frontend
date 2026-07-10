import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
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
import { useLocale } from '../../../shared/i18n/useLocale'
import { adminPath } from '../../../shared/routing/paths'
import { formatDate, formatMoney } from '../../../shared/utils/formatters'
import { Can } from '../../../shared/auth/Can'
import { PERMISSIONS } from '../../../shared/auth/permission-keys'
import { NotFoundState } from '../../../shared/components/states/NotFoundState'
import { getProductPrintableLabelDocument } from '../utils/productLabel'
type WarehouseDetailsKind = 'warehouse' | 'product' | 'inventory-stock' | 'stock-movement' | 'return' | 'charge'

const detailsConfig = {
  warehouse: { title: 'Warehouse', back: adminPath('/warehouses'), queryKey: 'warehouses', get: getWarehouse, delete: deleteWarehouse, updatePermission: PERMISSIONS.WAREHOUSE_UPDATE, deletePermission: PERMISSIONS.WAREHOUSE_DELETE },
  product: { title: 'Warehouse Product', back: adminPath('/warehouse-products'), queryKey: 'warehouse-products', get: getWarehouseProduct, delete: deleteWarehouseProduct, updatePermission: PERMISSIONS.INVENTORY_UPDATE, deletePermission: PERMISSIONS.INVENTORY_DELETE },
  'inventory-stock': { title: 'Inventory Stock', back: adminPath('/inventory-stocks'), queryKey: 'inventory-stocks', get: getInventoryStock },
  'stock-movement': { title: 'Stock Movement', back: adminPath('/stock-movements'), queryKey: 'stock-movements', get: getStockMovement },
  return: { title: 'Warehouse Return', back: adminPath('/warehouse-returns'), queryKey: 'warehouse-returns', get: getWarehouseReturn },
  charge: { title: 'Warehouse Charge', back: adminPath('/warehouse-charges'), queryKey: 'warehouse-charges', get: getWarehouseCharge, delete: deleteWarehouseCharge, updatePermission: PERMISSIONS.WAREHOUSE_CHARGES_UPDATE, deletePermission: PERMISSIONS.WAREHOUSE_CHARGES_DELETE },
} as const

const warehouseFieldLabelMap: Record<string, string> = {
  id: 'ID',
  name: 'Name',
  code: 'Code',
  status: 'Status',
  type: 'Type',
  notes: 'Notes',
  description: 'Description',
  created_at: 'Created',
  updated_at: 'Updated',
  deleted_at: 'Deleted At',
  merchant_id: 'Merchant ID',
  merchant_name: 'Merchant',
  warehouse_id: 'Warehouse ID',
  warehouse_name: 'Warehouse',
  warehouse_product_id: 'Product ID',
  inventory_stock_id: 'Inventory Stock ID',
  source_warehouse_id: 'Source Warehouse ID',
  source_warehouse_name: 'Source Warehouse',
  destination_warehouse_id: 'Destination Warehouse ID',
  destination_warehouse_name: 'Destination Warehouse',
  zone_id: 'Zone ID',
  shelf_id: 'Shelf ID',
  bin_id: 'Bin ID',
  sku: 'SKU',
  barcode: 'Barcode',
  quantity: 'Quantity',
  available_quantity: 'Available Quantity',
  reserved_quantity: 'Reserved Quantity',
  damaged_quantity: 'Damaged Quantity',
  minimum_stock: 'Minimum Stock',
  maximum_stock: 'Maximum Stock',
  received_quantity: 'Received Quantity',
  accepted_quantity: 'Accepted Quantity',
  rejected_quantity: 'Rejected Quantity',
  confirmed_at: 'Confirmed At',
  cancelled_at: 'Cancelled At',
  received_at: 'Received At',
  dispatched_at: 'Dispatched At',
  completed_at: 'Completed At',
  unit_price: 'Unit Price',
  total_amount: 'Total Amount',
  fee_amount: 'Fee Amount',
  product_name: 'Product',
}

function getWarehouseFieldLabel(t: TFunction, key: string) {
  const fallback = key.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
  const label = warehouseFieldLabelMap[key] ?? fallback
  return t(label, { defaultValue: label })
}

export function WarehouseRecordDetailsPage({ kind }: { kind: WarehouseDetailsKind }) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { recordId } = useParams()
    const [pendingReturnAction, setPendingReturnAction] = useState<'receive' | 'inspect' | 'restock' | 'mark-damaged' | 'reject' | 'close' | null>(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const entry = detailsConfig[kind]
  const query = useQuery<any>({
    queryKey: [entry.queryKey, recordId],
    queryFn: () => entry.get(recordId!) as Promise<any>
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
  if (query.isLoading) return <LoadingState title={t('Loading warehouse record', { defaultValue: 'Loading warehouse record' })} />
  if (query.isError && isApiNotFound(query.error)) {
    return (
      <NotFoundState
        title={t('{{title}} not found', {
          title: t(entry.title, { defaultValue: entry.title }),
          defaultValue: `${entry.title} not found`,
        })}
        description={t('This {{title}} record could not be found in the warehouse APIs.', {
          title: t(entry.title, { defaultValue: entry.title }).toLowerCase(),
          defaultValue: `This ${entry.title.toLowerCase()} record could not be found in the warehouse APIs.`,
        })}
      />
    )
  }
  if (query.isError || !query.data) return <ErrorState message={getApiErrorMessage(query.error)} />
  const record = query.data.data as any
  const canEdit = 'updatePermission' in entry && entry.updatePermission
  const canDelete = 'deletePermission' in entry && 'delete' in entry && entry.deletePermission
  const returnActionButtons = kind === 'return' ? getReturnActionButtons(record.status as string | undefined) : []
  return (
    <section className="page-section">
      <PageHeader
        title={t(entry.title, { defaultValue: entry.title })}
        description={record.description ?? record.product_name ?? record.name ?? record.code}
        actions={(
          <div className="page-header__button-row">
            {kind === 'product' ? (
              <LabelDocumentDialog
                defaultFormat="html"
                fetchDocument={(options) => getProductPrintableLabelDocument({
                  fetchDocument: (requestOptions) => getWarehouseProductLabel(record.id, requestOptions),
                  locale,
                  options,
                  product: record,
                  t,
                })}
                formats={['html', 'pdf']}
                title={t('Product Label - {{name}}', {
                  name: record.name ?? record.product_name ?? record.id,
                  defaultValue: `Product Label - ${record.name ?? record.product_name ?? record.id}`,
                })}
                triggerLabel={t('Label', { defaultValue: 'Label' })}
              />
            ) : null}
            {returnActionButtons.map((action) => (
              <Button
                key={action.value}
                variant={action.variant}
                loading={returnActionMutation.isPending && pendingReturnAction === action.value}
                onClick={() => setPendingReturnAction(action.value)}
              >
                {t(action.label, { defaultValue: action.label })}
              </Button>
            ))}
            {canEdit ? (
              <Can permission={entry.updatePermission}>
                <Link className="ui-link-reset" to={`${entry.back}/${record.id}/edit`}>
                  <Button variant="secondary">{t('Edit')}</Button>
                </Link>
              </Can>
            ) : null}
            {canDelete ? (
              <Can permission={entry.deletePermission}>
                <Button
                  variant="danger"
                  loading={deleteMutation.isPending}
                  onClick={() => {
                    if (window.confirm(t('Delete this {{title}}?', {
                      title: t(entry.title, { defaultValue: entry.title }).toLowerCase(),
                      defaultValue: `Delete this ${entry.title.toLowerCase()}?`,
                    }))) {
                      deleteMutation.mutate()
                    }
                  }}
                >
                  {t('Delete')}
                </Button>
              </Can>
            ) : null}
            <Link className="ui-link-reset" to={entry.back}>
              <Button variant="secondary">{t('Back')}</Button>
            </Link>
          </div>
        )}
      />
      {deleteMutation.error ? <div className="form-error">{getApiErrorMessage(deleteMutation.error)}</div> : null}
      {returnActionMutation.error ? <div className="form-error">{getApiErrorMessage(returnActionMutation.error)}</div> : null}
      <Card>
        <CardHeader><CardTitle>{t('Details')}</CardTitle></CardHeader>
        <CardContent>
          <dl className="detail-list">
            {Object.entries(record)
              .filter(([, value]) => typeof value !== 'object')
              .map(([key, value]) => (
                <div key={key}>
                  <dt>{getWarehouseFieldLabel(t, key)}</dt>
                  <dd>{formatValue(key, value)}</dd>
                </div>
              ))}
          </dl>
        </CardContent>
      </Card>
      {kind === 'return' ? (
        <Card className="table-card">
          <CardHeader>
            <CardTitle>{t('Return Lifecycle', { defaultValue: 'Return Lifecycle' })}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="detail-list">
              <div>
                <dt>{t('Status')}</dt>
                <dd>
                  <StatusBadge value={record.status}>
                    {pickDisplayLabel(record.status, record.status_label)}
                  </StatusBadge>
                </dd>
              </div>
              <div>
                <dt>{t('Condition', { defaultValue: 'Condition' })}</dt>
                <dd>
                  <StatusBadge value={record.condition}>
                    {pickDisplayLabel(record.condition, record.condition_label)}
                  </StatusBadge>
                </dd>
              </div>
              <div>
                <dt>{t('Stock Rule', { defaultValue: 'Stock Rule' })}</dt>
                <dd>{t('Stock changes stay under backend return lifecycle controls only.', {
                  defaultValue: 'Stock changes stay under backend return lifecycle controls only.',
                })}</dd>
              </div>
            </dl>
            {record.items?.length ? (
              <TableContainer>
                <Table variant="compact">
                  <thead>
                    <tr>
                      <TableHead>{t('Product')}</TableHead>
                      <TableHead>{t('Expected', { defaultValue: 'Expected' })}</TableHead>
                      <TableHead>{t('Received', { defaultValue: 'Received' })}</TableHead>
                      <TableHead>{t('Restocked', { defaultValue: 'Restocked' })}</TableHead>
                      <TableHead>{t('Damaged', { defaultValue: 'Damaged' })}</TableHead>
                      <TableHead>{t('Rejected', { defaultValue: 'Rejected' })}</TableHead>
                      <TableHead>{t('Condition', { defaultValue: 'Condition' })}</TableHead>
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
                        <TableCell>
                          <StatusBadge value={item.condition}>
                            {pickDisplayLabel(item.condition, item.condition_label)}
                          </StatusBadge>
                        </TableCell>
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
      <ConfirmActionModal
        open={Boolean(pendingReturnAction)}
        title={pendingReturnAction ? t(pendingReturnAction.replace('-', ' '), {
          defaultValue: pendingReturnAction.replace('-', ' '),
        }) : t('Update return', { defaultValue: 'Update return' })}
        description={pendingReturnAction ? t('Run {{action}} on this warehouse return?', {
          action: pendingReturnAction.replace('-', ' '),
          defaultValue: `Run ${pendingReturnAction.replace('-', ' ')} on this warehouse return?`,
        }) : ''}
        confirmLabel={pendingReturnAction ? t(pendingReturnAction.replace('-', ' '), {
          defaultValue: pendingReturnAction.replace('-', ' '),
        }) : t('Confirm')}
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
  if (
    key === 'status'
    || key === 'type'
    || key === 'condition'
    || key === 'movement_type'
    || key === 'direction'
    || key.endsWith('_status')
  ) {
    return <StatusBadge value={String(value)} />
  }
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
