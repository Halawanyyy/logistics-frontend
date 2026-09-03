import { lazy, useEffect, useState } from 'react'
import { Can } from '../../../shared/auth/Can'
import { PERMISSIONS } from '../../../shared/auth/permission-keys'
import { WarehouseTabbedPage } from '../components/WarehouseTabbedPage'
import { WarehouseLocationsPanel } from './WarehouseLocationsPage'
import {
  listInventoryStocks,
  listStockMovements,
  listStockReservations,
  listWarehouseBins,
  listWarehouseProducts,
  listWarehouseShelves,
  listWarehouseZones,
} from '../api/warehouse.api'
import { listCompanyCatalogItems } from '../../company-catalog/api/companyCatalog.api'

const CompanyCatalogPanel = lazy(() => import('../../company-catalog/pages/CompanyCatalogListPage').then((module) => ({ default: module.CompanyCatalogPanel })))
const InventoryStocksPanel = lazy(() => import('./InventoryStocksPage').then((module) => ({ default: module.InventoryStocksPanel })))
const StockMovementsPanel = lazy(() => import('./StockMovementsPage').then((module) => ({ default: module.StockMovementsPanel })))
const StockReservationsPanel = lazy(() => import('./StockReservationsPage').then((module) => ({ default: module.StockReservationsPanel })))
const WarehouseProductsPanel = lazy(() => import('./WarehouseProductsPage').then((module) => ({ default: module.WarehouseProductsPanel })))

export function WarehouseInventoryPage() {
  return (
    <WarehouseTabbedPage
      title="Warehouse Inventory"
      description="Manage products, catalog items, stock balances, movements, and reservations."
      tabs={[
        {
          id: 'products',
          label: 'Products',
          anyOf: [PERMISSIONS.INVENTORY_VIEW, PERMISSIONS.COMPANY_CATALOG_VIEW],
          countSources: [
            { queryKey: ['module-tab-count', 'warehouse-inventory', 'products'], queryFn: async () => (await listWarehouseProducts()).data.length, permission: PERMISSIONS.INVENTORY_VIEW },
            { queryKey: ['module-tab-count', 'warehouse-inventory', 'catalog'], queryFn: async () => (await listCompanyCatalogItems()).data.length, permission: PERMISSIONS.COMPANY_CATALOG_VIEW },
          ],
          content: (onCountChange) => <ProductsTabPanel onCountChange={onCountChange} />,
        },
        { id: 'stocks', label: 'Stocks', permission: PERMISSIONS.INVENTORY_VIEW, countSources: [{ queryKey: ['module-tab-count', 'warehouse-inventory', 'stocks'], queryFn: async () => (await listInventoryStocks()).data.length }], content: (onCountChange) => <InventoryStocksPanel embedded onCountChange={onCountChange} /> },
        { id: 'movements', label: 'Movements', permission: PERMISSIONS.STOCK_MOVEMENTS_VIEW, countSources: [{ queryKey: ['module-tab-count', 'warehouse-inventory', 'movements'], queryFn: async () => (await listStockMovements()).data.length }], content: (onCountChange) => <StockMovementsPanel embedded onCountChange={onCountChange} /> },
        { id: 'reservations', label: 'Reservations', permission: PERMISSIONS.INVENTORY_VIEW, countSources: [{ queryKey: ['module-tab-count', 'warehouse-inventory', 'reservations'], queryFn: async () => (await listStockReservations()).data.length }], content: (onCountChange) => <StockReservationsPanel embedded onCountChange={onCountChange} /> },
        {
          id: 'locations',
          label: 'Locations',
          permission: PERMISSIONS.WAREHOUSE_LOCATIONS_VIEW,
          countSources: [
            { queryKey: ['module-tab-count', 'warehouse-inventory', 'zones'], queryFn: async () => (await listWarehouseZones()).data.length },
            { queryKey: ['module-tab-count', 'warehouse-inventory', 'shelves'], queryFn: async () => (await listWarehouseShelves()).data.length },
            { queryKey: ['module-tab-count', 'warehouse-inventory', 'bins'], queryFn: async () => (await listWarehouseBins()).data.length },
          ],
          content: (onCountChange) => <WarehouseLocationsPanel embedded onCountChange={onCountChange} />,
        },
      ]}
    />
  )
}

function ProductsTabPanel({ onCountChange }: { onCountChange: (count: number) => void }) {
  const [productCount, setProductCount] = useState(0)
  const [catalogCount, setCatalogCount] = useState(0)

  useEffect(() => {
    onCountChange(productCount + catalogCount)
  }, [catalogCount, onCountChange, productCount])

  return (
    <div className="page-stack">
      <Can permission={PERMISSIONS.INVENTORY_VIEW}>
        <WarehouseProductsPanel embedded onCountChange={setProductCount} />
      </Can>
      <Can permission={PERMISSIONS.COMPANY_CATALOG_VIEW}>
        <section className="warehouse-module-page__merged-section">
          <CompanyCatalogPanel embedded onCountChange={setCatalogCount} />
        </section>
      </Can>
    </div>
  )
}
