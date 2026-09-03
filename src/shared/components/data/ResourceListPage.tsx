import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { getApiErrorMessage } from '../../api/api-error'
import { EmptyState } from '../feedback/EmptyState'
import { ErrorState } from '../feedback/ErrorState'
import { LoadingState } from '../feedback/LoadingState'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/Card'
import { Input } from '../ui/Input'
import { PageHeader } from '../ui/PageHeader'
import { Table, TableCell, TableContainer, TableHead } from '../ui/Table'

type ResourceListPageProps<T extends { id?: number | string }> = {
  title: string
  description: string
  actions?: ReactNode
  filters?: ReactNode
  queryKey: readonly unknown[]
  queryFn: () => Promise<{ data: T[] }>
  columns: {
    header: string
    render: (item: T) => ReactNode
  }[]
  getSearchText?: (item: T) => string
  emptyTitle?: string
  searchValue?: string
  hideHeader?: boolean
  onCountChange?: (count: number) => void
  renderSummary?: (rows: T[]) => ReactNode
}

export function ResourceListPage<T extends { id?: number | string }>({
  title,
  description,
  actions,
  filters,
  queryKey,
  queryFn,
  columns,
  getSearchText,
  emptyTitle,
  searchValue,
  hideHeader = false,
  onCountChange,
  renderSummary,
}: ResourceListPageProps<T>) {
  const { t } = useTranslation()
  const [search, setSearch] = useState(searchValue ?? '')
  const query = useQuery({ queryKey, queryFn })

  useEffect(() => {
    if (query.data) {
      onCountChange?.(query.data.data.length)
    }
  }, [onCountChange, query.data])

  useEffect(() => {
    if (searchValue !== undefined) {
      // This component supports an externally refreshed initial search value while keeping input edits local.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearch(searchValue)
    }
  }, [searchValue])

  if (query.isLoading) {
    return <LoadingState title={t('Loading {{title}}', { defaultValue: 'Loading {{title}}', title: title.toLowerCase() })} />
  }

  if (query.isError) {
    return <ErrorState message={getApiErrorMessage(query.error)} onRetry={() => void query.refetch()} />
  }

  const rows = query.data?.data ?? []
  const filteredRows = search
    ? rows.filter((item) => (getSearchText?.(item) ?? '').toLowerCase().includes(search.toLowerCase()))
    : rows

  return (
    <section className="page-section">
      {!hideHeader ? <PageHeader title={title} description={description} actions={actions} /> : null}
      {hideHeader && actions ? <div className="page-header__button-row">{actions}</div> : null}
      {renderSummary?.(rows)}
      <Card className="table-card">
        <CardHeader className="table-card__header">
          <CardTitle>{t(title, { defaultValue: title })}</CardTitle>
          <CardDescription>{t(description, { defaultValue: description })}</CardDescription>
        </CardHeader>
        <CardContent>
          {filters}
          {getSearchText ? (
            <div className="filters-bar filters-bar--single">
              <Input
                placeholder={t('Search {{title}}', { defaultValue: 'Search {{title}}', title: title.toLowerCase() })}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          ) : null}
          {!rows.length ? (
            <EmptyState
              title={emptyTitle ?? t('No {{title}} found', { defaultValue: 'No {{title}} found', title: title.toLowerCase() })}
              description={t('The API returned an empty list.', { defaultValue: 'The API returned an empty list.' })}
            />
          ) : null}
          {rows.length && !filteredRows.length ? (
            <EmptyState
              title={t('No matching results', { defaultValue: 'No matching results' })}
              description={t('No records match the current search.', { defaultValue: 'No records match the current search.' })}
            />
          ) : null}
          {filteredRows.length ? (
            <TableContainer>
              <Table variant="striped">
                <thead>
                  <tr>
                    {columns.map((column) => (
                      <TableHead key={column.header}>{t(column.header, { defaultValue: column.header })}</TableHead>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((item, index) => (
                    <tr key={item.id ?? index}>
                      {columns.map((column) => (
                        <TableCell key={column.header}>{column.render(item)}</TableCell>
                      ))}
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
