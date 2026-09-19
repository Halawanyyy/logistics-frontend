import { useEffect, useId, useRef, type PropsWithChildren, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../utils/cn'

type DialogVariant = 'default' | 'small' | 'slideover' | 'filters'

type DialogProps = PropsWithChildren<{
  closeOnBackdropClick?: boolean
  closeLabel?: string
  description?: ReactNode
  footer?: ReactNode
  open: boolean
  onClose: () => void
  title?: ReactNode
  variant?: DialogVariant
}>

export function Dialog({
  closeOnBackdropClick = true,
  closeLabel = 'Close dialog',
  children,
  description,
  footer,
  onClose,
  open,
  title,
  variant = 'default',
}: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) {
      return
    }

    const previouslyFocused = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null
    const previousOverflow = document.body.style.overflow
    const focusableSelector = [
      'button:not([disabled])',
      '[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',')

    document.body.style.overflow = 'hidden'

    const focusFrame = window.requestAnimationFrame(() => {
      const dialog = dialogRef.current
      const initialTarget = dialog?.querySelector<HTMLElement>('[data-dialog-initial-focus="true"]')
        ?? dialog?.querySelector<HTMLElement>(focusableSelector)
        ?? dialog
      initialTarget?.focus()
    })

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current()
        return
      }

      if (event.key !== 'Tab' || !dialogRef.current) {
        return
      }

      const focusableElements = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(focusableSelector),
      ).filter((element) => element.getAttribute('aria-hidden') !== 'true')

      if (focusableElements.length === 0) {
        event.preventDefault()
        dialogRef.current.focus()
        return
      }

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      window.cancelAnimationFrame(focusFrame)
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      previouslyFocused?.focus()
    }
  }, [open])

  if (!open) {
    return null
  }

  return (
    <div
      className="ui-dialog__backdrop"
      role="presentation"
      onClick={closeOnBackdropClick ? onClose : undefined}
    >
      <div
        ref={dialogRef}
        aria-describedby={description ? descriptionId : undefined}
        aria-labelledby={title ? titleId : undefined}
        aria-modal="true"
        className={cn('ui-dialog', `ui-dialog--${variant}`)}
        role="dialog"
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="ui-dialog__header">
          <div className="ui-dialog__heading">
            {title ? <div id={titleId}>{title}</div> : null}
            {description ? <div className="ui-dialog__description" id={descriptionId}>{description}</div> : null}
          </div>
          <button aria-label={closeLabel} className="ui-dialog__close" type="button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="ui-dialog__body">{children}</div>
        {footer ? <div className="ui-dialog__footer">{footer}</div> : null}
      </div>
    </div>
  )
}
