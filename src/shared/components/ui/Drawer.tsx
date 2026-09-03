import { useEffect, type PropsWithChildren, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../utils/cn'

type DrawerProps = PropsWithChildren<{
  isOpen: boolean
  onClose: () => void
  title?: ReactNode
  description?: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}>

export function Drawer({
  isOpen,
  onClose,
  title,
  description,
  footer,
  size = 'md',
  className,
  children,
}: DrawerProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  return (
    <div className="ui-drawer__overlay fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300">
      <div
        className={cn(
          'ui-drawer__content relative flex h-full w-full flex-col bg-slate-900 text-slate-100 shadow-2xl border-s border-slate-800 transition-transform duration-300 ease-in-out',
          sizeClasses[size],
          className
        )}
      >
        {/* Header */}
        <div className="ui-drawer__header flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div>
            {title && <h3 className="text-lg font-bold text-slate-100">{title}</h3>}
            {description && <p className="mt-1 text-sm text-slate-400">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
            aria-label="Close drawer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="ui-drawer__body flex-1 overflow-y-auto p-6">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="ui-drawer__footer flex items-center justify-end gap-3 border-t border-slate-800 px-6 py-4 bg-slate-900/80">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
