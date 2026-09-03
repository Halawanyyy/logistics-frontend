import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import {
  deleteCompanyCatalogItem,
  listCompanyCatalogItems,
} from '../api/companyCatalog.api'
import { type CompanyCatalogItemType } from '../types/companyCatalog.types'
import { getApiErrorMessage } from '../../../shared/api/api-error'
import { Can } from '../../../shared/auth/Can'
import { PERMISSIONS } from '../../../shared/auth/permission-keys'
import { EmptyState } from '../../../shared/components/feedback/EmptyState'
import { ErrorState } from '../../../shared/components/feedback/ErrorState'
import { LoadingState } from '../../../shared/components/feedback/LoadingState'
import { ConfirmActionModal } from '../../../shared/components/modals/ConfirmActionModal'
import { MoneyDisplay } from '../../../shared/components/display/MoneyDisplay'
import { Button } from '../../../shared/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/Card'
import { Dropdown, DropdownContent, DropdownItem, DropdownMenu, DropdownTrigger } from '../../../shared/components/ui/Dropdown'
import { Input } from '../../../shared/components/ui/Input'
import { PageHeader } from '../../../shared/components/ui/PageHeader'
import { Select } from '../../../shared/components/ui/Select'
import { StatusBadge } from '../../../shared/components/ui/StatusBadge'
import { Table, TableCell, TableContainer, TableHead } from '../../../shared/components/ui/Table'
import { adminPath } from '../../../shared/routing/paths'

const typeFilters: Array<{ label: string; value: 'all' | CompanyCatalogItemType }> = [
  { label: 'All', value: 'all' },
  { label: 'Packaging Products', value: 'packaging_product' },
  { label: 'Storage Services', value: 'storage_service' },
  { label: 'Fulfillment Services', value: 'fulfillment_service' },
  { label: 'Other Services', value: 'other_service' },
]

function getTypeLabel(type: string, t: (key: string, options?: { defaultValue?: string }) => string) {
  switch (type) {
    case 'packaging_product':
      return t('Packaging Products', { defaultValue: 'Packaging Products' })
    case 'storage_service':
      return t('Storage Services', { defaultValue: 'Storage Services' })
    case 'fulfillment_service':
      return t('Fulfillment Services', { defaultValue: 'Fulfillment Services' })
    case 'other_service':
      return t('Other Services', { defaultValue: 'Other Services' })
    default:
      return type
    }
}

