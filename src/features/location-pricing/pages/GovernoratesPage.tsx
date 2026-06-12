import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { deleteGovernorate, listGovernorates } from '../api/location-pricing.api'
import { PageHeader } from '../../../shared/components/ui/PageHeader'
import { LoadingState } from '../../../shared/components/feedback/LoadingState'
import { ErrorState } from '../../../shared/components/feedback/ErrorState'
import { EmptyState } from '../../../shared/components/feedback/EmptyState'
import { getApiErrorMessage } from '../../../shared/api/api-error'
import { formatDate } from '../../../shared/utils/formatters'
import { StatusBadge } from '../../../shared/components/ui/StatusBadge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/Card'
import { Input } from '../../../shared/components/ui/Input'
import { Select } from '../../../shared/components/ui/Select'
import { Table, TableCell, TableContainer, TableHead } from '../../../shared/components/ui/Table'
import { Button } from '../../../shared/components/ui/Button'
import { Dropdown, DropdownContent, DropdownItem, DropdownMenu, DropdownTrigger } from '../../../shared/components/ui/Dropdown'
import { Can } from '../../../shared/auth/Can'
import { PERMISSIONS } from '../../../shared/auth/permission-keys'

export function GovernoratesPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [queryText, setQueryText] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: ['governorates'],
    queryFn: listGovernorates,
  })
  const deleteMutation = useMutation({
    mutationFn: deleteGovernorate,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['governorates'] }),
  })

  if (query.isLoading) {
    return <LoadingState />
  }

  if (query.isError) {
    return <ErrorState message={getApiErrorMessage(query.error)} onRetry={() => void query.refetch()} />
  }

  if (!query.data) {
    return (
      <ErrorState message={t('Governorates response is empty.', { defaultValue: 'Governorates response is empty.' })} onRetry={() => void query.refetch()} />
    )
  }

  if (!query.data.data.length) {
    return (
      <section className="page-section">
        <PageHeader title={t('Governorates', { defaultValue: 'Governorates' })} description={t('Location coverage configured in the API.', { defaultValue: 'Location coverage configured in the API.' })} actions={<Can permission={PERMISSIONS.LOCATION_PRICING_CREATE}><Link className="ui-link-reset" to="/governorates/create"><Button>{t('Create Governorate', { defaultValue: 'Create Governorate' })}</Button></Link></Can>} />
        <EmptyState title={t('No governorates found', { defaultValue: 'No governorates found' })} description={t('The API returned an empty governorates list.', { defaultValue: 'The API returned an empty governorates list.' })} />
      </section>
    )
  }

  const governorates = query.data.data.filter((governorate) => {
    const matchesSearch =
      !queryText || governorate.name.toLowerCase().includes(queryText.toLowerCase())
    const statusValue = governorate.is_active ? 'active' : 'inactive'
    const matchesStatus = statusFilter === 'all' || statusValue === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <section className="page-section">
      <PageHeader title={t('Governorates', { defaultValue: 'Governorates' })} description={t('Governorates ordered by newest first.', { defaultValue: 'Governorates ordered by newest first.' })} actions={<Can permission={PERMISSIONS.LOCATION_PRICING_CREATE}><Link className="ui-link-reset" to="/governorates/create"><Button>{t('Create Governorate', { defaultValue: 'Create Governorate' })}</Button></Link></Can>} />
      <Card className="table-card">
        <CardHeader className="table-card__header">
          <CardTitle>{t('Governorates', { defaultValue: 'Governorates' })}</CardTitle>
          <CardDescription>{t('Coverage zones used in shipping and pricing rules.', { defaultValue: 'Coverage zones used in shipping and pricing rules.' })}</CardDescription>
        </CardHeader>
        <CardContent>
          {deleteMutation.error ? <div className="form-error">{getApiErrorMessage(deleteMutation.error)}</div> : null}
          <div className="filters-bar">
            <Input placeholder={t('Search governorates', { defaultValue: 'Search governorates' })} value={queryText} onChange={(event) => setQueryText(event.target.value)} />
            <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">{t('All statuses')}</option>
              <option value="active">active</option>
              <option value="inactive">inactive</option>
            </Select>
          </div>
        <TableContainer>
        <Table>
          <thead>
            <tr>
              <TableHead>{t('Name')}</TableHead>
              <TableHead>{t('Status')}</TableHead>
              <TableHead>{t('Created At')}</TableHead>
              <TableHead>{t('Actions')}</TableHead>
            </tr>
          </thead>
          <tbody>
            {governorates.map((governorate) => (
              <tr key={governorate.id}>
                <TableCell>
                  <Link className="table-link" to={`/governorates/${governorate.id}`}>
                    {governorate.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <StatusBadge value={governorate.is_active} />
                </TableCell>
                <TableCell>{formatDate(governorate.created_at)}</TableCell>
                <TableCell>
                  <Dropdown>
                    <DropdownMenu>
                      <DropdownTrigger>...</DropdownTrigger>
                      <DropdownContent>
                        <DropdownItem onClick={() => navigate(`/governorates/${governorate.id}`)}>{t('View')}</DropdownItem>
                        <Can permission={PERMISSIONS.LOCATION_PRICING_UPDATE}>
                          <DropdownItem onClick={() => navigate(`/governorates/${governorate.id}/edit`)}>{t('Edit')}</DropdownItem>
                        </Can>
                        <Can permission={PERMISSIONS.LOCATION_PRICING_DELETE}>
                          <DropdownItem destructive onClick={() => {
                            if (window.confirm(t('Delete {{name}}?', { name: governorate.name, defaultValue: `Delete ${governorate.name}?` }))) {
                              deleteMutation.mutate(governorate.id)
                            }
                          }}>{t('Delete')}</DropdownItem>
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
