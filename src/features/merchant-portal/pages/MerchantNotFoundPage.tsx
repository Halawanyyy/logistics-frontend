import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '../../../shared/components/ui/PageHeader'
import { Button } from '../../../shared/components/ui/Button'
import { NotFoundState } from '../../../shared/components/states/NotFoundState'
import { merchantPath } from '../../../shared/routing/paths'

export function MerchantNotFoundPage() {
  const { t } = useTranslation()

  return (
    <div className="page-stack">
      <PageHeader
        title={t('Not found', { defaultValue: 'Not found' })}
        description={t('The page or record you requested could not be found.', { defaultValue: 'The page or record you requested could not be found.' })}
      />

      <NotFoundState
        title={t('The requested resource was not found', { defaultValue: 'The requested resource was not found' })}
        description={t('The page or record you requested does not exist or is no longer available.', { defaultValue: 'The page or record you requested does not exist or is no longer available.' })}
        action={
          <Link className="ui-link-reset" to={merchantPath('/dashboard')}>
            <Button>{t('Back to dashboard', { defaultValue: 'Back to dashboard' })}</Button>
          </Link>
        }
      />
    </div>
  )
}
