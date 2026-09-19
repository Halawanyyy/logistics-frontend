import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type PropsWithChildren,
} from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../utils/cn'

export type DropdownAlign = 'left' | 'right' | 'start' | 'end'

interface DropdownContextValue {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
  close: () => void
  align: DropdownAlign
  setAlign: (align: DropdownAlign) => void
  triggerRef: React.RefObject<HTMLButtonElement | null>
  contentRef: React.RefObject<HTMLDivElement | null>
  position: { top: number; left?: number; right?: number }
  updatePosition: () => void
}

const DropdownContext = createContext<DropdownContextValue | null>(null)

export function useDropdown() {
  return useContext(DropdownContext)
}

export function resolveAlign(align: DropdownAlign): 'left' | 'right' {
  const isRtl =
    typeof document !== 'undefined' &&
    (document.documentElement.dir === 'rtl' ||
      document.documentElement.getAttribute('lang') === 'ar' ||
      document.body.dir === 'rtl')

  if (align === 'start') {
    return isRtl ? 'right' : 'left'
  }
  if (align === 'end') {
    return isRtl ? 'left' : 'right'
  }
  return align
}

function DropdownProvider({
  children,
  align: initialAlign = 'end',
  className,
}: PropsWithChildren<{ align?: DropdownAlign; className?: string }>) {
  const [open, setOpen] = useState(false)
  const [align, setAlign] = useState<DropdownAlign>(initialAlign)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)
  const [position, setPosition] = useState<{ top: number; left?: number; right?: number }>({ top: 0 })

  const close = useCallback(() => setOpen(false), [])

  const updatePosition = useCallback(() => {
    const triggerEl = triggerRef.current
    if (!triggerEl) return

    const rect = triggerEl.getBoundingClientRect()
    const resolved = resolveAlign(align)
    const gap = 4
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth
    const approxContentHeight = contentRef.current?.offsetHeight || 220
    const spaceBelow = viewportHeight - rect.bottom
    const spaceAbove = rect.top

    let top: number
    if (spaceBelow < approxContentHeight && spaceAbove > spaceBelow) {
      top = Math.max(8, rect.top - approxContentHeight - gap)
    } else {
      top = Math.min(rect.bottom + gap, viewportHeight - 8)
    }

    let left: number | undefined
    let right: number | undefined

    if (resolved === 'left') {
      left = Math.max(8, Math.min(rect.left, viewportWidth - 200))
      right = undefined
    } else {
      right = Math.max(8, Math.min(viewportWidth - rect.right, viewportWidth - 200))
      left = undefined
    }

    setPosition({ top, left, right })
  }, [align])

  useEffect(() => {
    if (!open) return

    updatePosition()
    const frame = requestAnimationFrame(updatePosition)

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node
      if (
        triggerRef.current?.contains(target) ||
        contentRef.current?.contains(target)
      ) {
        return
      }
      setOpen(false)
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }

    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, updatePosition])

  return (
    <DropdownContext.Provider
      value={{
        open,
        setOpen,
        close,
        align,
        setAlign,
        triggerRef,
        contentRef,
        position,
        updatePosition,
      }}
    >
      <div className={className}>{children}</div>
    </DropdownContext.Provider>
  )
}

export function Dropdown({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) {
  const parentCtx = useContext(DropdownContext)
  if (parentCtx) {
    return <div className={cn('ui-dropdown', className)}>{children}</div>
  }
  return (
    <DropdownProvider className={cn('ui-dropdown', className)}>
      {children}
    </DropdownProvider>
  )
}

export function DropdownMenu({
  align = 'end',
  children,
  className,
}: PropsWithChildren<{ align?: DropdownAlign; className?: string }>) {
  const parentCtx = useContext(DropdownContext)

  useEffect(() => {
    if (parentCtx && align) {
      parentCtx.setAlign(align)
    }
  }, [parentCtx, align])

  if (parentCtx) {
    return <div className={cn('ui-dropdown__menu', className)}>{children}</div>
  }

  return (
    <DropdownProvider align={align} className={cn('ui-dropdown', 'ui-dropdown__menu', className)}>
      {children}
    </DropdownProvider>
  )
}

export function DropdownTrigger({
  children,
  className,
  onClick,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLButtonElement>>) {
  const ctx = useContext(DropdownContext)

  return (
    <div className="ui-dropdown__trigger-wrap" style={{ display: 'inline-flex' }}>
      <button
        ref={ctx?.triggerRef}
        type="button"
        className={cn('ui-dropdown__trigger', className)}
        aria-haspopup="true"
        aria-expanded={ctx?.open}
        onClick={(e) => {
          onClick?.(e)
          if (!e.defaultPrevented && ctx) {
            if (!ctx.open) {
              ctx.updatePosition()
            }
            ctx.setOpen((val) => !val)
          }
        }}
        {...props}
      >
        {children}
      </button>
    </div>
  )
}

export function DropdownContent({
  children,
  className,
  style,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  const ctx = useContext(DropdownContext)

  if (!ctx?.open || typeof document === 'undefined') {
    return null
  }

  const resolvedAlign = resolveAlign(ctx.align)

  return createPortal(
    <div
      ref={ctx.contentRef}
      className={cn(
        'ui-dropdown__content',
        `ui-dropdown__content--${resolvedAlign}`,
        className,
      )}
      style={{
        position: 'fixed',
        top: ctx.position.top,
        left: ctx.position.left,
        right: ctx.position.right,
        zIndex: 9999,
        ...style,
      }}
      role="menu"
      {...props}
    >
      {children}
    </div>,
    document.body,
  )
}

export function DropdownItem({
  children,
  className,
  destructive = false,
  disabled = false,
  onClick,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLDivElement> & { destructive?: boolean; disabled?: boolean }>) {
  const dropdownContext = useContext(DropdownContext)

  return (
    <div
      className={cn('ui-dropdown__item', destructive && 'ui-dropdown__item--danger', className)}
      data-dropdown-item="true"
      role="menuitem"
      aria-disabled={disabled}
      onClick={(event) => {
        if (disabled) {
          event.preventDefault()
          return
        }

        onClick?.(event)

        if (event.defaultPrevented) {
          return
        }

        dropdownContext?.close()
      }}
      {...props}
    >
      {children}
    </div>
  )
}
