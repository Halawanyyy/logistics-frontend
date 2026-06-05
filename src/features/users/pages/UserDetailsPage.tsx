import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { getUser } from '../api/users.api'
import { getApiErrorMessage, isApiNotFound } from '../../../shared/api/api-error'
import { ErrorState } from '../../../shared/components/states/ErrorState'
import { LoadingState } from '../../../shared/components/states/LoadingState'
import { Button } from '../../../shared/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../shared/components/ui/Card'
import { PageHeader } from '../../../shared/components/ui/PageHeader'
import { StatusBadge } from '../../../shared/components/ui/StatusBadge'
import { formatDate } from '../../../shared/utils/formatters'
import { Can } from '../../../shared/auth/Can'
import { PERMISSIONS } from '../../../shared/auth/permission-keys'
import { NotFoundState } from '../../../shared/components/states/NotFoundState'

export function UserDetailsPage() {
  const { t } = useTranslation()
  const { userId } = useParams()
  const query = useQuery({
    queryKey: ['users', userId],
    queryFn: () => getUser(userId!),
    enabled: Boolean(userId),
  })

  if (query.isLoading) {
    return <LoadingState title={t('Loading user', { defaultValue: 'Loading user' })} />
  }

  if (query.isError && isApiNotFound(query.error)) {
    return (
      <NotFoundState
        title={t('User not found', { defaultValue: 'User not found' })}
        description={t('This user record could not be found in the users API.', { defaultValue: 'This user record could not be found in the users API.' })}
      />
    )
  }

  if (query.isError || !query.data) {
    return <ErrorState message={getApiErrorMessage(query.error)} onRetry={() => void query.refetch()} />
  }

  const user = query.data.data

  return (
    <section className="page-section">
      <PageHeader
        title={user.name}
        description={user.email}
        actions={
          <div className="page-header__button-row">
            <Can permission={PERMISSIONS.USERS_UPDATE}>
              <Link className="ui-link-reset" to={`/admin/users/${user.id}/edit`}>
                <Button variant="secondary">{t('Edit')}</Button>
              </Link>
            </Can>
            <Link className="ui-link-reset" to="/admin/users">
              <Button variant="secondary">{t('Back to users')}</Button>
            </Link>
          </div>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>{t('User Profile')}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="detail-list">
            <div><dt>{t('Name')}</dt><dd>{user.name}</dd></div>
            <div><dt>{t('Email')}</dt><dd>{user.email}</dd></div>
            <div><dt>{t('Role')}</dt><dd><StatusBadge value={user.role_slug ?? user.role}>{user.role_name ?? user.role}</StatusBadge></dd></div>
            <div>
              <dt>{t('Permissions')}</dt>
              <dd>
                {user.permissions?.length ? (
                  <div className="permission-group__items">
                    {user.permissions.map((permission) => (
                      <span className="status-chip" key={permission.id} title={permission.slug}>
                        {permission.name}
                      </span>
                    ))}
                  </div>
                ) : t('No explicit backend permissions returned')}
              </dd>
            </div>
            <div><dt>{t('Created')}</dt><dd>{formatDate(user.created_at)}</dd></div>
          </dl>
        </CardContent>
      </Card>
    </section>
  )
}
