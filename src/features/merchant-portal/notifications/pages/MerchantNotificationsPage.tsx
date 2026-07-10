import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  listMerchantPortalNotifications,
  markAllMerchantPortalNotificationsAsRead,
  markMerchantPortalNotificationAsRead,
} from '../api/merchantPortalNotifications.api'
import { PageHeader } from '../../../../shared/components/ui/PageHeader'
import { Card, CardContent } from '../../../../shared/components/ui/Card'
import { Button } from '../../../../shared/components/ui/Button'
import { LoadingState } from '../../../../shared/components/states/LoadingState'
import { ErrorState } from '../../../../shared/components/states/ErrorState'
import { EmptyState } from '../../../../shared/components/states/EmptyState'
import { getApiErrorMessage } from '../../../../shared/api/api-error'
import { formatDate } from '../../../../shared/utils/formatters'
import type { MerchantNotificationFilters } from '../types/merchantPortalNotifications.types'

export function MerchantNotificationsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [filters] = useState<MerchantNotificationFilters>({
    page: 1,
    per_page: 50,
  })

  const notificationsQuery = useQuery({
    queryKey: ['merchant-portal', 'notifications', filters],
    queryFn: () => listMerchantPortalNotifications(filters),
  })

  const markReadMutation = useMutation({
    mutationFn: (id: string) => markMerchantPortalNotificationAsRead(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['merchant-portal', 'notifications'] })
      await queryClient.invalidateQueries({ queryKey: ['merchant-portal', 'notifications', 'unread-count'] })
    },
  })

  const markAllReadMutation = useMutation({
    mutationFn: () => markAllMerchantPortalNotificationsAsRead(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['merchant-portal', 'notifications'] })
      await queryClient.invalidateQueries({ queryKey: ['merchant-portal', 'notifications', 'unread-count'] })
    },
  })

  const notifications = notificationsQuery.data?.data ?? []

  const handleMarkAllAsRead = () => {
    markAllReadMutation.mutate()
  }

  const renderNotificationMessage = (type: string, data: Record<string, any>) => {
    switch (type) {
      case 'order_status_changed':
        return t('Order #{{orderId}} status changed to {{status}}.', { orderId: data.order_id, status: data.status, defaultValue: `Order #${data.order_id || '?'} status changed to ${data.status || '?'}.` })
      case 'shipment_status_changed':
        return t('Shipment #{{shipmentId}} status changed to {{status}}.', { shipmentId: data.shipment_id, status: data.status, defaultValue: `Shipment #${data.shipment_id || '?'} status changed to ${data.status || '?'}.` })
      case 'low_stock':
        return t('Product {{productName}} is running low on stock.', { productName: data.product_name, defaultValue: `Product ${data.product_name || '?'} is running low on stock.` })
      case 'invoice_issued':
        return t('A new invoice #{{invoiceId}} has been issued.', { invoiceId: data.invoice_id, defaultValue: `A new invoice #${data.invoice_id || '?'} has been issued.` })
      default:
        return data.message || t('You have a new notification.', { defaultValue: 'You have a new notification.' })
    }
  }

  return (
    <div className="page-stack max-w-4xl mx-auto">
      <PageHeader
        title={t('Notifications', { defaultValue: 'Notifications' })}
        description={t('Stay updated with the latest events and alerts.', { defaultValue: 'Stay updated with the latest events and alerts.' })}
        actions={
          <Button
            variant="secondary"
            onClick={handleMarkAllAsRead}
            disabled={markAllReadMutation.isPending || notifications.length === 0}
          >
            {markAllReadMutation.isPending ? t('Marking...', { defaultValue: 'Marking...' }) : t('Mark All as Read', { defaultValue: 'Mark All as Read' })}
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          {notificationsQuery.isLoading ? (
            <div className="p-8">
              <LoadingState title={t('Loading notifications...', { defaultValue: 'Loading notifications...' })} />
            </div>
          ) : notificationsQuery.isError ? (
            <div className="p-8">
              <ErrorState
                title={t('Failed to load notifications.', { defaultValue: 'Failed to load notifications.' })}
                message={getApiErrorMessage(notificationsQuery.error)}
                onRetry={() => void notificationsQuery.refetch()}
              />
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title={t('No notifications found.', { defaultValue: 'No notifications found.' })}
                description={t("You're all caught up!", { defaultValue: "You're all caught up!" })}
              />
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => {
                const isUnread = !notification.read_at
                return (
                  <div
                    key={notification.id}
                    className={`p-4 flex gap-4 items-start ${isUnread ? 'bg-blue-50/30' : ''}`}
                  >
                    <div className="flex-1">
                      <p className={`text-sm ${isUnread ? 'font-semibold' : 'text-foreground'}`}>
                        {renderNotificationMessage(notification.type, notification.data)}
                      </p>
                      <p className="text-xs text-muted mt-1">{formatDate(notification.created_at)}</p>
                    </div>
                    {isUnread && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => markReadMutation.mutate(notification.id)}
                        disabled={markReadMutation.isPending}
                      >
                        {t('Mark Read', { defaultValue: 'Mark Read' })}
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
