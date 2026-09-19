import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
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
import {
  FilterButton,
  FilterPopover,
  FilterField,
  AppliedFilterChips,
} from '../../../shared/components/filters'

export function UsersListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [queryText, setQueryText] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [draftRole, setDraftRole] = useState('all')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: ['users'],
    queryFn: listUsers,
  })
  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })

  const handleOpenChange = (open: boolean) => {
    setFiltersOpen(open)
    if (open) {
      setDraftRole(roleFilter)
    }
  }

  const handleApply = () => {
    setRoleFilter(draftRole)
    setFiltersOpen(false)
  }

  const handleReset = () => {
    setDraftRole('all')
    setRoleFilter('all')
    setFiltersOpen(false)
  }

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
          title={t('Users', { defaultValue: 'Users' })}
          description={t('Internal users returned by `/api/users`.', { defaultValue: 'Internal users returned by `/api/users`.' })}
          actions={
            <Can permission={PERMISSIONS.USERS_CREATE}>
              <Link className="ui-link-reset" to="/admin/users/create">
                <Button>{t('Create User', { defaultValue: 'Create User' })}</Button>
              </Link>
            </Can>
          }
        />
        <EmptyState title={t('No users found', { defaultValue: 'No users found' })} description={t('The API returned an empty users list.', { defaultValue: 'The API returned an empty users list.' })} />
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

  const activeFilterCount = roleFilter !== 'all' ? 1 : 0

  return (
    <section className="page-section">
      <PageHeader
        title={t('Users', { defaultValue: 'Users' })}
        description={t('Internal users ordered by newest first.', { defaultValue: 'Internal users ordered by newest first.' })}
        actions={
          <Can permission={PERMISSIONS.USERS_CREATE}>
            <Link className="ui-link-reset" to="/admin/users/create">
              <Button>{t('Create User', { defaultValue: 'Create User' })}</Button>
            </Link>
          </Can>
        }
      />
      <Card className="table-card">
        <CardHeader className="table-card__header">
          <CardTitle>{t('Users Directory', { defaultValue: 'Users Directory' })}</CardTitle>
          <CardDescription>{t('Internal company accounts returned from the API.', { defaultValue: 'Internal company accounts returned from the API.' })}</CardDescription>
        </CardHeader>
        <CardContent>
          {deleteMutation.error ? <div className="form-error">{getApiErrorMessage(deleteMutation.error)}</div> : null}

          {/* Standard Toolbar */}
          <div className="page-toolbar">
            <div style={{ position: 'relative', flex: '1 1 280px' }}>
              <Search size={16} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, pointerEvents: 'none' }} />
              <Input
                placeholder={t('Search users')}
                value={queryText}
                onChange={(event) => setQueryText(event.target.value)}
              />
            </div>

            <div className="page-toolbar__actions">
              <FilterPopover
                title={t('Filter Users', { defaultValue: 'Filter Users' })}
                open={filtersOpen}
                onOpenChange={handleOpenChange}
                onApply={handleApply}
                onReset={handleReset}
                trigger={
                  <FilterButton
                    activeCount={activeFilterCount}
                    onClick={() => handleOpenChange(!filtersOpen)}
                  />
                }
              >
                <div className="space-y-4">
                  <FilterField label={t('Role')}>
                    <Select value={draftRole} onChange={(event) => setDraftRole(event.target.value)}>
                      <option value="all">{t('All roles')}</option>
                      <option value="admin">admin</option>
                      <option value="staff">staff</option>
                      <option value="warehouse">warehouse</option>
                      <option value="finance">finance</option>
                      <option value="driver">driver</option>
                    </Select>
                  </FilterField>
                </div>
              </FilterPopover>
            </div>
          </div>

          {roleFilter !== 'all' ? (
            <AppliedFilterChips
              chips={[{ key: 'role', label: `${t('Role')}: ${roleFilter}` }]}
              onRemove={() => setRoleFilter('all')}
              onClearAll={() => setRoleFilter('all')}
            />
          ) : null}

          <TableContainer>
            <Table>
              <thead>
                <tr>
                  <TableHead>{t('Name', { defaultValue: 'Name' })}</TableHead>
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