export function CompanyCatalogPanel({
  embedded = false,
  onCountChange,
}: {
  embedded?: boolean
  onCountChange?: (count: number) => void
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | CompanyCatalogItemType>('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [visibilityFilter, setVisibilityFilter] = useState('all')
  const [pendingDelete, setPendingDelete] = useState<{ id: number; name: string } | null>(null)

  const queryParams = useMemo(() => ({
    search: search.trim() || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    type: typeFilter !== 'all' ? typeFilter : undefined,
    is_visible_to_merchants: visibilityFilter === 'all'
      ? undefined
      : visibilityFilter === 'visible'
        ? '1'
        : '0',
  }), [search, statusFilter, typeFilter, visibilityFilter])

  const query = useQuery({
    queryKey: ['company-catalog-items', queryParams],
    queryFn: () => listCompanyCatalogItems(queryParams),
  })

  useEffect(() => {
    if (query.data) {
      onCountChange?.(query.data.data.length)
    }
  }, [onCountChange, query.data])

  const deleteMutation = useMutation({
    mutationFn: (companyCatalogItemId: number) => deleteCompanyCatalogItem(companyCatalogItemId),
    onSuccess: async () => {
      setPendingDelete(null)
      await queryClient.invalidateQueries({ queryKey: ['company-catalog-items'] })
    },
  })

  if (query.isLoading) {
    return <LoadingState title={t('Loading company catalog', { defaultValue: 'Loading company catalog' })} />
  }

  if (query.isError) {
    return <ErrorState message={getApiErrorMessage(query.error)} onRetry={() => void query.refetch()} />
  }

  if (!query.data) {
    return <ErrorState message={t('Company catalog response is empty.', { defaultValue: 'Company catalog response is empty.' })} onRetry={() => void query.refetch()} />
  }

  return (
    <section className="page-section">
      {!embedded ? <PageHeader
        title={t('Company Catalog', { defaultValue: 'Company Catalog' })}
        description={t('Manage company-owned packaging products and service catalog items.', {
          defaultValue: 'Manage company-owned packaging products and service catalog items.',
        })}
        actions={(
          <Can permission={PERMISSIONS.COMPANY_CATALOG_CREATE}>
            <Link className="ui-link-reset" to={adminPath('/company-catalog/create')}>
              <Button>{t('Create Company Catalog Item', { defaultValue: 'Create Company Catalog Item' })}</Button>
            </Link>
          </Can>
        )}
      /> : null}

      <Card className="table-card">
        <CardHeader className="table-card__header">
          <div>
            <CardTitle>{t('Company Catalog', { defaultValue: 'Company Catalog' })}</CardTitle>
            <CardDescription>{t('Manage company-owned packaging products and service catalog items.', {
              defaultValue: 'Manage company-owned packaging products and service catalog items.',
            })}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {deleteMutation.error ? <div className="form-error">{getApiErrorMessage(deleteMutation.error)}</div> : null}

          <div className="filters-chip-row">
            {typeFilters.map((filter) => (
              <Button
                key={filter.value}
                variant={typeFilter === filter.value ? 'primary' : 'secondary'}
                onClick={() => setTypeFilter(filter.value)}
              >
                {t(filter.label, { defaultValue: filter.label })}
              </Button>
            ))}
          </div>

          <div className="filters-bar">
            <Input
              placeholder={t('Search company catalog', { defaultValue: 'Search company catalog' })}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">{t('All statuses', { defaultValue: 'All statuses' })}</option>
              <option value="active">{t('active', { defaultValue: 'active' })}</option>
              <option value="inactive">{t('inactive', { defaultValue: 'inactive' })}</option>
            </Select>
            <Select value={visibilityFilter} onChange={(event) => setVisibilityFilter(event.target.value)}>
              <option value="all">{t('All visibility', { defaultValue: 'All visibility' })}</option>
              <option value="visible">{t('Visible to merchants', { defaultValue: 'Visible to merchants' })}</option>
              <option value="hidden">{t('Hidden from merchants', { defaultValue: 'Hidden from merchants' })}</option>
            </Select>
          </div>

          {query.data.data.length ? (
            <TableContainer>
              <Table variant="striped">
                <thead>
                  <tr>
                    <TableHead>{t('Name')}</TableHead>
                    <TableHead>{t('SKU', { defaultValue: 'SKU' })}</TableHead>
                    <TableHead>{t('Type')}</TableHead>
                    <TableHead>{t('Category', { defaultValue: 'Category' })}</TableHead>
                    <TableHead>{t('Unit Price', { defaultValue: 'Unit Price' })}</TableHead>
                    <TableHead>{t('Merchant Visible', { defaultValue: 'Merchant Visible' })}</TableHead>
                    <TableHead>{t('Status')}</TableHead>
                    <TableHead>{t('Sort Order', { defaultValue: 'Sort Order' })}</TableHead>
                    <TableHead>{t('Actions')}</TableHead>
                  </tr>
                </thead>
                <tbody>
                  {query.data.data.map((item) => (
                    <tr key={item.id}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.sku ?? '—'}</TableCell>
                      <TableCell>{getTypeLabel(item.type, t)}</TableCell>
                      <TableCell>{item.category ?? '—'}</TableCell>
                      <TableCell><MoneyDisplay value={item.unit_price} /></TableCell>
                      <TableCell>
                        <StatusBadge value={item.is_visible_to_merchants}>
                          {item.is_visible_to_merchants
                            ? t('Visible', { defaultValue: 'Visible' })
                            : t('Hidden', { defaultValue: 'Hidden' })}
                        </StatusBadge>
                      </TableCell>
                      <TableCell>
                        <StatusBadge value={item.status}>
                          {item.status_label ?? t(item.status, { defaultValue: item.status })}
                        </StatusBadge>
                      </TableCell>
                      <TableCell>{item.sort_order}</TableCell>
                      <TableCell>
                        <Dropdown>
                          <DropdownMenu>
                            <DropdownTrigger>...</DropdownTrigger>
                            <DropdownContent>
                              <Can permission={PERMISSIONS.COMPANY_CATALOG_UPDATE}>
                                <DropdownItem onClick={() => navigate(adminPath(`/company-catalog/${item.id}/edit`))}>
                                  {t('Edit', { defaultValue: 'Edit' })}
                                </DropdownItem>
                              </Can>
                              <Can permission={PERMISSIONS.COMPANY_CATALOG_DELETE}>
                                <DropdownItem
                                  destructive
                                  onClick={() => setPendingDelete({ id: item.id, name: item.name })}
                                >
                                  {t('Delete', { defaultValue: 'Delete' })}
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
          ) : (
            <EmptyState
              title={t('No company catalog items found', { defaultValue: 'No company catalog items found' })}
              description={t('No company catalog items matched the selected filters.', {
                defaultValue: 'No company catalog items matched the selected filters.',
              })}
            />
          )}
        </CardContent>
      </Card>

      <ConfirmActionModal
        open={Boolean(pendingDelete)}
        title={t('Delete company catalog item', { defaultValue: 'Delete company catalog item' })}
        description={t('Delete {{name}} from the company catalog?', {
          name: pendingDelete?.name ?? '',
          defaultValue: `Delete ${pendingDelete?.name ?? ''} from the company catalog?`,
        })}
        confirmLabel={t('Delete', { defaultValue: 'Delete' })}
        variant="danger"
        loading={deleteMutation.isPending}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => pendingDelete && deleteMutation.mutate(pendingDelete.id)}
      />
    </section>
  )
}

export function CompanyCatalogListPage() {
  return <CompanyCatalogPanel />
}
