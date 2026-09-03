import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'

export type TabItem = {
  id: string
  label: ReactNode
  badge?: string | number
  badgeLoading?: boolean
  disabled?: boolean
}

type TabsProps = {
  tabs: TabItem[]
  activeTab: string
  onChange: (tabId: string) => void
  variant?: 'underline' | 'pills' | 'module'
  className?: string
}

export function Tabs({ tabs, activeTab, onChange, variant = 'pills', className }: TabsProps) {
  return (
    <div
      className={cn(
        variant === 'module'
          ? 'ui-tabs module-tabs'
          : 'ui-tabs flex border-b border-slate-800 space-x-1 overflow-x-auto rtl:space-x-reverse',
        variant === 'pills' && 'border-0 bg-slate-900/60 p-1.5 rounded-xl border border-slate-800',
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            disabled={tab.disabled}
            onClick={() => onChange(tab.id)}
            className={cn(
              'ui-tabs__tab',
              isActive && 'ui-tabs__tab--active',
              variant === 'module'
                ? ['module-tabs__tab', isActive && 'module-tabs__tab--active']
                : 'flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-all whitespace-nowrap',
              variant === 'pills' && [
                'rounded-lg',
                isActive
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700/80'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40',
              ],
              variant === 'underline' && [
                'border-b-2 py-3',
                isActive
                  ? 'border-brand text-brand font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700',
              ],
              tab.disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <span>{tab.label}</span>
            {tab.badgeLoading || tab.badge !== undefined ? (
              <span
                aria-label={tab.badgeLoading ? 'Loading count' : undefined}
                className={cn(
                  'ui-tabs__badge',
                  variant === 'module' ? 'module-tabs__badge' : [
                    'rounded-full px-2 py-0.5 text-xs font-bold',
                    isActive
                      ? 'bg-brand text-white'
                      : 'bg-slate-800 text-slate-400',
                  ]
                )}
              >
                {tab.badgeLoading ? <span className="ui-tabs__badge-spinner" aria-hidden="true" /> : tab.badge}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
