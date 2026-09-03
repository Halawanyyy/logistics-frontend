import type { PropsWithChildren, ReactNode } from 'react'
import { cn } from '../../utils/cn'

type ActionToolbarProps = PropsWithChildren<{
  title?: ReactNode
  searchComponent?: ReactNode
  filterComponents?: ReactNode
  actionComponents?: ReactNode
  className?: string
}>

export function ActionToolbar({
  title,
  searchComponent,
  filterComponents,
  actionComponents,
  className,
  children,
}: ActionToolbarProps) {
  return (
    <div
      className={cn(
        'ui-action-toolbar mb-6 flex flex-col gap-4 rounded-xl bg-slate-800/60 p-4 border border-slate-700/60 backdrop-blur-sm lg:flex-row lg:items-center lg:justify-between',
        className
      )}
    >
      {title && <div className="text-base font-bold text-slate-100">{title}</div>}

      <div className="flex flex-1 flex-wrap items-center gap-3">
        {searchComponent && <div className="min-w-[240px] flex-1 lg:max-w-md">{searchComponent}</div>}
        {filterComponents && <div className="flex flex-wrap items-center gap-2">{filterComponents}</div>}
      </div>

      {actionComponents && <div className="flex items-center gap-2">{actionComponents}</div>}

      {children}
    </div>
  )
}
