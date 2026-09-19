import {
  cloneElement,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type CSSProperties,
} from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '../ui/Button'
import { cn } from '../../utils/cn'

export type FilterPopoverProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  triggerRef?: React.RefObject<HTMLButtonElement | null>
  trigger?: ReactNode
  activeCount?: number
  title?: string
  subtitle?: string
  children: ReactNode
  onApply: () => void
  onReset: () => void
  applyLabel?: string
  resetLabel?: string
  applyDisabled?: boolean
  align?: 'start' | 'end'
  className?: string
}

export function FilterPopover({
  open,
  onOpenChange,
  triggerRef,
  trigger,
  activeCount,
  title,
  subtitle,
  children,
  onApply,
  onReset,
  applyLabel,
  resetLabel,
  applyDisabled = false,
  align = 'end',
  className,
}: FilterPopoverProps) {
  const { t } = useTranslation()
  const popoverRef = useRef<HTMLDivElement>(null)
  const internalTriggerRef = useRef<HTMLDivElement>(null)
  const [style, setStyle] = useState<CSSProperties>({})
  const [isMobile, setIsMobile] = useState(false)

  const resolvedTitle = title ?? t('Filters', { defaultValue: 'Filters' })
  const resolvedApplyLabel = applyLabel ?? t('Apply filters', { defaultValue: 'Apply filters' })
  const resolvedResetLabel = resetLabel ?? t('Reset', { defaultValue: 'Reset' })

  useEffect(() => {
    if (!open || typeof window === 'undefined') {
      return
    }

    function updatePosition() {
      const mobile = window.innerWidth <= 640
      setIsMobile(mobile)

      if (mobile) {
        setStyle({})
        return
      }

      const triggerEl =
        triggerRef?.current ??
        (internalTriggerRef.current?.firstElementChild as HTMLElement | null) ??
        internalTriggerRef.current

      if (!triggerEl) {
        return
      }

      const rect = triggerEl.getBoundingClientRect()
      const popoverWidth = 400
      const gap = 8

      const isRtl =
        document.documentElement.getAttribute('dir') === 'rtl' ||
        document.documentElement.getAttribute('lang') === 'ar'

      const top = Math.min(rect.bottom + gap, window.innerHeight - 80)

      let left: number | undefined
      let right: number | undefined

      if (isRtl) {
        if (align === 'end') {
          // Align to trigger's left in RTL (visually end)
          left = Math.max(16, rect.left)
          right = undefined
        } else {
          right = Math.max(16, window.innerWidth - rect.right)
          left = undefined
        }
      } else {
        if (align === 'end') {
          right = Math.max(16, window.innerWidth - rect.right)
          left = undefined
        } else {
          left = Math.max(16, rect.left)
          right = undefined
        }
      }

      // Check if overflowing left or right
      if (right !== undefined && window.innerWidth - right < popoverWidth) {
        right = Math.max(16, window.innerWidth - popoverWidth - 16)
      }
      if (left !== undefined && left + popoverWidth > window.innerWidth) {
        left = Math.max(16, window.innerWidth - popoverWidth - 16)
      }

      setStyle({
        position: 'fixed',
        top: `${top}px`,
        left: left !== undefined ? `${left}px` : undefined,
        right: right !== undefined ? `${right}px` : undefined,
        zIndex: 1050,
      })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node
      const triggerEl =
        triggerRef?.current ??
        (internalTriggerRef.current?.firstElementChild as HTMLElement | null) ??
        internalTriggerRef.current

      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        triggerEl &&
        !triggerEl.contains(target)
      ) {
        onOpenChange(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onOpenChange(false)
        const triggerEl =
          triggerRef?.current ??
          (internalTriggerRef.current?.firstElementChild as HTMLElement | null) ??
          internalTriggerRef.current?.querySelector('button')
        triggerEl?.focus()
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, align, triggerRef, trigger, onOpenChange])

  const content =
    open && typeof document !== 'undefined' ? (
      <>
        {isMobile && (
          <div
            className="filter-popover__backdrop"
            onClick={() => onOpenChange(false)}
            aria-hidden="true"
          />
        )}
        <div
          ref={popoverRef}
          role="dialog"
          aria-modal={isMobile ? 'true' : 'false'}
          aria-label={resolvedTitle}
          className={cn(
            'filter-popover',
            isMobile && 'filter-popover--mobile',
            className,
          )}
          style={isMobile ? undefined : style}
        >
          <header className="filter-popover__header">
            <div className="filter-popover__header-copy">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 className="filter-popover__title">{resolvedTitle}</h2>
                {activeCount && activeCount > 0 ? (
                  <span className="filter-button__badge">{activeCount}</span>
                ) : null}
              </div>
              {subtitle ? <p className="filter-popover__subtitle">{subtitle}</p> : null}
            </div>
            <button
              type="button"
              className="filter-popover__close-btn"
              onClick={() => onOpenChange(false)}
              aria-label={t('Close filters', { defaultValue: 'Close filters' })}
            >
              <X size={16} aria-hidden="true" />
            </button>
          </header>

          <div className="filter-popover__body">{children}</div>

          <footer className="filter-popover__footer">
            <Button
              type="button"
              variant="secondary"
              className="filter-popover__reset-btn"
              onClick={onReset}
            >
              {resolvedResetLabel}
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={applyDisabled}
              className="filter-popover__apply-btn"
              onClick={onApply}
            >
              {resolvedApplyLabel}
            </Button>
          </footer>
        </div>
      </>
    ) : null

  return (
    <>
      {trigger ? (
        <div
          ref={internalTriggerRef}
          className="filter-popover-trigger-container inline-flex"
        >
          {isValidElement(trigger)
            ? cloneElement(trigger as React.ReactElement<any>, {
                open: (trigger.props as any)?.open ?? open,
                onClick: (e: React.MouseEvent) => {
                  if ((trigger.props as any)?.onClick) {
                    ;(trigger.props as any).onClick(e)
                  } else {
                    onOpenChange(!open)
                  }
                },
              })
            : trigger}
        </div>
      ) : null}
      {content ? createPortal(content, document.body) : null}
    </>
  )
}

