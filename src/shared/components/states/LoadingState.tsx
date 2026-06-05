import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { Skeleton } from '../ui/Skeleton'

type LoadingStateProps = {
  title?: string
  description?: string
}

export function LoadingState({
  title = 'Loading data',
  description = 'Please wait while we fetch the latest records.',
}: LoadingStateProps) {
  const { t } = useTranslation()

  return (
    <Card className="feedback-card">
      <CardHeader className="feedback-card__header">
        <CardTitle>{t(title, { defaultValue: title })}</CardTitle>
      </CardHeader>
      <CardContent className="feedback-card__content">
        <p>{t(description, { defaultValue: description })}</p>
        <div className="loading-stack" aria-hidden="true">
          <Skeleton className="loading-stack__bar loading-stack__bar--lg" />
          <Skeleton className="loading-stack__bar" />
          <Skeleton className="loading-stack__bar" />
        </div>
      </CardContent>
    </Card>
  )
}
