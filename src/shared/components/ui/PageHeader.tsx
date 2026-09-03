import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '../../utils/cn'

type PageHeaderProps = {
  title: string
  description?: ReactNode
  eyebrow?: string
  actions?: ReactNode
  className?: string
}

export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  className,
}: PageHeaderProps) {
  const { t } = useTranslation()
  const resolvedEyebrow = eyebrow ?? 'Admin Console'

  return (
    <div className={cn('page-header', className)}>
      <div className="page-header__content">
        <p className="page-header__eyebrow eyebrow">{t(resolvedEyebrow, { defaultValue: resolvedEyebrow })}</p>
        <h1>{t(title, { defaultValue: title })}</h1>
        {description ? (
          <div className="page-header__description">
            {typeof description === 'string' ? t(description, { defaultValue: description }) : description}
          </div>
        ) : null}
      </div>
      {actions ? <div className="page-header__actions">{actions}</div> : null}
    </div>
  )
}
