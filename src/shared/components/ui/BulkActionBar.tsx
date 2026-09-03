import type { PropsWithChildren } from 'react'
import { X } from 'lucide-react'
import { Button } from './Button'
import { cn } from '../../utils/cn'

type BulkActionBarProps = PropsWithChildren<{
  className?: string
  onClear: () => void
  selectedCount: number
}>

export function BulkActionBar({ children, className, onClear, selectedCount }: BulkActionBarProps) {
  const isVisible = selectedCount > 0

  return (
    <div
      aria-hidden={!isVisible}
      className={cn('bulk-action-bar', isVisible && 'bulk-action-bar--visible', className)}
      inert={!isVisible}
    >
      <strong>{selectedCount} {selectedCount === 1 ? 'item' : 'items'} selected</strong>
      <div className="bulk-action-bar__actions">{children}</div>
      <Button
        aria-label="Clear selection"
        size="sm"
        tabIndex={isVisible ? 0 : -1}
        type="button"
        variant="ghost"
        onClick={onClear}
      >
        <X aria-hidden size={17} />
      </Button>
    </div>
  )
}
