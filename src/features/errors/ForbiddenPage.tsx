import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '../../shared/components/ui/PageHeader'
import { Button } from '../../shared/components/ui/Button'
import { Card, CardContent } from '../../shared/components/ui/Card'
import { adminPath } from '../../shared/routing/paths'

export function ForbiddenPage() {
  const { t } = useTranslation()

  return (
    <div className="page-stack">
      <PageHeader
        title={t('Access denied', { defaultValue: 'Access denied' })}
        description={t('You do not have permission to access this page.', { defaultValue: 'You do not have permission to access this page.' })}
      />

      <Card>
        <CardContent className="empty-state">
          <p>{t('You do not have permission to access this page.', { defaultValue: 'You do not have permission to access this page.' })}</p>
          <Link className="ui-link-reset" to={adminPath('/dashboard')}>
            <Button>{t('Back to dashboard', { defaultValue: 'Back to dashboard' })}</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
