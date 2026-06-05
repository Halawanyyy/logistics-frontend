import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { EmptyState } from '../states/EmptyState'
import { formatDate } from '../../utils/formatters'

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
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {!items.length ? (
          <EmptyState
            title={emptyTitle}
            description={emptyDescription}
          />
        ) : (
          <div className="detail-list">
            {items.map((item) => (
              <div key={item.id}>
                <dt>
                  {item.title}
                  {item.subtitle ? <p className="table-meta">{item.subtitle}</p> : null}
                </dt>
                <dd>
                  {item.description ?? '-'}
                  {item.meta ? <p className="table-meta">{item.meta}</p> : null}
                  {item.timestamp ? <p className="table-meta">{formatDate(item.timestamp)}</p> : null}
                </dd>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
