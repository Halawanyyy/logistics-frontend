import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { deleteArea, listAreas } from '../api/location-pricing.api'
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

export function AreasPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [queryText, setQueryText] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: ['areas'],
    queryFn: () => listAreas(),
  })
  const deleteMutation = useMutation({
    mutationFn: deleteArea,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['areas'] }),
  })

  if (query.isLoading) {
    return <LoadingState />
  }

  if (query.isError) {
    return <ErrorState message={getApiErrorMessage(query.error)} onRetry={() => void query.refetch()} />
  }

  if (!query.data) {
    return <ErrorState message={t('Areas response is empty.', { defaultValue: 'Areas response is empty.' })} onRetry={() => void query.refetch()} />
  }

  if (!query.data.data.length) {
    return (
      <section className="page-section">
        <PageHeader title={t('Areas', { defaultValue: 'Areas' })} description={t('Areas grouped under their governorates.', { defaultValue: 'Areas grouped under their governorates.' })} actions={<Can permission={PERMISSIONS.LOCATION_PRICING_CREATE}><Link className="ui-link-reset" to="/areas/create"><Button>{t('Create Area', { defaultValue: 'Create Area' })}</Button></Link></Can>} />
        <EmptyState title={t('No areas found', { defaultValue: 'No areas found' })} description={t('The API returned an empty areas list.', { defaultValue: 'The API returned an empty areas list.' })} />
      </section>
    )
  }

  const areas = query.data.data.filter((area) => {
    const matchesSearch =
      !queryText ||
      [area.name, area.governorate_name].join(' ').toLowerCase().includes(queryText.toLowerCase())
    const statusValue = area.is_active ? 'active' : 'inactive'
    const matchesStatus = statusFilter === 'all' || statusValue === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <section className="page-section">
      <PageHeader title={t('Areas', { defaultValue: 'Areas' })} description={t('All areas with the related governorate name.', { defaultValue: 'All areas with the related governorate name.' })} actions={<Can permission={PERMISSIONS.LOCATION_PRICING_CREATE}><Link className="ui-link-reset" to="/areas/create"><Button>{t('Create Area', { defaultValue: 'Create Area' })}</Button></Link></Can>} />
      <Card className="table-card">
        <CardHeader className="table-card__header">
          <CardTitle>{t('Areas', { defaultValue: 'Areas' })}</CardTitle>
          <CardDescription>{t('Delivery areas grouped beneath governorates.', { defaultValue: 'Delivery areas grouped beneath governorates.' })}</CardDescription>
        </CardHeader>
        <CardContent>
          {deleteMutation.error ? <div className="form-error">{getApiErrorMessage(deleteMutation.error)}</div> : null}
          <div className="filters-bar">
            <Input placeholder={t('Search areas', { defaultValue: 'Search areas' })} value={queryText} onChange={(event) => setQueryText(event.target.value)} />
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
              <TableHead>{t('Name', { defaultValue: 'Name' })}</TableHead>
              <TableHead>{t('Governorate', { defaultValue: 'Governorate' })}</TableHead>
              <TableHead>{t('Status', { defaultValue: 'Status' })}</TableHead>
              <TableHead>{t('Created At', { defaultValue: 'Created At' })}</TableHead>
              <TableHead>{t('Actions', { defaultValue: 'Actions' })}</TableHead>
            </tr>
          </thead>
          <tbody>
            {areas.map((area) => (
              <tr key={area.id}>
                <TableCell>
                  <Link className="table-link" to={`/areas/${area.id}`}>
                    {area.name}
                  </Link>
                </TableCell>
                <TableCell>{area.governorate_name}</TableCell>
                <TableCell>
                  <StatusBadge value={area.is_active} />
                </TableCell>
                <TableCell>{formatDate(area.created_at)}</TableCell>
                <TableCell>
                  <Dropdown>
                    <DropdownMenu>
                      <DropdownTrigger>...</DropdownTrigger>
                      <DropdownContent>
                        <DropdownItem onClick={() => navigate(`/areas/${area.id}`)}>{t('View')}</DropdownItem>
                        <Can permission={PERMISSIONS.LOCATION_PRICING_UPDATE}>
                          <DropdownItem onClick={() => navigate(`/areas/${area.id}/edit`)}>{t('Edit')}</DropdownItem>
                        </Can>
                        <Can permission={PERMISSIONS.LOCATION_PRICING_DELETE}>
                          <DropdownItem destructive onClick={() => {
                            if (window.confirm(t('Delete {{name}}?', { name: area.name, defaultValue: `Delete ${area.name}?` }))) {
                              deleteMutation.mutate(area.id)
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
