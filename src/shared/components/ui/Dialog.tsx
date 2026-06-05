import type { PropsWithChildren, ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../utils/cn'

type DialogVariant = 'default' | 'small' | 'slideover'

type DialogProps = PropsWithChildren<{
  open: boolean
  onClose: () => void
  title?: ReactNode
  variant?: DialogVariant
}>

export function Dialog({
  children,
  onClose,
  open,
  title,
  variant = 'default',
}: DialogProps) {
  if (!open) {
    return null
  }

  return (
    <div className="ui-dialog__backdrop" role="presentation" onClick={onClose}>
      <div
        aria-modal="true"
        className={cn('ui-dialog', `ui-dialog--${variant}`)}
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="ui-dialog__header">
          <div>{title}</div>
          <button className="ui-dialog__close" type="button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="ui-dialog__body">{children}</div>
      </div>
    </div>
  )
}
