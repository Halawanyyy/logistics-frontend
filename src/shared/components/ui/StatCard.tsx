import { Card, CardContent, CardHeader, CardTitle } from './Card'
import { inferStatAccent, type StatAccent } from '../../utils/statAccent'

type StatCardProps = {
  hint: string
  label: string
  value: number | string
  accent?: StatAccent
}

export function StatCard({ accent, hint, label, value }: StatCardProps) {
  return (
    <Card variant="stat" className="stat-card" data-accent={accent ?? inferStatAccent(label)}>
      <CardHeader className="stat-card__header">
        <span className="eyebrow">{label}</span>
      </CardHeader>
      <CardContent className="stat-card__content">
        <CardTitle className="stat-card__value">{value}</CardTitle>
        <p className="stat-card__hint">{hint}</p>
      </CardContent>
    </Card>
  )
}
