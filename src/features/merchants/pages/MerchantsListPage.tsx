import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import { deleteMerchant, listMerchants } from '../api/merchants.api'
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

export function MerchantsListPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const searchText = searchParams.get('search') ?? ''
  const [queryText, setQueryText] = useState(searchText)
  const [statusFilter, setStatusFilter] = useState('all')
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: ['merchants'],
    queryFn: listMerchants,
  })
  const deleteMutation = useMutation({
    mutationFn: deleteMerchant,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['merchants'] }),
  })

  useEffect(() => {
    setQueryText(searchText)
  }, [searchText])

  if (query.isLoading) {
    return <LoadingState />
  }

  if (query.isError) {
    return <ErrorState message={getApiErrorMessage(query.error)} onRetry={() => void query.refetch()} />
  }

  if (!query.data) {
    return <ErrorState message={t('Merchants response is empty.', { defaultValue: 'Merchants response is empty.' })} onRetry={() => void query.refetch()} />
  }

  if (!query.data.data.length) {
    return (
      <section className="page-section">
        <PageHeader
          title="Merchants"
          description="Merchant records returned by `/api/merchants`."
          actions={
            <Can permission={PERMISSIONS.MERCHANTS_CREATE}>
              <Link className="ui-link-reset" to="/merchants/create">
                <Button>Create Merchant</Button>
              </Link>
            </Can>
          }
        />
        <EmptyState title="No merchants found" description="The API returned an empty merchants list." />
      </section>
    )
  }

  const merchants = query.data.data.filter((merchant) => {
    const matchesSearch =
      !queryText ||
      [merchant.name, merchant.company_name, merchant.phone].join(' ').toLowerCase().includes(queryText.toLowerCase())
    const matchesStatus = statusFilter === 'all' || merchant.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <section className="page-section">
      <PageHeader
        title="Merchants"
        description="Merchants ordered by newest first."
        actions={
          <Can permission={PERMISSIONS.MERCHANTS_CREATE}>
            <Link className="ui-link-reset" to="/merchants/create">
              <Button>Create Merchant</Button>
            </Link>
          </Can>
        }
      />
      <Card className="table-card">
        <CardHeader className="table-card__header">
          <CardTitle>Merchant Accounts</CardTitle>
          <CardDescription>{t('Operational merchant records and current status.')}</CardDescription>
        </CardHeader>
        <CardContent>
          {deleteMutation.error ? <div className="form-error">{getApiErrorMessage(deleteMutation.error)}</div> : null}
          <div className="filters-bar">
            <Input placeholder={t('Search merchants')} value={queryText} onChange={(event) => setQueryText(event.target.value)} />
            <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">{t('All statuses')}</option>
              <option value="active">active</option>
              <option value="inactive">inactive</option>
            </Select>
          </div>
        <TableContainer>
        <Table variant="striped">
          <thead>
            <tr>
              <TableHead>Name</TableHead>
              <TableHead>{t('Company')}</TableHead>
              <TableHead>{t('Phone')}</TableHead>
              <TableHead>{t('Status')}</TableHead>
              <TableHead>{t('Created At')}</TableHead>
              <TableHead>{t('Actions')}</TableHead>
            </tr>
          </thead>
          <tbody>
            {merchants.map((merchant) => (
              <tr key={merchant.id}>
                <TableCell>
                  <Link className="table-link" to={`/merchants/${merchant.id}`}>
                    {merchant.name}
                  </Link>
                </TableCell>
                <TableCell>{merchant.company_name}</TableCell>
                <TableCell>{merchant.phone}</TableCell>
                <TableCell>
                  <StatusBadge value={merchant.status} />
                </TableCell>
                <TableCell>{formatDate(merchant.created_at)}</TableCell>
                <TableCell>
                  <Dropdown>
                    <DropdownMenu>
                      <DropdownTrigger>...</DropdownTrigger>
                      <DropdownContent>
                        <Can permission={PERMISSIONS.MERCHANTS_UPDATE}>
                          <DropdownItem>
                            <Link className="table-link" to={`/merchants/${merchant.id}/edit`}>
                              {t('Edit')}
                            </Link>
                          </DropdownItem>
                        </Can>
                        <Can permission={PERMISSIONS.MERCHANTS_DELETE}>
                          <DropdownItem
                            destructive
                            onClick={() => {
                              if (window.confirm(t('Delete {{name}}?', { name: merchant.name, defaultValue: `Delete ${merchant.name}?` }))) {
                                deleteMutation.mutate(merchant.id)
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
