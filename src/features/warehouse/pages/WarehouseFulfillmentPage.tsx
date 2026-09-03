import { PERMISSIONS } from '../../../shared/auth/permission-keys'
import { WarehouseTabbedPage } from '../components/WarehouseTabbedPage'
import { PackingTasksPanel } from './PackingTasksPage'
import { PickingListsPanel } from './PickingListsPage'
import { listPackingTasks, listPickingLists } from '../api/warehouse.api'

export function WarehouseFulfillmentPage() {
  return (
    <WarehouseTabbedPage
      title="Warehouse Fulfillment"
      description="Coordinate picking, packing, and return-processing workflows."
      tabs={[
        { id: 'picking', label: 'Picking Lists', permission: PERMISSIONS.PICKING_LISTS_VIEW, countSources: [{ queryKey: ['module-tab-count', 'warehouse-fulfillment', 'picking'], queryFn: async () => (await listPickingLists()).data.length }], content: (onCountChange) => <PickingListsPanel embedded onCountChange={onCountChange} /> },
        { id: 'packing', label: 'Packing Tasks', permission: PERMISSIONS.PACKING_TASKS_VIEW, countSources: [{ queryKey: ['module-tab-count', 'warehouse-fulfillment', 'packing'], queryFn: async () => (await listPackingTasks()).data.length }], content: (onCountChange) => <PackingTasksPanel embedded onCountChange={onCountChange} /> },
      ]}
    />
  )
}
