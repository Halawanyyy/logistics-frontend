import type { ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../shared/components/ui/Card'
import { cn } from '../../../shared/utils/cn'
import { inferStatAccent, type StatAccent } from '../../../shared/utils/statAccent'

type StatCardProps = {
  title: string
  value: ReactNode
  description?: string
  icon?: ReactNode
  tone?: 'success' | 'warning' | 'danger' | 'info' | 'neutral'
  accent?: StatAccent
}

export function StatCard({
  title,
  value,
  description,
  icon,
  tone = 'neutral',
  accent,
}: StatCardProps) {
  return (
    <Card variant="stat" className={cn('stat-card', `stat-card--${tone}`)} data-accent={accent ?? inferStatAccent(title)}>
      <CardHeader className="stat-card__header">
        <span className="eyebrow">{title}</span>
        {icon ? <span className="stat-card__icon">{icon}</span> : null}
      </CardHeader>
      <CardContent className="stat-card__content">
        <CardTitle className="stat-card__value">{value}</CardTitle>
        {description ? <p className="stat-card__hint">{description}</p> : null}
      </CardContent>
    </Card>
  )
}
