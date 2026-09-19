import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowDownToLine,
  ChevronLeft,
  ChevronRight,
  Database,
  Filter,
  Package,
  PackagePlus,
  Printer,
  RotateCcw,
  Search,
  X,
} from 'lucide-react'
import { getApiErrorMessage } from '../../../../shared/api/api-error'
import { EmptyState } from '../../../../shared/components/states/EmptyState'
import { ErrorState } from '../../../../shared/components/states/ErrorState'
import { Button } from '../../../../shared/components/ui/Button'
import { Dialog } from '../../../../shared/components/ui/Dialog'
import { Input } from '../../../../shared/components/ui/Input'
import { Select } from '../../../../shared/components/ui/Select'
import { Skeleton } from '../../../../shared/components/ui/Skeleton'
import { StatusBadge } from '../../../../shared/components/ui/StatusBadge'
import { Table, TableCell, TableContainer, TableHead } from '../../../../shared/components/ui/Table'
import { DropdownContent, DropdownItem, DropdownMenu, DropdownTrigger } from '../../../../shared/components/ui/Dropdown'
import { LabelDocumentDialog } from '../../../../shared/components/labels/LabelDocumentDialog'
import { merchantPath } from '../../../../shared/routing/paths'
import { formatDate } from '../../../../shared/utils/formatters'
import { createHtmlLabelDocument } from '../../../../shared/utils/printHtml'
import { useLocale } from '../../../../shared/i18n/useLocale'
import type { AppLocale } from '../../../../shared/i18n/locale'
import { CanMerchant } from '../../components/CanMerchant'
import {
  getMerchantPortalWarehouseProductLabel,
  listMerchantPortalWarehouseProducts,
} from '../api/merchantPortalWarehouse.api'
import { getMerchantPortalDashboardSummary } from '../../api/merchantPortal.api'
import type { MerchantPortalDashboardSummaryResponse } from '../../types/merchantPortal.types'
import type { MerchantPortalWarehouseProductFilters } from '../types/merchantPortalWarehouse.types'
import { BulkBarcodeLabelsDialog } from '../components/BulkBarcodeLabelsDialog'

type DetailedFilters = {
  status: string
  has_stock: string
  created_from: string
  created_to: string
  sku: string
  barcode: string
}

const initialDetailedFilters: DetailedFilters = {
  status: '',
  has_stock: '',
  created_from: '',
  created_to: '',
  sku: '',
  barcode: '',
}

