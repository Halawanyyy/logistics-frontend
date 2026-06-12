import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { Warehouse } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { listAreas, listGovernorates } from '../../location-pricing/api/location-pricing.api'
import { listMerchants } from '../../merchants/api/merchants.api'
import { listOrders } from '../../orders/api/orders.api'
import { listShipments } from '../../shipments/api/shipments.api'
import { getApiErrorMessage } from '../../../shared/api/api-error'
import { FormPageLayout } from '../../../shared/components/forms/FormPageLayout'
import { ErrorState } from '../../../shared/components/feedback/ErrorState'
import { LoadingState } from '../../../shared/components/feedback/LoadingState'
import { Button } from '../../../shared/components/ui/Button'
import { adminPath } from '../../../shared/routing/paths'
import {
  adjustInventoryStock,
  createWarehouse,
  createWarehouseCharge,
  createWarehouseProduct,
  createWarehouseReturn,
  getWarehouse,
  getWarehouseCharge,
  getWarehouseProduct,
  listWarehouseProducts,
  listWarehouses,
  updateWarehouse,
  updateWarehouseCharge,
  updateWarehouseProduct,
} from '../api/warehouse.api'
import { WarehouseForm, type WarehouseFormKind } from '../components/WarehouseForms'

type Kind = WarehouseFormKind

const config = {
  warehouse: { title: 'Warehouse', back: adminPath('/warehouses'), create: createWarehouse, queryKey: 'warehouses' },
  product: { title: 'Warehouse Product', back: adminPath('/warehouse-products'), create: createWarehouseProduct, queryKey: 'warehouse-products' },
  adjust: { title: 'Stock Adjustment', back: adminPath('/inventory-stocks'), create: adjustInventoryStock, queryKey: 'inventory-stocks' },
  return: { title: 'Warehouse Return', back: adminPath('/warehouse-returns'), create: createWarehouseReturn, queryKey: 'warehouse-returns' },
  charge: { title: 'Warehouse Charge', back: adminPath('/warehouse-charges'), create: createWarehouseCharge, queryKey: 'warehouse-charges' },
} as const

export function WarehouseRecordFormPage({ kind, mode = 'create' }: { kind: Kind; mode?: 'create' | 'edit' }) {
  const { t } = useTranslation()
  const { recordId } = useParams()
  const isEdit = mode === 'edit'
  const entry = config[kind]
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const chargeQuery = useQuery({ queryKey: ['warehouse-charges', recordId], queryFn: () => getWarehouseCharge(recordId!), enabled: isEdit && kind === 'charge' && Boolean(recordId) })
  const warehouseQuery = useQuery({ queryKey: ['warehouses', recordId], queryFn: () => getWarehouse(recordId!), enabled: isEdit && kind === 'warehouse' && Boolean(recordId) })
  const productQuery = useQuery({ queryKey: ['warehouse-products', recordId], queryFn: () => getWarehouseProduct(recordId!), enabled: isEdit && kind === 'product' && Boolean(recordId) })
  const [merchants, warehouses, products, governorates, areas, shipments, orders] = useQueries({
    queries: [
      { queryKey: ['merchants'], queryFn: listMerchants },
      { queryKey: ['warehouses'], queryFn: listWarehouses },
      { queryKey: ['warehouse-products'], queryFn: () => listWarehouseProducts() },
      { queryKey: ['governorates'], queryFn: listGovernorates },
      { queryKey: ['areas'], queryFn: () => listAreas() },
      { queryKey: ['shipments'], queryFn: () => listShipments() },
      { queryKey: ['orders'], queryFn: () => listOrders() },
    ],
  })
  const mutation = useMutation({
    mutationFn: (values: any) => {
      if (isEdit && kind === 'charge') return updateWarehouseCharge(recordId!, values) as Promise<any>
      if (isEdit && kind === 'warehouse') return updateWarehouse(recordId!, values) as Promise<any>
      if (isEdit && kind === 'product') return updateWarehouseProduct(recordId!, values) as Promise<any>
      return entry.create(values) as Promise<any>
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [entry.queryKey] })
      navigate(isEdit ? `${entry.back}/${recordId}` : entry.back)
    },
  })
  const record = chargeQuery.data?.data ?? warehouseQuery.data?.data ?? productQuery.data?.data
  const loading = chargeQuery.isLoading || warehouseQuery.isLoading || productQuery.isLoading || [merchants, warehouses, products, governorates, areas, shipments, orders].some((query) => query.isLoading)
  const error = chargeQuery.error ?? warehouseQuery.error ?? productQuery.error ?? [merchants, warehouses, products, governorates, areas, shipments, orders].find((query) => query.isError)?.error
  if (loading) return <LoadingState title={`Loading ${entry.title.toLowerCase()} form`} />
  if (error) return <ErrorState message={getApiErrorMessage(error)} />

  return (
    <FormPageLayout
      backTo={entry.back}
      description={t('Manage warehouse records with the same real API flow while keeping the form centered, readable, and responsive.', {
        defaultValue: 'Manage warehouse records with the same real API flow while keeping the form centered, readable, and responsive.',
      })}
      eyebrow={t('Warehouse', { defaultValue: 'Warehouse' })}
      sectionIcon={<Warehouse size={18} />}
      sectionDescription={t('Enter the warehouse-related details required for this record type, then review and save.', {
        defaultValue: 'Enter the warehouse-related details required for this record type, then review and save.',
      })}
      sectionTitle={t('{{title}} Details', {
        title: t(entry.title, { defaultValue: entry.title }),
        defaultValue: `${entry.title} Details`,
      })}
      title={t(isEdit ? 'Edit {{title}}' : 'Create {{title}}', {
        title: t(entry.title, { defaultValue: entry.title }),
        defaultValue: `${isEdit ? 'Edit' : 'Create'} ${entry.title}`,
      })}
    >
      <WarehouseForm
        areas={areas.data?.data ?? []}
        defaultValues={record}
        error={mutation.error}
        governorates={governorates.data?.data ?? []}
        isSubmitting={mutation.isPending}
        kind={kind}
        merchants={merchants.data?.data ?? []}
        orders={orders.data?.data ?? []}
        products={products.data?.data ?? []}
        secondaryAction={(
          <Link className="ui-link-reset" to={entry.back}>
            <Button variant="secondary">{t('Cancel', { defaultValue: 'Cancel' })}</Button>
          </Link>
        )}
        shipments={shipments.data?.data ?? []}
        submitLabel={t(isEdit ? 'Save {{title}}' : 'Create {{title}}', {
          title: t(entry.title, { defaultValue: entry.title }),
          defaultValue: `${isEdit ? 'Save' : 'Create'} ${entry.title}`,
        })}
        warehouses={warehouses.data?.data ?? []}
        onSubmit={(values) => mutation.mutate(values)}
      />
    </FormPageLayout>
  )
}
