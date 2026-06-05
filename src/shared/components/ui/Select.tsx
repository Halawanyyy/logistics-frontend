import type { PropsWithChildren, SelectHTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

type SelectVariant = 'default' | 'error' | 'disabled'

type SelectProps = PropsWithChildren<
  SelectHTMLAttributes<HTMLSelectElement> & {
    variant?: SelectVariant
  }
>

export function Select({
  children,
  className,
  disabled,
  variant = 'default',
  ...props
}: SelectProps) {
  return (
    <select
      className={cn('ui-select', `ui-select--${disabled ? 'disabled' : variant}`, className)}
      disabled={disabled}
      {...props}
    >
      {children}
    </select>
  )
}
