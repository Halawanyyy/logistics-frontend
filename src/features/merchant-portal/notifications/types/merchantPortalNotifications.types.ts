export type MerchantNotificationType =
  | 'order_status_changed'
  | 'shipment_status_changed'
  | 'low_stock'
  | 'inbound_request_status_changed'
  | 'invoice_issued'
  | 'payout_status_changed'
  | 'integration_token_created'
  | 'integration_token_revoked'
  | string

export type MerchantNotification = {
  id: string
  type: MerchantNotificationType
  notifiable_type: string
  notifiable_id: number
  data: Record<string, any>
  read_at: string | null
  created_at: string
}

export type MerchantNotificationFilters = {
  page?: number | string
  per_page?: number | string
  status?: 'unread' | 'read' | 'all'
}

export type MerchantNotificationsResponse = {
  data: MerchantNotification[]
  meta?: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export type MerchantNotificationUnreadCountResponse = {
  data: {
    count: number
  }
}
