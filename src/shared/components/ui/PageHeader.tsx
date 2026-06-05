import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '../../utils/cn'

type PageHeaderProps = {
  title: string
  description?: string
  actions?: ReactNode
  className?: string
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  const { t } = useTranslation()

  return (
    <div className={cn('page-header', className)}>
      <div>
        <p className="eyebrow">{t('Admin Console')}</p>
        <h1>{t(title, { defaultValue: title })}</h1>
        {description ? <p className="page-header__description">{t(description, { defaultValue: description })}</p> : null}
      </div>
      {actions ? <div className="page-header__actions">{actions}</div> : null}
    </div>
  )
}
