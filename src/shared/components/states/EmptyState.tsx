import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'

type EmptyStateProps = {
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  action?: ReactNode
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  action,
}: EmptyStateProps) {
  const { t } = useTranslation()

  return (
    <Card className="feedback-card">
      <CardHeader className="feedback-card__header">
        <CardTitle>{t(title, { defaultValue: title })}</CardTitle>
      </CardHeader>
      <CardContent className="feedback-card__content">
        <p>{t(description, { defaultValue: description })}</p>
        {action ?? (actionLabel && onAction ? (
          <Button type="button" variant="secondary" onClick={onAction}>
            {t(actionLabel, { defaultValue: actionLabel })}
          </Button>
        ) : null)}
      </CardContent>
    </Card>
  )
}
