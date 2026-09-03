import { PERMISSIONS } from '../../../shared/auth/permission-keys'
import { WarehouseTabbedPage } from '../components/WarehouseTabbedPage'
import { InboundRequestsPanel } from './MerchantInboundStockRequestsPage'
import { WarehouseReceiptsPanel } from './WarehouseReceiptsPage'
import { WarehouseTransfersPanel } from './WarehouseTransfersPage'
import { listMerchantInboundStockRequests, listWarehouseReceipts, listWarehouseTransfers } from '../api/warehouse.api'

export function WarehouseInboundPage() {
  return (
    <WarehouseTabbedPage
      title="Warehouse Inbound"
      description="Review inbound requests, receive goods, and coordinate stock transfers from one workspace."
      tabs={[
        {
          id: 'requests',
          label: 'Inbound Requests',
          anyOf: [PERMISSIONS.MERCHANT_INBOUND_REQUESTS_VIEW, PERMISSIONS.MERCHANT_INBOUND_REQUESTS_MANAGE],
          countSources: [{
            queryKey: ['module-tab-count', 'warehouse-inbound', 'requests'],
            queryFn: async () => (await listMerchantInboundStockRequests()).data.length,
            anyOf: [PERMISSIONS.MERCHANT_INBOUND_REQUESTS_VIEW, PERMISSIONS.MERCHANT_INBOUND_REQUESTS_MANAGE],
          }],
          content: (onCountChange) => <InboundRequestsPanel embedded onCountChange={onCountChange} />,
        },
        {
          id: 'receipts',
          label: 'Warehouse Receipts',
          permission: PERMISSIONS.INVENTORY_VIEW,
          countSources: [{ queryKey: ['module-tab-count', 'warehouse-inbound', 'receipts'], queryFn: async () => (await listWarehouseReceipts()).data.length }],
          content: (onCountChange) => <WarehouseReceiptsPanel embedded onCountChange={onCountChange} />,
        },
        {
          id: 'transfers',
          label: 'Transfers',
          permission: PERMISSIONS.INVENTORY_VIEW,
          countSources: [{ queryKey: ['module-tab-count', 'warehouse-inbound', 'transfers'], queryFn: async () => (await listWarehouseTransfers()).data.length }],
          content: (onCountChange) => <WarehouseTransfersPanel embedded onCountChange={onCountChange} />,
        },
      ]}
    />
  )
}