export function MerchantWarehouseProductsPage() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const initialStockStatus = searchParams.get('stock_status') ?? ''
  const initialSearch = searchParams.get('search') ?? ''

  // Toolbar state
  const [activeTab, setActiveTab] = useState<'all' | 'low_stock'>(
    initialStockStatus === 'low_stock' ? 'low_stock' : 'all'
  )
  const [searchInput, setSearchInput] = useState(initialSearch)
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch)
  const [page, setPage] = useState(1)

  // Filters Modal state
  const [appliedFilters, setAppliedFilters] = useState<DetailedFilters>(initialDetailedFilters)
  const [draftFilters, setDraftFilters] = useState<DetailedFilters>(initialDetailedFilters)
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [filterError, setFilterError] = useState('')

  // Table selections
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([])

  // Label Printing State
  const [printState, setPrintState] = useState<{ productId: number; type: 'label' } | null>(null)
  const [isBulkPrintOpen, setIsBulkPrintOpen] = useState(false)

  // 300ms Debounce on Search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  // Sync state to URL search parameters without losing back/forward history
  useEffect(() => {
    const nextParams = new URLSearchParams()
    if (activeTab === 'low_stock') {
      nextParams.set('stock_status', 'low_stock')
    }
    if (debouncedSearch.trim()) {
      nextParams.set('search', debouncedSearch.trim())
    }
    setSearchParams(nextParams, { replace: true })
  }, [activeTab, debouncedSearch, setSearchParams])

  // Reset page to 1 when search or tab changes
  function handleSearchChange(value: string) {
    setSearchInput(value)
    setPage(1)
  }

  function handleClearSearch() {
    setSearchInput('')
    setDebouncedSearch('')
    setPage(1)
  }

  function handleTabChange(tab: 'all' | 'low_stock') {
    setActiveTab(tab)
    setPage(1)
  }

  // Construct backend-safe query parameters
  const queryFilters = useMemo<MerchantPortalWarehouseProductFilters>(() => {
    const params: MerchantPortalWarehouseProductFilters = {}

    if (debouncedSearch.trim()) {
      params.search = debouncedSearch.trim()
    }
    if (activeTab === 'low_stock') {
      params.low_stock = true
    }
    if (appliedFilters.status) {
      params.status = appliedFilters.status
    }
    if (appliedFilters.has_stock === 'true') {
      params.has_stock = true
    } else if (appliedFilters.has_stock === 'false') {
      params.has_stock = false
    }
    if (appliedFilters.created_from) {
      params.created_from = appliedFilters.created_from
    }
    if (appliedFilters.created_to) {
      params.created_to = appliedFilters.created_to
    }
    if (appliedFilters.sku.trim()) {
      params.sku = appliedFilters.sku.trim()
    }
    if (appliedFilters.barcode.trim()) {
      params.barcode = appliedFilters.barcode.trim()
    }

    return params
  }, [debouncedSearch, activeTab, appliedFilters])

  // Queries
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['merchant-portal', 'warehouse-products', page, queryFilters],
    queryFn: () => listMerchantPortalWarehouseProducts(page, queryFilters),
  })

  const dashboardQuery = useQuery<{ data: MerchantPortalDashboardSummaryResponse }>({
    queryKey: ['merchant-portal', 'dashboard-summary'],
    queryFn: () => getMerchantPortalDashboardSummary(),
  })

  // Summary Metrics
  const wh = dashboardQuery.data?.data?.warehouse
  const totalProducts = wh?.warehouse_products_count ?? wh?.total_products ?? 0
  const totalStock =
    wh?.total_stock ??
    (wh?.total_available_quantity ?? 0) + (wh?.total_reserved_quantity ?? 0)
  const lowStockAlerts = wh?.low_stock_count ?? wh?.low_stock_products ?? 0
  const inboundRequests =
    wh?.inbound_requests_pending_count ?? wh?.total_inbound_requests ?? 0

  // Server-side / fallback Pagination calculation
  const rawProducts = data?.data ?? []
  const meta = data?.meta
  const isServerPaginated = Boolean(meta && typeof meta.total === 'number')

  const totalCount = isServerPaginated ? (meta.total as number) : rawProducts.length
  const perPage = isServerPaginated ? (meta.per_page as number) : 10
  const totalPages = isServerPaginated
    ? (meta.last_page as number)
    : Math.max(1, Math.ceil(totalCount / perPage))

  const products = useMemo(() => {
    if (isServerPaginated) return rawProducts
    const start = (page - 1) * perPage
    return rawProducts.slice(start, start + perPage)
  }, [isServerPaginated, rawProducts, page, perPage])

  const from = totalCount > 0 ? (page - 1) * perPage + 1 : 0
  const to = totalCount > 0 ? Math.min(page * perPage, totalCount) : 0

  // Modal Handlers
  function openFiltersModal() {
    setDraftFilters({ ...appliedFilters })
    setFilterError('')
    setIsFiltersOpen(true)
  }

  function closeFiltersModal() {
    setIsFiltersOpen(false)
    setFilterError('')
  }

  function handleResetDraftFilters() {
    setDraftFilters(initialDetailedFilters)
    setFilterError('')
  }

  function handleApplyFilters() {
    if (draftFilters.created_from && draftFilters.created_to) {
      if (new Date(draftFilters.created_from) > new Date(draftFilters.created_to)) {
        setFilterError(
          t('Start date cannot be after end date.', {
            defaultValue: 'Start date cannot be after end date.',
          })
        )
        return
      }
    }
    setAppliedFilters({ ...draftFilters })
    setPage(1)
    setIsFiltersOpen(false)
  }

  // Applied filter chips
  const activeFilterChips = useMemo(() => {
    const chips: Array<{ key: keyof DetailedFilters; label: string }> = []
    if (appliedFilters.status) {
      chips.push({
        key: 'status',
        label: `${t('Status', { defaultValue: 'Status' })}: ${
          appliedFilters.status === 'active'
            ? t('Active', { defaultValue: 'Active' })
            : t('Inactive', { defaultValue: 'Inactive' })
        }`,
      })
    }
    if (appliedFilters.has_stock) {
      chips.push({
        key: 'has_stock',
        label: `${t('Stock', { defaultValue: 'Stock' })}: ${
          appliedFilters.has_stock === 'true'
            ? t('In Stock', { defaultValue: 'In Stock' })
            : t('Out of Stock', { defaultValue: 'Out of Stock' })
        }`,
      })
    }
    if (appliedFilters.created_from) {
      chips.push({
        key: 'created_from',
        label: `${t('From', { defaultValue: 'From' })}: ${appliedFilters.created_from}`,
      })
    }
    if (appliedFilters.created_to) {
      chips.push({
        key: 'created_to',
        label: `${t('To', { defaultValue: 'To' })}: ${appliedFilters.created_to}`,
      })
    }
    if (appliedFilters.sku) {
      chips.push({
        key: 'sku',
        label: `SKU: ${appliedFilters.sku}`,
      })
    }
    if (appliedFilters.barcode) {
      chips.push({
        key: 'barcode',
        label: `${t('Barcode', { defaultValue: 'Barcode' })}: ${appliedFilters.barcode}`,
      })
    }
    return chips
  }, [appliedFilters, t])

  const activeFilterCount = activeFilterChips.length
  const hasActiveFilters = activeFilterCount > 0
  const hasAnySearchOrFilter = hasActiveFilters || Boolean(debouncedSearch.trim())

  function handleRemoveFilter(key: keyof DetailedFilters) {
    setAppliedFilters((prev) => ({ ...prev, [key]: '' }))
    setDraftFilters((prev) => ({ ...prev, [key]: '' }))
    setPage(1)
  }

  function handleClearAllFilters() {
    setAppliedFilters(initialDetailedFilters)
    setDraftFilters(initialDetailedFilters)
    setPage(1)
  }

  function handleClearAllCriteria() {
    handleClearSearch()
    setActiveTab('all')
    handleClearAllFilters()
  }

  // Row selection for bulk actions
  const isAllSelected =
    products.length > 0 && products.every((p) => selectedProductIds.includes(p.id))

  function handleToggleSelectAll() {
    if (isAllSelected) {
      setSelectedProductIds((prev) =>
        prev.filter((id) => !products.some((p) => p.id === id))
      )
    } else {
      setSelectedProductIds((prev) =>
        Array.from(new Set([...prev, ...products.map((p) => p.id)]))
      )
    }
  }

  function handleToggleSelect(productId: number) {
    setSelectedProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    )
  }

  // Products to pass to BulkBarcodeLabelsDialog
  const productsForBulkPrint = useMemo(() => {
    if (selectedProductIds.length > 0) {
      return rawProducts.filter((p) => selectedProductIds.includes(p.id))
    }
    return rawProducts
  }, [rawProducts, selectedProductIds])

  return (
    <div className="merchant-products-page">
      {/* 1. Compact Page Header */}
      <header className="merchant-products-header">
        <div className="merchant-products-header__copy">
          <p className="eyebrow">{t('WAREHOUSE MANAGEMENT', { defaultValue: 'WAREHOUSE MANAGEMENT' })}</p>
          <h1>{t('Products & Inventory', { defaultValue: 'Products & Inventory' })}</h1>
          <p>
            {t(
              'Manage your catalog, stock balances, and low-stock items.',
              { defaultValue: 'Manage your catalog, stock balances, and low-stock items.' }
            )}
          </p>
        </div>
        <div className="merchant-products-header__actions">
          <CanMerchant capability="labels.print">
            <Button
              variant="secondary"
              onClick={() => setIsBulkPrintOpen(true)}
              aria-label={t('Print Bulk Labels', { defaultValue: 'Print Bulk Labels' })}
            >
              <Printer size={16} />
              <span>{t('Print Bulk Labels', { defaultValue: 'Print Bulk Labels' })}</span>
              {selectedProductIds.length > 0 ? (
                <span className="font-mono text-xs opacity-80">({selectedProductIds.length})</span>
              ) : null}
            </Button>
          </CanMerchant>
          <CanMerchant capability="warehouse.inbound_requests.create">
            <Button
              className="merchant-products-btn--inbound"
              onClick={() => navigate(merchantPath('/warehouse/inbound-requests/create'))}
              aria-label={t('Request Inbound', { defaultValue: 'Request Inbound' })}
            >
              <PackagePlus size={16} />
              <span>{t('Request Inbound', { defaultValue: 'Request Inbound' })}</span>
            </Button>
          </CanMerchant>
        </div>
      </header>

      {/* 2. Inventory Summary Cards (4 Equal-Height Cards) */}
      <div className="merchant-products-kpis">
        {/* Total Products (Blue) */}
        <div className="merchant-products-kpi merchant-products-kpi--blue">
          <div className="merchant-products-kpi__header">
            <span className="merchant-products-kpi__label">
              {t('Total Products', { defaultValue: 'Total Products' })}
            </span>
            <div className="merchant-products-kpi__icon merchant-products-kpi__icon--blue" aria-hidden="true">
              <Package size={18} />
            </div>
          </div>
          <div className="merchant-products-kpi__value">
            {dashboardQuery.isLoading ? <Skeleton className="h-8 w-16" /> : totalProducts}
          </div>
        </div>

        {/* Total Stock (Green) */}
        <div className="merchant-products-kpi merchant-products-kpi--green">
          <div className="merchant-products-kpi__header">
            <span className="merchant-products-kpi__label">
              {t('Total Stock', { defaultValue: 'Total Stock' })}
            </span>
            <div className="merchant-products-kpi__icon merchant-products-kpi__icon--green" aria-hidden="true">
              <Database size={18} />
            </div>
          </div>
          <div className="merchant-products-kpi__value">
            {dashboardQuery.isLoading ? <Skeleton className="h-8 w-16" /> : totalStock}
          </div>
        </div>

        {/* Low Stock Alerts (Amber) */}
        <div className="merchant-products-kpi merchant-products-kpi--amber">
          <div className="merchant-products-kpi__header">
            <span className="merchant-products-kpi__label">
              {t('Low Stock Alerts', { defaultValue: 'Low Stock Alerts' })}
            </span>
            <div className="merchant-products-kpi__icon merchant-products-kpi__icon--amber" aria-hidden="true">
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="merchant-products-kpi__value">
            {dashboardQuery.isLoading ? <Skeleton className="h-8 w-16" /> : lowStockAlerts}
          </div>
        </div>

        {/* Inbound Requests (Cyan / Teal) */}
        <div className="merchant-products-kpi merchant-products-kpi--teal">
          <div className="merchant-products-kpi__header">
            <span className="merchant-products-kpi__label">
              {t('Inbound Requests', { defaultValue: 'Inbound Requests' })}
            </span>
            <div className="merchant-products-kpi__icon merchant-products-kpi__icon--teal" aria-hidden="true">
              <ArrowDownToLine size={18} />
            </div>
          </div>
          <div className="merchant-products-kpi__value">
            {dashboardQuery.isLoading ? <Skeleton className="h-8 w-16" /> : inboundRequests}
          </div>
        </div>
      </div>

      {/* 3. Product Workspace Toolbar */}
      <div className="merchant-products-toolbar">
        {/* Search Input */}
        <div className="merchant-products-search">
          <Search className="merchant-products-search__icon" size={17} aria-hidden="true" />
          <input
            type="text"
            className="merchant-products-search__input"
            placeholder={t(
              'Search by product name, SKU, or barcode',
              { defaultValue: 'Search by product name, SKU, or barcode' }
            )}
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            aria-label={t('Search products', { defaultValue: 'Search products' })}
          />
          {searchInput ? (
            <button
              type="button"
              className="merchant-products-search__clear"
              onClick={handleClearSearch}
              aria-label={t('Clear search', { defaultValue: 'Clear search' })}
            >
              <X size={14} />
            </button>
          ) : null}
        </div>

        {/* Segmented Control Tabs */}
        <div
          className="merchant-products-tabs"
          role="tablist"
          aria-label={t('Product view tabs', { defaultValue: 'Product view tabs' })}
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'all'}
            className={`merchant-products-tab ${activeTab === 'all' ? 'merchant-products-tab--active' : ''}`}
            onClick={() => handleTabChange('all')}
          >
            {t('All Products', { defaultValue: 'All Products' })}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'low_stock'}
            className={`merchant-products-tab ${activeTab === 'low_stock' ? 'merchant-products-tab--active' : ''}`}
            onClick={() => handleTabChange('low_stock')}
          >
            <AlertTriangle size={14} />
            <span>{t('Low Stock', { defaultValue: 'Low Stock' })}</span>
          </button>
        </div>

        {/* Filters Button with Count Badge */}
        <Button
          type="button"
          variant="secondary"
          className="merchant-products-filter-btn"
          aria-expanded={isFiltersOpen}
          aria-haspopup="dialog"
          onClick={openFiltersModal}
        >
          <Filter size={16} />
          <span>{t('Filters', { defaultValue: 'Filters' })}</span>
          {activeFilterCount > 0 ? (
            <span className="merchant-products-filter-count">{activeFilterCount}</span>
          ) : null}
        </Button>
      </div>

      {/* 4. Applied Filter Chips */}
      {activeFilterChips.length > 0 ? (
        <div
          className="merchant-products-chips"
          aria-label={t('Applied product filters', { defaultValue: 'Applied product filters' })}
        >
          {activeFilterChips.map((chip) => (
            <span className="merchant-products-chip" key={chip.key}>
              <span>{chip.label}</span>
              <button
                type="button"
                aria-label={t('Remove {{filter}} filter', {
                  defaultValue: `Remove ${chip.label} filter`,
                  filter: chip.label,
                })}
                onClick={() => handleRemoveFilter(chip.key)}
              >
                <X size={13} />
              </button>
            </span>
          ))}
          {activeFilterChips.length > 1 ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={handleClearAllFilters}
            >
              {t('Clear all', { defaultValue: 'Clear all' })}
            </Button>
          ) : null}
        </div>
      ) : null}

      {/* 5. Products Table */}
      <div className="merchant-products-table-card">
        {isLoading ? (
          <TableContainer>
            <Table>
              <thead>
                <tr>
                  <TableHead style={{ width: '40px' }} />
                  <TableHead>{t('Product Name', { defaultValue: 'Product Name' })}</TableHead>
                  <TableHead>{t('SKU', { defaultValue: 'SKU' })}</TableHead>
                  <TableHead>{t('Barcode', { defaultValue: 'Barcode' })}</TableHead>
                  <TableHead>{t('Warehouses', { defaultValue: 'Warehouses' })}</TableHead>
                  <TableHead className="text-right">{t('Total Stock', { defaultValue: 'Total Stock' })}</TableHead>
                  <TableHead className="text-right">{t('Available', { defaultValue: 'Available' })}</TableHead>
                  <TableHead className="text-right">{t('Reserved', { defaultValue: 'Reserved' })}</TableHead>
                  <TableHead>{t('Status', { defaultValue: 'Status' })}</TableHead>
                  <TableHead>{t('Created At', { defaultValue: 'Created At' })}</TableHead>
                  <TableHead className="text-right">{t('Actions', { defaultValue: 'Actions' })}</TableHead>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx}>
                    <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-10 ml-auto" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-10 ml-auto" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-10 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-6 w-14 ml-auto" /></TableCell>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableContainer>
        ) : isError ? (
          <ErrorState
            message={getApiErrorMessage(error)}
            onRetry={() => void refetch()}
          />
        ) : products.length === 0 ? (
          activeTab === 'low_stock' && !hasAnySearchOrFilter ? (
            <EmptyState
              title={t('No low-stock products', { defaultValue: 'No low-stock products' })}
              description={t(
                'All products currently have sufficient available stock.',
                { defaultValue: 'All products currently have sufficient available stock.' }
              )}
            />
          ) : hasAnySearchOrFilter ? (
            <EmptyState
              title={t('No products match your search or filters', { defaultValue: 'No products match your search or filters' })}
              description={t(
                'Try changing your search or clearing the applied filters.',
                { defaultValue: 'Try changing your search or clearing the applied filters.' }
              )}
              actionLabel={t('Clear filters', { defaultValue: 'Clear filters' })}
              onAction={handleClearAllCriteria}
            />
          ) : (
            <EmptyState
              title={t('No products yet', { defaultValue: 'No products yet' })}
              description={t(
                'Your warehouse products will appear here.',
                { defaultValue: 'Your warehouse products will appear here.' }
              )}
              action={
                <CanMerchant capability="warehouse.inbound_requests.create">
                  <Button
                    className="merchant-products-btn--inbound"
                    onClick={() => navigate(merchantPath('/warehouse/inbound-requests/create'))}
                  >
                    <PackagePlus size={16} />
                    <span>{t('Request Inbound', { defaultValue: 'Request Inbound' })}</span>
                  </Button>
                </CanMerchant>
              }
            />
          )
        ) : (
          <TableContainer>
            <Table>
              <thead>
                <tr>
                  <TableHead style={{ width: '40px' }}>
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={handleToggleSelectAll}
                      aria-label={t('Select all products on this page', { defaultValue: 'Select all products on this page' })}
                      className="cursor-pointer rounded"
                    />
                  </TableHead>
                  <TableHead>{t('Product Name', { defaultValue: 'Product Name' })}</TableHead>
                  <TableHead>{t('SKU', { defaultValue: 'SKU' })}</TableHead>
                  <TableHead>{t('Barcode', { defaultValue: 'Barcode' })}</TableHead>
                  <TableHead>{t('Warehouses', { defaultValue: 'Warehouses' })}</TableHead>
                  <TableHead className="text-right">{t('Total Stock', { defaultValue: 'Total Stock' })}</TableHead>
                  <TableHead className="text-right">{t('Available', { defaultValue: 'Available' })}</TableHead>
                  <TableHead className="text-right">{t('Reserved', { defaultValue: 'Reserved' })}</TableHead>
                  <TableHead>{t('Status', { defaultValue: 'Status' })}</TableHead>
                  <TableHead>{t('Created At', { defaultValue: 'Created At' })}</TableHead>
                  <TableHead className="text-right">{t('Actions', { defaultValue: 'Actions' })}</TableHead>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const summary = product.inventory_summary
                  const available = summary?.available_quantity ?? 0
                  const isLowStock = product.low_stock
                  const isSelected = selectedProductIds.includes(product.id)

                  return (
                    <tr key={product.id} className={isSelected ? 'bg-slate-500/10' : undefined}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(product.id)}
                          aria-label={t('Select product {{name}}', {
                            defaultValue: `Select product ${product.name}`,
                            name: product.name,
                          })}
                          className="cursor-pointer rounded"
                        />
                      </TableCell>
                      <TableCell>
                        <Link
                          className="merchant-product-name-link"
                          to={merchantPath(`/warehouse/products/${product.id}`)}
                          title={product.name}
                        >
                          {product.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <span className="merchant-product-sku-badge">{product.sku}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs text-muted">{product.barcode || '—'}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {summary?.warehouses_count ?? 1}{' '}
                          {(summary?.warehouses_count ?? 1) === 1
                            ? t('location', { defaultValue: 'location' })
                            : t('locations', { defaultValue: 'locations' })}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {summary?.on_hand_quantity ?? 0}
                      </TableCell>
                      <TableCell className="text-right font-bold text-success">
                        {available}
                      </TableCell>
                      <TableCell className="text-right font-medium text-warning">
                        {summary?.reserved_quantity ?? 0}
                      </TableCell>
                      <TableCell>
                        {isLowStock ? (
                          <span className="merchant-low-stock-badge">
                            <AlertTriangle size={12} />
                            <span>{t('Low Stock', { defaultValue: 'Low Stock' })}</span>
                          </span>
                        ) : (
                          <StatusBadge value={product.status}>
                            {product.status_label ||
                              (product.status === 'active'
                                ? t('Active', { defaultValue: 'Active' })
                                : t('Inactive', { defaultValue: 'Inactive' }))}
                          </StatusBadge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted whitespace-nowrap">
                        {formatDate(product.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu align="end">
                          <DropdownTrigger className="ui-button ui-button--secondary ui-button--sm">
                            {t('Actions', { defaultValue: 'Actions' })}
                          </DropdownTrigger>
                          <DropdownContent>
                            <Link
                              className="ui-link-reset"
                              to={merchantPath(`/warehouse/products/${product.id}`)}
                            >
                              <DropdownItem>{t('View Details', { defaultValue: 'View Details' })}</DropdownItem>
                            </Link>
                            <CanMerchant capability="labels.print">
                              <DropdownItem
                                onClick={() => setPrintState({ productId: product.id, type: 'label' })}
                              >
                                {t('Print Barcode Label', { defaultValue: 'Print Barcode Label' })}
                              </DropdownItem>
                            </CanMerchant>
                          </DropdownContent>
                        </DropdownMenu>
                      </TableCell>
                    </tr>
                  )
                })}
              </tbody>
            </Table>
          </TableContainer>
        )}
      </div>

      {/* 6. Pagination */}
      {!isLoading && !isError && totalCount > 0 ? (
        <nav
          className="merchant-products-pagination"
          aria-label={t('Products pagination', { defaultValue: 'Products pagination' })}
        >
          <p>
            {t('Showing {{from}}–{{to}} of {{total}} products', {
              defaultValue: `Showing ${from}–${to} of ${totalCount} products`,
              from,
              to,
              total: totalCount,
            })}
          </p>
          <div className="merchant-products-pagination__controls">
            <Button
              aria-label={t('Previous page', { defaultValue: 'Previous page' })}
              disabled={page <= 1}
              size="sm"
              type="button"
              variant="secondary"
              onClick={() => setPage(Math.max(1, page - 1))}
            >
              {locale === 'ar' ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              <span>{t('Previous', { defaultValue: 'Previous' })}</span>
            </Button>
            <span aria-current="page" className="merchant-products-pagination__current">
              {page}
            </span>
            <Button
              aria-label={t('Next page', { defaultValue: 'Next page' })}
              disabled={page >= totalPages}
              size="sm"
              type="button"
              variant="secondary"
              onClick={() => setPage(Math.min(totalPages, page + 1))}
            >
              <span>{t('Next', { defaultValue: 'Next' })}</span>
              {locale === 'ar' ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </Button>
          </div>
        </nav>
      ) : null}

      {/* 7. Centered Filters Popup/Modal */}
      <Dialog
        open={isFiltersOpen}
        onClose={closeFiltersModal}
        variant="filters"
        closeLabel={t('Close product filters', { defaultValue: 'Close product filters' })}
        title={<h2 className="merchant-shipment-filter-title">{t('Filter Products', { defaultValue: 'Filter Products' })}</h2>}
        description={t(
          'Narrow the product list using one or more filters.',
          { defaultValue: 'Narrow the product list using one or more filters.' }
        )}
        footer={
          <div className="merchant-product-filter-footer">
            <Button
              type="button"
              variant="secondary"
              onClick={handleResetDraftFilters}
            >
              <RotateCcw size={15} />
              <span>{t('Reset Filters', { defaultValue: 'Reset Filters' })}</span>
            </Button>
            <div className="merchant-product-filter-footer__actions">
              <Button type="button" variant="ghost" onClick={closeFiltersModal}>
                {t('Cancel', { defaultValue: 'Cancel' })}
              </Button>
              <Button
                form="merchant-products-filter-form"
                type="submit"
                variant="primary"
              >
                {t('Apply Filters', { defaultValue: 'Apply Filters' })}
              </Button>
            </div>
          </div>
        }
      >
        <form
          id="merchant-products-filter-form"
          className="merchant-product-filter-form"
          onSubmit={(e) => {
            e.preventDefault()
            handleApplyFilters()
          }}
        >
          <div className="merchant-product-filter-grid">
            {/* Product Status */}
            <label className="field">
              <span>{t('Product Status', { defaultValue: 'Product Status' })}</span>
              <Select
                data-dialog-initial-focus="true"
                value={draftFilters.status}
                onChange={(e) => setDraftFilters((prev) => ({ ...prev, status: e.target.value }))}
              >
                <option value="">{t('All Statuses', { defaultValue: 'All Statuses' })}</option>
                <option value="active">{t('Active', { defaultValue: 'Active' })}</option>
                <option value="inactive">{t('Inactive', { defaultValue: 'Inactive' })}</option>
              </Select>
            </label>

            {/* Stock Availability */}
            <label className="field">
              <span>{t('Stock Availability', { defaultValue: 'Stock Availability' })}</span>
              <Select
                value={draftFilters.has_stock}
                onChange={(e) => setDraftFilters((prev) => ({ ...prev, has_stock: e.target.value }))}
              >
                <option value="">{t('All Stock Levels', { defaultValue: 'All Stock Levels' })}</option>
                <option value="true">{t('In Stock', { defaultValue: 'In Stock' })}</option>
                <option value="false">{t('Out of Stock', { defaultValue: 'Out of Stock' })}</option>
              </Select>
            </label>

            {/* Created Date From */}
            <label className="field">
              <span>{t('Created Date From', { defaultValue: 'Created Date From' })}</span>
              <Input
                type="date"
                value={draftFilters.created_from}
                onChange={(e) => {
                  setDraftFilters((prev) => ({ ...prev, created_from: e.target.value }))
                  setFilterError('')
                }}
              />
            </label>

            {/* Created Date To */}
            <label className="field">
              <span>{t('Created Date To', { defaultValue: 'Created Date To' })}</span>
              <Input
                type="date"
                value={draftFilters.created_to}
                onChange={(e) => {
                  setDraftFilters((prev) => ({ ...prev, created_to: e.target.value }))
                  setFilterError('')
                }}
              />
            </label>

            {/* SKU */}
            <label className="field">
              <span>{t('SKU', { defaultValue: 'SKU' })}</span>
              <Input
                type="text"
                placeholder={t('e.g. SKU-1001', { defaultValue: 'e.g. SKU-1001' })}
                value={draftFilters.sku}
                onChange={(e) => setDraftFilters((prev) => ({ ...prev, sku: e.target.value }))}
              />
            </label>

            {/* Barcode */}
            <label className="field">
              <span>{t('Barcode', { defaultValue: 'Barcode' })}</span>
              <Input
                type="text"
                placeholder={t('e.g. 1234567890', { defaultValue: 'e.g. 1234567890' })}
                value={draftFilters.barcode}
                onChange={(e) => setDraftFilters((prev) => ({ ...prev, barcode: e.target.value }))}
              />
            </label>
          </div>

          {filterError ? (
            <div className="form-error" role="alert">
              {filterError}
            </div>
          ) : null}
        </form>
      </Dialog>

      {/* Single Label Print Dialog */}
      {printState ? (
        <LabelDocumentDialog
          fetchDocument={async () => {
            const res = await getMerchantPortalWarehouseProductLabel(printState.productId)
            return createHtmlLabelDocument({
              html: res.data.html || '',
              fileName: `product-label-${printState.productId}.html`,
              locale: (document.documentElement.lang || 'en') as AppLocale,
              title: t('Product Label', { defaultValue: 'Product Label' }),
            })
          }}
          open={true}
          title={t('Product Label', { defaultValue: 'Product Label' })}
          triggerLabel={t('Print', { defaultValue: 'Print' })}
          hideTrigger={true}
          onOpenChange={(open) => {
            if (!open) setPrintState(null)
          }}
        />
      ) : null}

      {/* Bulk Labels Print Dialog */}
      <BulkBarcodeLabelsDialog
        products={productsForBulkPrint}
        open={isBulkPrintOpen}
        onClose={() => setIsBulkPrintOpen(false)}
      />
    </div>
  )
}
