import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card'
import { EmptyState } from '../states/EmptyState'
import { Table, TableCell, TableContainer, TableHead } from '../ui/Table'
import { StatusBadge } from '../ui/StatusBadge'
import { formatDate } from '../../utils/formatters'
import { useTranslation } from 'react-i18next'

export type TimelineItem = {
  id: string | number
  title: string
  subtitle?: string | null
  description?: string | null
  timestamp?: string | null
  meta?: string | null
}

type TimelineProps = {
  items: TimelineItem[]
  title?: string
  emptyTitle?: string
  emptyDescription?: string
}

export function Timeline({
  items,
  title = 'Timeline',
  emptyTitle = 'No timeline entries',
  emptyDescription = 'Activity timeline data will appear here when available.',
}: TimelineProps) {
  const { t } = useTranslation()

  const sortedItems = [...items].sort((a, b) => {
    if (!a.timestamp) return 1
    if (!b.timestamp) return -1
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  })

  return (
    <Card className="table-card">
      <CardHeader className="section-title-row">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{emptyDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        {!items.length ? (
          <EmptyState
            title={emptyTitle}
            description={emptyDescription}
          />
        ) : (
          <TableContainer>
            <Table variant="compact">
              <thead>
                <tr>
                  <TableHead>{t('Action')}</TableHead>
                  <TableHead>{t('Changed By', { defaultValue: 'Changed By' })}</TableHead>
                  <TableHead>{t('Changed At', { defaultValue: 'Changed At' })}</TableHead>
                </tr>
              </thead>
              <tbody>
                {sortedItems.map((item) => (
                  <tr key={item.id}>
                    <TableCell><StatusBadge value={item.title} /></TableCell>
                    <TableCell>{item.subtitle ?? '-'}</TableCell>
                    <TableCell>{item.timestamp ? formatDate(item.timestamp) : '-'}</TableCell>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  )
}
