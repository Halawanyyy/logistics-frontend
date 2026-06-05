import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'

type NotFoundStateProps = {
  title?: string
  description?: string
  action?: ReactNode
  actionLabel?: string
  onAction?: () => void
}

export function NotFoundState({
  title = 'Record not found',
  description = 'The requested record could not be found or may have been removed.',
  action,
  actionLabel,
  onAction,
}: NotFoundStateProps) {
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
