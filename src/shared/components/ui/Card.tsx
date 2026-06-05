import type { HTMLAttributes, PropsWithChildren } from 'react'
import { cn } from '../../utils/cn'

type CardVariant = 'default' | 'hoverable' | 'flat' | 'stat'

type CardProps = PropsWithChildren<
  HTMLAttributes<HTMLElement> & {
    variant?: CardVariant
  }
>

export function Card({
  children,
  className,
  variant = 'default',
  ...props
}: CardProps) {
  return (
    <section className={cn('ui-card', `ui-card--${variant}`, className)} {...props}>
      {children}
    </section>
  )
}

export function CardHeader({
  children,
  className,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return (
    <div className={cn('ui-card__header', className)} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({
  children,
  className,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLHeadingElement>>) {
  return (
    <h2 className={cn('ui-card__title', className)} {...props}>
      {children}
    </h2>
  )
}

export function CardDescription({
  children,
  className,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLParagraphElement>>) {
  return (
    <p className={cn('ui-card__description', className)} {...props}>
      {children}
    </p>
  )
}

export function CardContent({
  children,
  className,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return (
    <div className={cn('ui-card__content', className)} {...props}>
      {children}
    </div>
  )
}
