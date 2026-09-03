import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { FileText, LayoutGrid, Package, Search, Store, Truck, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { AuthUser } from '../../../features/auth/types/auth.types'
import { listMerchants } from '../../../features/merchants/api/merchants.api'
import { listOrders } from '../../../features/orders/api/orders.api'
import { listShipments } from '../../../features/shipments/api/shipments.api'
import { PERMISSIONS } from '../../auth/permission-keys'
import { hasPermission } from '../../auth/permissions'
import { adminPath } from '../../routing/paths'

const MIN_DYNAMIC_QUERY_LENGTH = 2
const SEARCH_DEBOUNCE_MS = 300
const MAX_RESULTS_PER_GROUP = 5

export type CommandPalettePage = {
  label: string
  path: string
  keywords?: string
}

type CommandResult = {
  id: string
  title: string
  subtitle?: string
  to: string
}

type ResultGroup = {
  key: 'pages' | 'orders' | 'shipments' | 'merchants'
  label: string
  icon: typeof LayoutGrid
  items: CommandResult[]
}

type CommandPaletteProps = {
  isOpen: boolean
  onClose: () => void
  pages: CommandPalettePage[]
  portalType: 'admin' | 'merchant'
  user: AuthUser | null | undefined
}

export function CommandPalette({ isOpen, onClose, pages, portalType, user }: CommandPaletteProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  const canSearchOrders = portalType === 'admin' && hasPermission(user, PERMISSIONS.ORDERS_VIEW)
  const canSearchShipments = portalType === 'admin' && hasPermission(user, PERMISSIONS.SHIPMENTS_VIEW)
  const canSearchMerchants = portalType === 'admin' && hasPermission(user, PERMISSIONS.MERCHANTS_VIEW)
  const canSearchDynamic = canSearchOrders || canSearchShipments || canSearchMerchants

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedQuery(query.trim()), SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(timeout)
  }, [query])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const animationFrame = window.requestAnimationFrame(() => {
      setSelectedIndex(0)
      inputRef.current?.focus()
    })

    return () => window.cancelAnimationFrame(animationFrame)
  }, [isOpen])

  const dynamicSearch = useQuery({
    queryKey: [
      'command-palette-search',
      debouncedQuery,
      canSearchOrders,
      canSearchShipments,
      canSearchMerchants,
    ],
    enabled: isOpen && canSearchDynamic && debouncedQuery.length >= MIN_DYNAMIC_QUERY_LENGTH,
    staleTime: 30_000,
    queryFn: async () => {
      const searches: Array<Promise<ResultGroup>> = []

      if (canSearchOrders) {
        searches.push(
          listOrders({ search: debouncedQuery }).then((response) => ({
            key: 'orders' as const,
            label: 'Orders',
            icon: Package,
            items: response.data.slice(0, MAX_RESULTS_PER_GROUP).map((order) => ({
              id: `order-${order.id}`,
              title: order.order_number,
              subtitle: `${order.customer_name} · ${order.customer_phone}`,
              to: adminPath(`/orders/${order.id}`),
            })),
          })),
        )
      }

      if (canSearchShipments) {
        searches.push(
          listShipments({ search: debouncedQuery }).then((response) => ({
            key: 'shipments' as const,
            label: 'Shipments',
            icon: Truck,
            items: response.data.slice(0, MAX_RESULTS_PER_GROUP).map((shipment) => ({
              id: `shipment-${shipment.id}`,
              title: shipment.shipment_number,
              subtitle: `${shipment.customer_name} · ${shipment.customer_phone}`,
              to: adminPath(`/shipments/${shipment.id}`),
            })),
          })),
        )
      }

      if (canSearchMerchants) {
        searches.push(
          queryClient.ensureQueryData({
            queryKey: ['merchants', 'command-palette-source'],
            queryFn: listMerchants,
            staleTime: 60_000,
          }).then((response) => ({
            key: 'merchants' as const,
            label: 'Merchants',
            icon: Store,
            items: response.data
              .filter((merchant) =>
                [merchant.name, merchant.company_name, merchant.phone, merchant.email]
                  .filter(Boolean)
                  .join(' ')
                  .toLowerCase()
                  .includes(debouncedQuery.toLowerCase()),
              )
              .slice(0, MAX_RESULTS_PER_GROUP)
              .map((merchant) => ({
                id: `merchant-${merchant.id}`,
                title: merchant.name,
                subtitle: [merchant.company_name, merchant.phone || merchant.email].filter(Boolean).join(' · '),
                to: adminPath(`/merchants/${merchant.id}`),
              })),
          })),
        )
      }

      const settled = await Promise.allSettled(searches)
      const groups = settled
        .filter((result): result is PromiseFulfilledResult<ResultGroup> => result.status === 'fulfilled')
        .map((result) => result.value)
        .filter((group) => group.items.length)

      if (!groups.length && settled.length && settled.every((result) => result.status === 'rejected')) {
        throw new Error('Unable to search')
      }

      return groups
    },
  })

  const resultGroups = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const matchingPages = pages
      .filter((page) =>
        [page.label, page.keywords]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery),
      )
      .map((page) => ({
        id: `page-${page.path}`,
        title: page.label,
        subtitle: 'Open page',
        to: page.path,
      }))

    const groups: ResultGroup[] = matchingPages.length
      ? [{ key: 'pages', label: 'Pages', icon: FileText, items: matchingPages }]
      : []

    if (query.trim().length >= MIN_DYNAMIC_QUERY_LENGTH && dynamicSearch.data) {
      groups.push(...dynamicSearch.data)
    }

    return groups
  }, [dynamicSearch.data, pages, query])

  const flatResults = useMemo(
    () => resultGroups.flatMap((group) => group.items),
    [resultGroups],
  )
  const activeIndex = Math.min(selectedIndex, Math.max(flatResults.length - 1, 0))

  function selectResult(result: CommandResult) {
    navigate(result.to)
    setQuery('')
    setDebouncedQuery('')
    onClose()
  }

  if (!isOpen) {
    return null
  }

  return (
    <div
      className="command-palette__backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <section
        aria-label="Command palette"
        aria-modal="true"
        className="command-palette"
        role="dialog"
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault()
            onClose()
          } else if (event.key === 'ArrowDown') {
            event.preventDefault()
            setSelectedIndex((current) => flatResults.length ? (current + 1) % flatResults.length : 0)
          } else if (event.key === 'ArrowUp') {
            event.preventDefault()
            setSelectedIndex((current) => flatResults.length ? (current - 1 + flatResults.length) % flatResults.length : 0)
          } else if (event.key === 'Enter' && flatResults[activeIndex]) {
            event.preventDefault()
            selectResult(flatResults[activeIndex])
          }
        }}
      >
        <div className="command-palette__search">
          <Search aria-hidden size={20} />
          <input
            ref={inputRef}
            aria-controls="command-palette-results"
            aria-label="Search pages, orders, shipments, and merchants"
            placeholder="Search pages, orders, shipments, and merchants…"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setSelectedIndex(0)
            }}
          />
          <button aria-label="Close command palette" type="button" onClick={onClose}>
            <X aria-hidden size={18} />
          </button>
        </div>

        <div className="command-palette__results" id="command-palette-results">
          {resultGroups.map((group) => {
            const GroupIcon = group.icon

            return (
              <div className="command-palette__group" key={group.key}>
                <div className="command-palette__group-label">
                  <GroupIcon aria-hidden size={15} />
                  <span>{group.label}</span>
                </div>
                <div>
                  {group.items.map((result) => {
                    const resultIndex = flatResults.findIndex((item) => item.id === result.id)
                    return (
                      <button
                        className={resultIndex === activeIndex ? 'is-selected' : ''}
                        key={result.id}
                        type="button"
                        onClick={() => selectResult(result)}
                        onMouseEnter={() => setSelectedIndex(resultIndex)}
                      >
                        <span>
                          <strong>{result.title}</strong>
                          {result.subtitle ? <small>{result.subtitle}</small> : null}
                        </span>
                        <kbd>↵</kbd>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {dynamicSearch.isFetching ? (
            <p className="command-palette__state">Searching records…</p>
          ) : null}
          {dynamicSearch.isError ? (
            <p className="command-palette__state">Record search is temporarily unavailable.</p>
          ) : null}
          {!resultGroups.length && !dynamicSearch.isFetching ? (
            <p className="command-palette__state">No matching commands found.</p>
          ) : null}
        </div>

        <footer className="command-palette__footer">
          <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
          <span><kbd>↵</kbd> open</span>
          <span><kbd>esc</kbd> close</span>
        </footer>
      </section>
    </div>
  )
}
