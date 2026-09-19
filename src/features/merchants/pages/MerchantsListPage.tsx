import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'
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
import {
  FilterButton,
  FilterPopover,
  FilterField,
  AppliedFilterChips,
} from '../../../shared/components/filters'

export function MerchantsListPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const searchText = searchParams.get('search') ?? ''
  const [queryText, setQueryText] = useState(searchText)
  const [statusFilter, setStatusFilter] = useState('all')
  const [draftStatus, setDraftStatus] = useState('all')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const navigate = useNavigate()
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

  const handleOpenChange = (open: boolean) => {
    setFiltersOpen(open)
    if (open) {
      setDraftStatus(statusFilter)
    }
  }

  const handleApply = () => {
    setStatusFilter(draftStatus)
    setFiltersOpen(false)
  }

  const handleReset = () => {
    setDraftStatus('all')
    setStatusFilter('all')
    setFiltersOpen(false)
  }

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
          title={t('Merchants')}
          description={t('Merchant records returned by `/api/merchants`.', { defaultValue: 'Merchant records returned by `/api/merchants`.' })}
          actions={
            <Can permission={PERMISSIONS.MERCHANTS_CREATE}>
              <Link className="ui-link-reset" to="/merchants/create">
                <Button>{t('Create Merchant')}</Button>
              </Link>
            </Can>
          }
        />
        <EmptyState
          title={t('No merchants found', { defaultValue: 'No merchants found' })}
          description={t('The API returned an empty merchants list.', { defaultValue: 'The API returned an empty merchants list.' })}
        />
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

  const activeFilterCount = statusFilter !== 'all' ? 1 : 0

  return (
    <section className="page-section">
      <PageHeader
        title={t('Merchants')}
        description={t('Merchants ordered by newest first.', { defaultValue: 'Merchants ordered by newest first.' })}
        actions={
          <Can permission={PERMISSIONS.MERCHANTS_CREATE}>
            <Link className="ui-link-reset" to="/merchants/create">
              <Button>{t('Create Merchant')}</Button>
            </Link>
          </Can>
        }
      />
      <Card className="table-card">
        <CardHeader className="table-card__header">
          <CardTitle>{t('Merchant Accounts')}</CardTitle>
          <CardDescription>{t('Operational merchant records and current status.')}</CardDescription>
        </CardHeader>
        <CardContent>
          {deleteMutation.error ? <div className="form-error">{getApiErrorMessage(deleteMutation.error)}</div> : null}

          {/* Standard Toolbar */}
          <div className="page-toolbar">
            <div style={{ position: 'relative', flex: '1 1 280px' }}>
              <Search size={16} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, pointerEvents: 'none' }} />
              <Input
                placeholder={t('Search merchants')}
                value={queryText}
                onChange={(event) => setQueryText(event.target.value)}
              />
            </div>

            <div className="page-toolbar__actions">
              <FilterPopover
                title={t('Filter Merchants', { defaultValue: 'Filter Merchants' })}
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
                  <FilterField label={t('Status')}>
                    <Select value={draftStatus} onChange={(event) => setDraftStatus(event.target.value)}>
                      <option value="all">{t('All statuses')}</option>
                      <option value="active">active</option>
                      <option value="inactive">inactive</option>
                    </Select>
                  </FilterField>
                </div>
              </FilterPopover>
            </div>
          </div>

          {statusFilter !== 'all' ? (
            <AppliedFilterChips
              chips={[{ key: 'status', label: `${t('Status')}: ${statusFilter}` }]}
              onRemove={() => setStatusFilter('all')}
              onClearAll={() => setStatusFilter('all')}
            />
          ) : null}

          <TableContainer>
            <Table variant="striped">
              <thead>
                <tr>
                  <TableHead>{t('Name')}</TableHead>
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
                            <DropdownItem onClick={() => navigate(`/merchants/${merchant.id}`)}>
                              {t('View')}
                            </DropdownItem>
                            <Can permission={PERMISSIONS.MERCHANTS_UPDATE}>
                              <DropdownItem onClick={() => navigate(`/merchants/${merchant.id}/edit`)}>
                                {t('Edit')}
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
