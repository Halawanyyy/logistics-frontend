import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { listDrivers } from '../../../features/drivers/api/drivers.api'
import { listMerchants } from '../../../features/merchants/api/merchants.api'
import { listOrders } from '../../../features/orders/api/orders.api'
import { listShipments } from '../../../features/shipments/api/shipments.api'
import { listWarehouseProducts } from '../../../features/warehouse/api/warehouse.api'
import type { AuthUser } from '../../../features/auth/types/auth.types'
import type { Driver } from '../../../features/drivers/types/driver.types'
import type { Merchant } from '../../../features/merchants/types/merchant.types'
import type { Order } from '../../../features/orders/types/order.types'
import type { Shipment } from '../../../features/shipments/types/shipment.types'
import type { WarehouseProduct } from '../../../features/warehouse/types/warehouse.types'
import { PERMISSIONS } from '../../auth/permission-keys'
import { hasPermission } from '../../auth/permissions'
import { adminPath } from '../../routing/paths'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

const MIN_QUERY_LENGTH = 2
const SEARCH_DEBOUNCE_MS = 300
const MAX_RESULTS_PER_GROUP = 4

type SearchGroupKey = 'orders' | 'shipments' | 'merchants' | 'drivers' | 'warehouse_products'

type SearchResultItem = {
  id: number
  title: string
  subtitle: string
  to: string
}

type SearchGroup = {
  key: SearchGroupKey
  label: string
  items: SearchResultItem[]
}

type TopbarGlobalSearchProps = {
  user: AuthUser | null | undefined
}

