import { Suspense, useState, type ReactNode } from 'react'
import { useQueries } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../../auth/store/auth.store'
import type { Permission } from '../../../shared/auth/permission-keys'
import { hasAnyPermission, hasPermission } from '../../../shared/auth/permissions'
import { PageHeader } from '../../../shared/components/ui/PageHeader'
import { Tabs } from '../../../shared/components/ui/Tabs'
import { LoadingState } from '../../../shared/components/states/LoadingState'

export type WarehouseModuleTab = {
  id: string
  label: string
  content: ReactNode | ((onCountChange: (count: number) => void) => ReactNode)
  permission?: Permission
  anyOf?: Permission[]
  countSources?: Array<{
    queryKey: readonly unknown[]
    queryFn: () => Promise<number>
    permission?: Permission
    anyOf?: Permission[]
  }>
}

type WarehouseTabbedPageProps = {
  title: string
  description: string
  tabs: WarehouseModuleTab[]
}

export function WarehouseTabbedPage({ description, tabs, title }: WarehouseTabbedPageProps) {
  const user = useAuthStore((state) => state.user)
  const [searchParams, setSearchParams] = useSearchParams()
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({})
  const visibleTabs = tabs.filter((tab) => {
    if (tab.permission) {
      return hasPermission(user, tab.permission)
    }

    return tab.anyOf?.length ? hasAnyPermission(user, tab.anyOf) : true
  })
  const countSources = visibleTabs.flatMap((tab) => (tab.countSources ?? [])
    .filter((source) => source.permission
      ? hasPermission(user, source.permission)
      : source.anyOf?.length ? hasAnyPermission(user, source.anyOf) : true)
    .map((source) => ({ ...source, tabId: tab.id })))
  const countQueries = useQueries({
    queries: countSources.map((source) => ({
      queryKey: source.queryKey,
      queryFn: source.queryFn,
      staleTime: 30_000,
    })),
  })
  const requestedTab = searchParams.get('tab')
  const activeTab = visibleTabs.find((tab) => tab.id === requestedTab) ?? visibleTabs[0]
  const activeTabId = activeTab?.id
  const handleCountChange = (count: number) => {
    if (!activeTabId) {
      return
    }

    setTabCounts((current) => current[activeTabId] === count
      ? current
      : { ...current, [activeTabId]: count })
  }
  const activeContent = typeof activeTab?.content === 'function'
    ? activeTab.content(handleCountChange)
    : activeTab?.content

  return (
    <section className="page-section warehouse-module-page">
      <PageHeader title={title} description={description} />
      <Tabs
        activeTab={activeTab?.id ?? ''}
        className="warehouse-module-page__tabs"
        variant="module"
        tabs={visibleTabs.map((tab) => {
          const sourceIndexes = countSources
            .map((source, index) => source.tabId === tab.id ? index : -1)
            .filter((index) => index >= 0)
          const sourceQueries = sourceIndexes.map((index) => countQueries[index])
          const reportedCount = tabCounts[tab.id]
          const isCountLoading = reportedCount === undefined && sourceQueries.some((query) => query.isPending)
          const prefetchedCount = sourceQueries.length && sourceQueries.every((query) => query.data !== undefined)
            ? sourceQueries.reduce((total, query) => total + (query.data ?? 0), 0)
            : undefined

          return {
            id: tab.id,
            label: tab.label,
            badge: reportedCount ?? prefetchedCount ?? (sourceQueries.some((query) => query.isError) ? '—' : undefined),
            badgeLoading: isCountLoading,
          }
        })}
        onChange={(tabId) => {
          const nextParams = new URLSearchParams(searchParams)
          nextParams.set('tab', tabId)
          setSearchParams(nextParams, { replace: true })
        }}
      />
      <div className="warehouse-module-page__panel">
        <Suspense fallback={<LoadingState title={`Loading ${activeTab?.label ?? 'warehouse view'}`} />}>
          {activeContent}
        </Suspense>
      </div>
    </section>
  )
}
