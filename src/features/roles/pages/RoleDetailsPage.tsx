import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { getRole } from '../api/roles.api'
import { getApiErrorMessage } from '../../../shared/api/api-error'
import { ErrorState } from '../../../shared/components/feedback/ErrorState'
import { LoadingState } from '../../../shared/components/feedback/LoadingState'
import { Can } from '../../../shared/auth/Can'
import { PERMISSIONS } from '../../../shared/auth/permission-keys'
import { Button } from '../../../shared/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../shared/components/ui/Card'
import { PageHeader } from '../../../shared/components/ui/PageHeader'
import { StatusBadge } from '../../../shared/components/ui/StatusBadge'

export function RoleDetailsPage() {
  const { t } = useTranslation()
  const { roleId } = useParams()
  const query = useQuery({
    queryKey: ['roles', roleId],
    queryFn: () => getRole(roleId!),
    enabled: Boolean(roleId),
  })

  if (query.isLoading) {
    return <LoadingState title={t('Loading role')} />
  }

  if (query.isError || !query.data) {
    return <ErrorState message={getApiErrorMessage(query.error)} onRetry={() => void query.refetch()} />
  }

  const role = query.data.data

  return (
    <section className="page-section">
      <PageHeader
        title={role.name}
        description={role.description ?? role.slug}
        actions={
          <div className="page-header__button-row">
            <Can permission={PERMISSIONS.ROLES_UPDATE}>
              <Link className="ui-link-reset" to={`/admin/roles/${role.id}/edit`}>
                <Button variant="secondary">{t('Edit')}</Button>
              </Link>
            </Can>
            <Link className="ui-link-reset" to="/admin/roles">
              <Button variant="secondary">{t('Back')}</Button>
            </Link>
          </div>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>{t('Role Summary')}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="detail-list">
            <div><dt>{t('Slug')}</dt><dd>{role.slug}</dd></div>
            <div><dt>{t('Status')}</dt><dd><StatusBadge value={role.status} /></dd></div>
            <div><dt>{t('Type')}</dt><dd>{role.is_system ? t('System role') : t('Custom role')}</dd></div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('Permissions')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="permission-groups">
            {Object.entries(role.permissions).map(([module, permissions]) => (
              <div className="permission-group" key={module}>
                <h4>{module}</h4>
                <div className="permission-group__items">
                  {permissions.map((permission) => (
                    <span className="status-chip" key={permission.id}>
                      {permission.name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
