import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'

type ErrorStateProps = {
  title?: string
  message: string
  onRetry?: () => void
  actions?: ReactNode
}

export function ErrorState({
  title = 'Unable to load data',
  message,
  onRetry,
  actions,
}: ErrorStateProps) {
  const { t } = useTranslation()

  return (
    <Card className="feedback-card feedback-card--error">
      <CardHeader className="feedback-card__header">
        <CardTitle>{t(title, { defaultValue: title })}</CardTitle>
      </CardHeader>
      <CardContent className="feedback-card__content">
        <p>{message}</p>
        <div className="form-actions">
          {onRetry ? (
            <Button variant="secondary" type="button" onClick={onRetry}>
              {t('Try again')}
            </Button>
          ) : null}
          {actions}
        </div>
      </CardContent>
    </Card>
  )
}
