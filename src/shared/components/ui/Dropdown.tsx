import {
  Children,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
  type PropsWithChildren,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../utils/cn'

type DropdownAlign = 'left' | 'right' | 'start' | 'end'
type DropdownContextValue = {
  close: () => void
}

const DropdownContext = createContext<DropdownContextValue | null>(null)

function resolveAlign(align: DropdownAlign) {
  const isRtl = typeof document !== 'undefined' && document.documentElement.dir === 'rtl'

  if (align === 'start') {
    return isRtl ? 'right' : 'left'
  }

  if (align === 'end') {
    return isRtl ? 'left' : 'right'
  }

  return align
}

function splitMenuChildren(children: ReactNode) {
  const childArray = Children.toArray(children)
  return {
    contentNode: childArray[1] ?? null,
    triggerNode: childArray[0] ?? null,
  }
}

export function Dropdown({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) {
  return <div className={cn('ui-dropdown', className)}>{children}</div>
}

export function DropdownMenu({
  align = 'end',
  children,
}: PropsWithChildren<{ align?: DropdownAlign }>) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const { contentNode, triggerNode } = useMemo(() => splitMenuChildren(children), [children])
  const resolvedAlign = resolveAlign(align)
  const [position, setPosition] = useState<{ left?: number; right?: number; top: number }>({ top: 0 })

  useEffect(() => {
    if (!open) {
      return
    }

    function handleClick(event: MouseEvent) {
      const target = event.target as Node

      if (triggerRef.current?.contains(target) || contentRef.current?.contains(target)) {
        return
      }

      setOpen(false)
    }

    function updatePosition() {
      const rect = triggerRef.current?.getBoundingClientRect()
      if (!rect) {
        return
      }

      const top = Math.min(rect.bottom + 8, window.innerHeight - 16)

      if (resolvedAlign === 'left') {
        setPosition({
          left: Math.max(12, rect.left),
          right: undefined,
          top,
        })
        return
      }

      setPosition({
        left: undefined,
        right: Math.max(12, window.innerWidth - rect.right),
        top,
      })
    }

    updatePosition()
    window.addEventListener('mousedown', handleClick)
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      window.removeEventListener('mousedown', handleClick)
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open, resolvedAlign])

  return (
    <DropdownContext.Provider value={{ close: () => setOpen(false) }}>
      <div className="ui-dropdown__menu">
        <div ref={triggerRef} className="ui-dropdown__trigger-wrap" onClick={() => setOpen((value) => !value)}>
          {triggerNode}
        </div>
        {open && typeof document !== 'undefined' && contentNode
          ? createPortal(
              <div
                ref={contentRef}
                className={cn(
                  'ui-dropdown__content',
                  `ui-dropdown__content--${resolvedAlign}`,
                  contentNode && typeof contentNode === 'object' && 'props' in contentNode
                    ? (contentNode as { props?: { className?: string } }).props?.className
                    : undefined,
                )}
                style={{
                  left: position.left,
                  right: position.right,
                  top: position.top,
                }}
              >
                {contentNode && typeof contentNode === 'object' && 'props' in contentNode
                  ? (contentNode as { props?: { children?: ReactNode } }).props?.children
                  : contentNode}
              </div>,
              document.body,
            )
          : null}
      </div>
    </DropdownContext.Provider>
  )
}

export function DropdownTrigger({
  children,
  className,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLButtonElement>>) {
  return (
    <button type="button" className={cn('ui-dropdown__trigger', className)} {...props}>
      {children}
    </button>
  )
}

export function DropdownContent({
  children,
  className,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return (
    <div className={cn(className)} {...props}>
      {children}
    </div>
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
      aria-disabled={disabled}
      onClick={(event) => {
        event.stopPropagation()
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
