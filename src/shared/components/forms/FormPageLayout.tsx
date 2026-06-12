import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { FileText } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '../ui/Button'
import { Card, CardContent } from '../ui/Card'
import { PageHeader } from '../ui/PageHeader'
import { cn } from '../../utils/cn'

type FormPageLayoutProps = {
  backLabel?: string
  backTo: string
  children: ReactNode
  className?: string
  description?: string
  disableInnerPanel?: boolean
  eyebrow?: string
  sectionDescription?: string
  sectionIcon?: ReactNode
  sectionTitle?: string
  title: string
}

export function FormPageLayout({
  backLabel = 'Back',
  backTo,
  children,
  className,
  description,
  disableInnerPanel = false,
  eyebrow,
  sectionDescription,
  sectionIcon = <FileText size={18} />,
  sectionTitle,
  title,
}: FormPageLayoutProps) {
  const { t } = useTranslation()

  return (
    <section className={cn('page-section page-section--form', className)}>
      <PageHeader
        className="form-page-header"
        eyebrow={eyebrow}
        title={title}
        description={description}
        actions={(
          <Link className="ui-link-reset form-page-header__back-link" to={backTo}>
            <Button variant="secondary">{t(backLabel, { defaultValue: backLabel })}</Button>
          </Link>
        )}
      />

      <Card className="form-page-card">
        <CardContent className="form-page-card__content">
          {disableInnerPanel ? (
            children
          ) : (
            <div className="form-section form-page-card__panel">
              <div className="form-section__header">
                <div className="form-section__header-copy">
                  <h3 className="form-section__title">{t(sectionTitle ?? '', { defaultValue: sectionTitle ?? '' })}</h3>
                  {sectionDescription ? (
                    <p className="form-section__description">{t(sectionDescription, { defaultValue: sectionDescription })}</p>
                  ) : null}
                </div>
                {sectionIcon ? (
                  <span className="form-section__icon" aria-hidden="true">
                    {sectionIcon}
                  </span>
                ) : null}
              </div>
              <div className="form-section__body">
                {children}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  )
}
