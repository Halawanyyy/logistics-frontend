import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { deleteRole, listRoles } from '../api/roles.api'
import { getApiErrorMessage } from '../../../shared/api/api-error'
import { EmptyState } from '../../../shared/components/feedback/EmptyState'
import { ErrorState } from '../../../shared/components/feedback/ErrorState'
import { LoadingState } from '../../../shared/components/feedback/LoadingState'
import { Can } from '../../../shared/auth/Can'
import { PERMISSIONS } from '../../../shared/auth/permission-keys'
import { Button } from '../../../shared/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/Card'
import { PageHeader } from '../../../shared/components/ui/PageHeader'
import { StatusBadge } from '../../../shared/components/ui/StatusBadge'
import { Table, TableCell, TableContainer, TableHead } from '../../../shared/components/ui/Table'

export function RolesListPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: ['roles'],
    queryFn: listRoles,
  })
  const deleteMutation = useMutation({
    mutationFn: deleteRole,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['roles'] })
    },
  })

  if (query.isLoading) {
    return <LoadingState title={t('Loading roles')} />
  }

  if (query.isError || !query.data) {
    return <ErrorState message={getApiErrorMessage(query.error)} onRetry={() => void query.refetch()} />
  }

  const roles = query.data.data

  return (
    <section className="page-section">
      <PageHeader
        title={t('Roles', { defaultValue: 'Roles' })}
        description={t('Internal roles and their grouped permissions.', { defaultValue: 'Internal roles and their grouped permissions.' })}
        actions={
          <Can permission={PERMISSIONS.ROLES_CREATE}>
            <Link className="ui-link-reset" to="/admin/roles/create">
              <Button>{t('Create Role', { defaultValue: 'Create Role' })}</Button>
            </Link>
          </Can>
        }
      />
      <Card className="table-card">
        <CardHeader className="table-card__header">
          <CardTitle>{t('Roles')}</CardTitle>
          <CardDescription>{t('System roles are protected and custom roles are editable.')}</CardDescription>
        </CardHeader>
        <CardContent>
          {deleteMutation.error ? <div className="form-error">{getApiErrorMessage(deleteMutation.error)}</div> : null}
          {!roles.length ? <EmptyState title={t('No roles found', { defaultValue: 'No roles found' })} description={t('The API returned no roles.', { defaultValue: 'The API returned no roles.' })} /> : null}
          {roles.length ? (
            <TableContainer>
              <Table>
                <thead>
                  <tr>
                    <TableHead>{t('Name', { defaultValue: 'Name' })}</TableHead>
                    <TableHead>{t('Slug')}</TableHead>
                    <TableHead>{t('Status')}</TableHead>
                    <TableHead>{t('Type')}</TableHead>
                    <TableHead>{t('Actions')}</TableHead>
                  </tr>
                </thead>
                <tbody>
                  {roles.map((role) => (
                    <tr key={role.id}>
                      <TableCell>
                        <Link className="table-link" to={`/admin/roles/${role.id}`}>
                          {role.name}
                        </Link>
                      </TableCell>
                      <TableCell>{role.slug}</TableCell>
                      <TableCell><StatusBadge value={role.status} /></TableCell>
                      <TableCell>{role.is_system ? t('System') : t('Custom')}</TableCell>
                      <TableCell>
                        <div className="page-header__button-row">
                          <Can permission={PERMISSIONS.ROLES_UPDATE}>
                            <Link className="table-link" to={`/admin/roles/${role.id}/edit`}>
                              {t('Edit')}
                            </Link>
                          </Can>
                          {!role.is_system && role.slug !== 'super_admin' ? (
                            <Can permission={PERMISSIONS.ROLES_DELETE}>
                              <button
                                className="table-link"
                                type="button"
                                onClick={() => {
                                  if (window.confirm(t('Delete role {{name}}?', { name: role.name, defaultValue: `Delete role ${role.name}?` }))) {
                                    deleteMutation.mutate(role.id)
                                  }
                                }}
                              >
                                {t('Delete')}
                              </button>
                            </Can>
                          ) : null}
                        </div>
                      </TableCell>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableContainer>
          ) : null}
        </CardContent>
      </Card>
    </section>
  )
}
