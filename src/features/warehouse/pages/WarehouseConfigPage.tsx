import { lazy } from 'react'
import { PERMISSIONS } from '../../../shared/auth/permission-keys'
import { WarehouseTabbedPage } from '../components/WarehouseTabbedPage'
import { PickPackFeeRulesPanel } from './PickPackFeeRulesPage'
import { StorageFeeRulesPanel } from './StorageFeeRulesPage'
import { listPickPackFeeRules, listStorageFeeRules, listWarehouseCharges, listWarehouseReturns } from '../api/warehouse.api'

const WarehouseChargesPanel = lazy(() => import('./WarehouseChargesPage').then((module) => ({ default: module.WarehouseChargesPanel })))
const WarehouseReturnsPanel = lazy(() => import('./WarehouseReturnsPage').then((module) => ({ default: module.WarehouseReturnsPanel })))

export function WarehouseConfigPage() {
  return (
    <WarehouseTabbedPage
      title="Warehouse Configuration"
      description="Process warehouse returns and maintain charges, storage fees, and pick-and-pack rules."
      tabs={[
        { id: 'returns', label: 'Returns', permission: PERMISSIONS.WAREHOUSE_RETURNS_VIEW, countSources: [{ queryKey: ['module-tab-count', 'warehouse-config', 'returns'], queryFn: async () => (await listWarehouseReturns()).data.length }], content: (onCountChange) => <WarehouseReturnsPanel embedded onCountChange={onCountChange} /> },
        { id: 'charges', label: 'Charges', permission: PERMISSIONS.WAREHOUSE_CHARGES_VIEW, countSources: [{ queryKey: ['module-tab-count', 'warehouse-config', 'charges'], queryFn: async () => (await listWarehouseCharges()).data.length }], content: (onCountChange) => <WarehouseChargesPanel embedded onCountChange={onCountChange} /> },
        { id: 'storage-fees', label: 'Storage Fee Rules', permission: PERMISSIONS.STORAGE_FEE_RULES_VIEW, countSources: [{ queryKey: ['module-tab-count', 'warehouse-config', 'storage-fees'], queryFn: async () => (await listStorageFeeRules()).data.length }], content: (onCountChange) => <StorageFeeRulesPanel embedded onCountChange={onCountChange} /> },
        { id: 'pick-pack-fees', label: 'Pick & Pack Fee Rules', permission: PERMISSIONS.PICK_PACK_FEE_RULES_VIEW, countSources: [{ queryKey: ['module-tab-count', 'warehouse-config', 'pick-pack-fees'], queryFn: async () => (await listPickPackFeeRules()).data.length }], content: (onCountChange) => <PickPackFeeRulesPanel embedded onCountChange={onCountChange} /> },
      ]}
    />
  )
}
