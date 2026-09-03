import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'

export type TimelineItemProps = {
  id: string | number
  title: ReactNode
  timestamp?: string
  description?: ReactNode
  icon?: ReactNode
  status?: 'completed' | 'current' | 'pending' | 'failed'
}

type TimelineProps = {
  items: TimelineItemProps[]
  className?: string
}

export function Timeline({ items, className }: TimelineProps) {
  const getStatusColor = (status?: TimelineItemProps['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500 text-white ring-emerald-500/20'
      case 'current':
        return 'bg-violet-600 text-white ring-violet-500/30'
      case 'failed':
        return 'bg-rose-500 text-white ring-rose-500/20'
      case 'pending':
      default:
        return 'bg-slate-700 text-slate-400 ring-slate-700/20'
    }
  }

  return (
    <div className={cn('ui-timeline relative space-y-6 ps-6', className)}>
      {/* Vertical line */}
      <div className="absolute start-2.5 top-2.5 bottom-2.5 w-0.5 bg-slate-800" aria-hidden="true" />

      {items.map((item) => (
        <div key={item.id} className="relative flex items-start gap-4">
          {/* Dot / Icon container */}
          <div
            className={cn(
              'absolute -start-6 flex h-5 w-5 items-center justify-center rounded-full ring-4 text-xs font-bold transition-colors',
              getStatusColor(item.status)
            )}
          >
            {item.icon ? item.icon : <span className="h-2 w-2 rounded-full bg-current" />}
          </div>

          {/* Content */}
          <div className="flex-1 rounded-lg bg-slate-800/40 p-4 border border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="font-semibold text-slate-200 text-sm">{item.title}</h4>
              {item.timestamp && <span className="text-xs font-medium text-slate-400">{item.timestamp}</span>}
            </div>
            {item.description && <div className="mt-2 text-xs text-slate-300 leading-relaxed">{item.description}</div>}
          </div>
        </div>
      ))}
    </div>
  )
}
