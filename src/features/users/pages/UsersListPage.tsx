import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { deleteUser, listUsers } from '../api/users.api'
import { PageHeader } from '../../../shared/components/ui/PageHeader'
import { LoadingState } from '../../../shared/components/feedback/LoadingState'
import { ErrorState } from '../../../shared/components/feedback/ErrorState'
import { EmptyState } from '../../../shared/components/feedback/EmptyState'
import { getApiErrorMessage } from '../../../shared/api/api-error'
import { formatDate } from '../../../shared/utils/formatters'
import { StatusBadge } from '../../../shared/components/ui/StatusBadge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/Card'
import { Dropdown, DropdownContent, DropdownItem, DropdownMenu, DropdownTrigger } from '../../../shared/components/ui/Dropdown'
import { Input } from '../../../shared/components/ui/Input'
import { Select } from '../../../shared/components/ui/Select'
import { Table, TableCell, TableContainer, TableHead } from '../../../shared/components/ui/Table'
import { Button } from '../../../shared/components/ui/Button'
import { Can } from '../../../shared/auth/Can'
import { PERMISSIONS } from '../../../shared/auth/permission-keys'

export function UsersListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [queryText, setQueryText] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: ['users'],
    queryFn: listUsers,
  })
  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })

  if (query.isLoading) {
    return <LoadingState />
  }

  if (query.isError) {
    return <ErrorState message={getApiErrorMessage(query.error)} onRetry={() => void query.refetch()} />
  }

  if (!query.data) {
    return <ErrorState message={t('Users response is empty.', { defaultValue: 'Users response is empty.' })} onRetry={() => void query.refetch()} />
  }

  if (!query.data.data.length) {
    return (
      <section className="page-section">
        <PageHeader
          title="Users"
          description="Internal users returned by `/api/users`."
          actions={
            <Can permission={PERMISSIONS.USERS_CREATE}>
              <Link className="ui-link-reset" to="/admin/users/create">
                <Button>Create User</Button>
              </Link>
            </Can>
          }
        />
        <EmptyState title="No users found" description="The API returned an empty users list." />
      </section>
    )
  }

  const users = query.data.data.filter((user) => {
    const matchesSearch =
      !queryText ||
      [user.name, user.email, user.role].join(' ').toLowerCase().includes(queryText.toLowerCase())
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  return (
    <section className="page-section">
      <PageHeader
        title="Users"
        description="Internal users ordered by newest first."
        actions={
          <Can permission={PERMISSIONS.USERS_CREATE}>
            <Link className="ui-link-reset" to="/admin/users/create">
              <Button>Create User</Button>
            </Link>
          </Can>
        }
      />
      <Card className="table-card">
        <CardHeader className="table-card__header">
          <CardTitle>Users Directory</CardTitle>
          <CardDescription>{t('Internal company accounts returned from the API.', { defaultValue: 'Internal company accounts returned from the API.' })}</CardDescription>
        </CardHeader>
        <CardContent>
          {deleteMutation.error ? <div className="form-error">{getApiErrorMessage(deleteMutation.error)}</div> : null}
          <div className="filters-bar">
            <Input placeholder={t('Search users')} value={queryText} onChange={(event) => setQueryText(event.target.value)} />
            <Select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
              <option value="all">{t('All roles')}</option>
              <option value="admin">admin</option>
              <option value="staff">staff</option>
              <option value="warehouse">warehouse</option>
              <option value="finance">finance</option>
              <option value="driver">driver</option>
            </Select>
          </div>
        <TableContainer>
        <Table>
          <thead>
            <tr>
              <TableHead>Name</TableHead>
              <TableHead>{t('Email')}</TableHead>
              <TableHead>{t('Role')}</TableHead>
              <TableHead>{t('Created At')}</TableHead>
              <TableHead>{t('Actions')}</TableHead>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <TableCell>
                  <Link className="table-link" to={`/admin/users/${user.id}`}>
                    {user.name}
                  </Link>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <StatusBadge value={user.role_slug ?? user.role}>{user.role_name ?? user.role}</StatusBadge>
                </TableCell>
                <TableCell>{formatDate(user.created_at)}</TableCell>
                <TableCell>
                  <Dropdown>
                    <DropdownMenu>
                      <DropdownTrigger>...</DropdownTrigger>
                      <DropdownContent>
                        <DropdownItem onClick={() => navigate(`/admin/users/${user.id}`)}>
                          {t('View profile details')}
                        </DropdownItem>
                        <Can permission={PERMISSIONS.USERS_UPDATE}>
                          <DropdownItem onClick={() => navigate(`/admin/users/${user.id}/edit`)}>
                            {t('Edit')}
                          </DropdownItem>
                        </Can>
                        <Can permission={PERMISSIONS.USERS_DELETE}>
                          <DropdownItem
                            destructive
                            onClick={() => {
                              if (window.confirm(t('Delete {{name}}?', { name: user.name, defaultValue: `Delete ${user.name}?` }))) {
                                deleteMutation.mutate(user.id)
                              }
                            }}
                          >
                            {t('Delete')}
                          </DropdownItem>
                        </Can>
                      </DropdownContent>
                    </DropdownMenu>
                  </Dropdown>
                </TableCell>
              </tr>
            ))}
          </tbody>
        </Table>
        </TableContainer>
        </CardContent>
      </Card>
    </section>
  )
}
