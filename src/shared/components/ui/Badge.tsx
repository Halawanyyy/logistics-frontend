import type { HTMLAttributes, PropsWithChildren } from 'react'
import { cn } from '../../utils/cn'

type BadgeVariant =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral'
  | 'accent'
  | 'slate'
  | 'teal'
  | 'cyan'
  | 'violet'
  | 'orange'
  | 'rose'

type BadgeProps = PropsWithChildren<
  HTMLAttributes<HTMLSpanElement> & {
    variant?: BadgeVariant
  }
>

export function Badge({
  children,
  className,
  variant = 'neutral',
  ...props
}: BadgeProps) {
  return (
    <span className={cn('ui-badge', `ui-badge--${variant}`, className)} {...props}>
      {children}
    </span>
  )
}
