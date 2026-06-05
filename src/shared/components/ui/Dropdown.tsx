import { useEffect, useRef, useState, type HTMLAttributes, type PropsWithChildren } from 'react'
import { cn } from '../../utils/cn'

export function Dropdown({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) {
  return <div className={cn('ui-dropdown', className)}>{children}</div>
}

export function DropdownMenu({
  align = 'right',
  children,
}: PropsWithChildren<{ align?: 'left' | 'right' }>) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    window.addEventListener('mousedown', handleClick)
    return () => window.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} className="ui-dropdown__menu">
      {Array.isArray(children)
        ? children.map((child, index) =>
            index === 0 && child
              ? (
                  <div key={index} onClick={() => setOpen((value) => !value)}>
                    {child}
                  </div>
                )
              : open
                ? (
                    <div key={index} className={cn('ui-dropdown__content', `ui-dropdown__content--${align}`)}>
                      {child}
                    </div>
                  )
                : null,
          )
        : children}
    </div>
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
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLDivElement> & { destructive?: boolean }>) {
  return (
    <div className={cn('ui-dropdown__item', destructive && 'ui-dropdown__item--danger', className)} {...props}>
      {children}
    </div>
  )
}