export function TopbarGlobalSearch({ user }: TopbarGlobalSearchProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const canSearchOrders = hasPermission(user, PERMISSIONS.ORDERS_VIEW)
  const canSearchShipments = hasPermission(user, PERMISSIONS.SHIPMENTS_VIEW)
  const canSearchMerchants = hasPermission(user, PERMISSIONS.MERCHANTS_VIEW)
  const canSearchDrivers = hasPermission(user, PERMISSIONS.DRIVERS_VIEW)
  const canSearchWarehouseProducts = hasPermission(user, PERMISSIONS.INVENTORY_VIEW)
  const hasSearchTargets =
    canSearchOrders
    || canSearchShipments
    || canSearchMerchants
    || canSearchDrivers
    || canSearchWarehouseProducts

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedQuery(query.trim())
    }, SEARCH_DEBOUNCE_MS)

    return () => window.clearTimeout(timeout)
  }, [query])

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    window.addEventListener('mousedown', handlePointerDown)
    window.addEventListener('keydown', handleEscape)

    return () => {
      window.removeEventListener('mousedown', handlePointerDown)
      window.removeEventListener('keydown', handleEscape)
    }
  }, [])

  const searchQuery = useQuery({
    queryKey: [
      'topbar-global-search',
      debouncedQuery,
      canSearchOrders,
      canSearchShipments,
      canSearchMerchants,
      canSearchDrivers,
      canSearchWarehouseProducts,
    ],
    enabled: hasSearchTargets && isOpen && debouncedQuery.length >= MIN_QUERY_LENGTH,
    staleTime: 30_000,
    queryFn: async () => {
      const tasks: Array<Promise<SearchGroup>> = []

      if (canSearchOrders) {
        tasks.push(
          listOrders({ search: debouncedQuery }).then((response) => ({
            key: 'orders',
            label: t('Orders'),
            items: response.data
              .filter((order) => matchesOrder(order, debouncedQuery))
              .slice(0, MAX_RESULTS_PER_GROUP)
              .map((order) => ({
                id: order.id,
                title: order.order_number,
                subtitle: `${order.customer_name} - ${order.customer_phone}`,
                to: adminPath(`/orders/${order.id}`),
              })),
          })),
        )
      }

      if (canSearchShipments) {
        tasks.push(
          listShipments({ search: debouncedQuery }).then((response) => ({
            key: 'shipments',
            label: t('Shipments'),
            items: response.data
              .filter((shipment) => matchesShipment(shipment, debouncedQuery))
              .slice(0, MAX_RESULTS_PER_GROUP)
              .map((shipment) => ({
                id: shipment.id,
                title: shipment.shipment_number,
                subtitle: `${shipment.customer_name} - ${shipment.customer_phone}`,
                to: adminPath(`/shipments/${shipment.id}`),
              })),
          })),
        )
      }

      if (canSearchMerchants) {
        tasks.push(
          queryClient.ensureQueryData({
            queryKey: ['merchants', 'topbar-search-source'],
            queryFn: listMerchants,
            staleTime: 60_000,
          }).then((response) => ({
            key: 'merchants',
            label: t('Merchants'),
            items: response.data
              .filter((merchant) => matchesMerchant(merchant, debouncedQuery))
              .slice(0, MAX_RESULTS_PER_GROUP)
              .map((merchant) => ({
                id: merchant.id,
                title: merchant.name,
                subtitle: [merchant.company_name, merchant.phone || merchant.email].filter(Boolean).join(' - '),
                to: adminPath(`/merchants/${merchant.id}`),
              })),
          })),
        )
      }

      if (canSearchDrivers) {
        tasks.push(
          queryClient.ensureQueryData({
            queryKey: ['drivers', 'topbar-search-source'],
            queryFn: listDrivers,
            staleTime: 60_000,
          }).then((response) => ({
            key: 'drivers',
            label: t('Drivers'),
            items: response.data
              .filter((driver) => matchesDriver(driver, debouncedQuery))
              .slice(0, MAX_RESULTS_PER_GROUP)
              .map((driver) => ({
                id: driver.id,
                title: driver.name,
                subtitle: [driver.phone, `${driver.vehicle_type} ${driver.vehicle_plate}`.trim()].filter(Boolean).join(' - '),
                to: adminPath(`/drivers/${driver.id}`),
              })),
          })),
        )
      }

      if (canSearchWarehouseProducts) {
        tasks.push(
          Promise.allSettled([
            listWarehouseProducts({ search: debouncedQuery }),
            listWarehouseProducts({ sku: debouncedQuery }),
            listWarehouseProducts({ barcode: debouncedQuery }),
          ]).then((responses) => {
            const products = dedupeById(
              responses
                .filter((result): result is PromiseFulfilledResult<{ data: WarehouseProduct[] }> => result.status === 'fulfilled')
                .flatMap((result) => result.value.data),
            )

            return {
              key: 'warehouse_products' as const,
              label: t('Warehouse Products', { defaultValue: 'Warehouse Products' }),
              items: products
                .filter((product) => matchesWarehouseProduct(product, debouncedQuery))
                .slice(0, MAX_RESULTS_PER_GROUP)
                .map((product) => ({
                  id: product.id,
                  title: product.name,
                  subtitle: [product.sku, product.barcode, product.merchant_name].filter(Boolean).join(' - '),
                  to: adminPath(`/warehouse-products/${product.id}`),
                })),
            }
          }),
        )
      }

      const results = await Promise.allSettled(tasks)
      const groups = results
        .filter((result): result is PromiseFulfilledResult<SearchGroup> => result.status === 'fulfilled')
        .map((result) => result.value)
        .filter((group) => group.items.length > 0)

      if (!groups.length && results.every((result) => result.status === 'rejected')) {
        throw new Error('Unable to search')
      }

      return groups
    },
  })

  const searchResultsRoute = getSearchResultsRoute(query.trim(), {
    canSearchOrders,
    canSearchShipments,
    canSearchMerchants,
    canSearchDrivers,
    canSearchWarehouseProducts,
  })
  const shouldShowDropdown = isOpen && query.trim().length >= MIN_QUERY_LENGTH

  function handleInputKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault()

      if (searchResultsRoute) {
        navigate(searchResultsRoute)
        setIsOpen(false)
      }
    }
  }

  function handleResultClick(to: string) {
    navigate(to)
    setIsOpen(false)
    setQuery('')
  }

  return (
    <div className="app-topbar__search-wrap" ref={containerRef}>
      <Search className="app-topbar__search-icon" size={17} />
      <Input
        className="app-topbar__search"
        placeholder={t('Search orders, shipments, merchants, drivers, and products', {
          defaultValue: 'Search orders, shipments, merchants, drivers, and products',
        })}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value)
          setIsOpen(true)
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleInputKeyDown}
      />

      {shouldShowDropdown ? (
        <div className="app-topbar__search-dropdown" role="listbox">
          {searchQuery.isLoading ? (
            <div className="app-topbar__search-state">
              {t('Searching...', { defaultValue: 'Searching...' })}
            </div>
          ) : null}

          {searchQuery.isError ? (
            <div className="app-topbar__search-state">
              {t('Unable to search', { defaultValue: 'Unable to search' })}
            </div>
          ) : null}

          {!searchQuery.isLoading && !searchQuery.isError && !searchQuery.data?.length ? (
            <div className="app-topbar__search-state">
              {t('No results found', { defaultValue: 'No results found' })}
            </div>
          ) : null}

          {searchQuery.data?.map((group) => (
            <div className="app-topbar__search-group" key={group.key}>
              <p className="app-topbar__search-group-label">{group.label}</p>
              <div className="app-topbar__search-group-items">
                {group.items.map((item) => (
                  <button
                    className="app-topbar__search-result"
                    key={`${group.key}-${item.id}`}
                    type="button"
                    onClick={() => handleResultClick(item.to)}
                  >
                    <strong>{item.title}</strong>
                    <span>{item.subtitle}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}

          {searchResultsRoute ? (
            <div className="app-topbar__search-footer">
              <Button
                className="app-topbar__search-footer-button"
                size="sm"
                variant="secondary"
                onClick={() => {
                  navigate(searchResultsRoute)
                  setIsOpen(false)
                }}
              >
                {t('Open results for "{{query}}"', {
                  query: query.trim(),
                  defaultValue: `Open results for "${query.trim()}"`,
                })}
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function matchesOrder(order: Order, query: string) {
  return toSearchHaystack([
    order.order_number,
    order.customer_name,
    order.customer_phone,
    order.merchant_name,
  ]).includes(query.toLowerCase())
}

function matchesShipment(shipment: Shipment, query: string) {
  return toSearchHaystack([
    shipment.shipment_number,
    shipment.order_number ?? '',
    shipment.customer_name,
    shipment.customer_phone,
    shipment.merchant_name,
  ]).includes(query.toLowerCase())
}

function matchesMerchant(merchant: Merchant, query: string) {
  return toSearchHaystack([
    merchant.name,
    merchant.company_name,
    merchant.phone,
    merchant.email,
  ]).includes(query.toLowerCase())
}

function matchesDriver(driver: Driver, query: string) {
  return toSearchHaystack([
    driver.name,
    driver.phone,
    driver.vehicle_type,
    driver.vehicle_plate,
  ]).includes(query.toLowerCase())
}

function matchesWarehouseProduct(product: WarehouseProduct, query: string) {
  return toSearchHaystack([
    product.name,
    product.sku,
    product.barcode ?? '',
    product.merchant_name,
  ]).includes(query.toLowerCase())
}

function toSearchHaystack(values: string[]) {
  return values.join(' ').toLowerCase()
}

function dedupeById<T extends { id: number }>(items: T[]) {
  return items.filter((item, index, all) => all.findIndex((candidate) => candidate.id === item.id) === index)
}

function getSearchResultsRoute(
  query: string,
  permissions: {
    canSearchOrders: boolean
    canSearchShipments: boolean
    canSearchMerchants: boolean
    canSearchDrivers: boolean
    canSearchWarehouseProducts: boolean
  },
) {
  if (!query || query.length < MIN_QUERY_LENGTH) {
    return null
  }

  const search = new URLSearchParams({ search: query }).toString()

  if (permissions.canSearchOrders) {
    return `${adminPath('/orders')}?${search}`
  }

  if (permissions.canSearchShipments) {
    return `${adminPath('/shipments')}?${search}`
  }

  if (permissions.canSearchMerchants) {
    return `${adminPath('/merchants')}?${search}`
  }

  if (permissions.canSearchDrivers) {
    return `${adminPath('/drivers')}?${search}`
  }

  if (permissions.canSearchWarehouseProducts) {
    return `${adminPath('/warehouse-products')}?${search}`
  }

  return null
}
