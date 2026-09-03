import type { ReactNode } from 'react'
import { ErrorState } from '../../../shared/components/states/ErrorState'
import { LoadingState } from '../../../shared/components/states/LoadingState'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/Card'

type LowStockQuickCardProps = {
  title: string
  description: string
  countLabel: string
  count: number
  loading?: boolean
  error?: string | null
  actions?: ReactNode
}

export function LowStockQuickCard({
  title,
  description,
  countLabel,
  count,
  loading = false,
  error,
  actions,
}: LowStockQuickCardProps) {
  return (
    <Card variant="stat" className="stat-card stat-card--neutral" data-accent="inventory">
      <CardHeader className="stat-card__header">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="page-stack">
        {loading ? <LoadingState title={`Loading ${title.toLowerCase()}`} /> : null}
        {!loading && error ? <ErrorState title={`${title} unavailable`} message={error} /> : null}
        {!loading && !error ? (
          <>
            <div className="insight-tile">
              <p>{countLabel}</p>
              <strong>{count}</strong>
            </div>
            {actions ? <div className="page-header__button-row">{actions}</div> : null}
          </>
        ) : null}
      </CardContent>
    </Card>
  )
}
