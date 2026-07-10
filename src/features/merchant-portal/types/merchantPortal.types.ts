export type MerchantPortalMeResponse = {
  user: { 
    id: number 
    name: string 
    email: string 
  }
  merchant: {
    id: number
    name: string
    company_name: string
    phone?: string
    email?: string
    address?: string
    status?: string
  }
  portal_role: string
  portal_status: string
  capabilities: string[]
}

export type MerchantPortalDashboardSummaryResponse = {
  orders?: {
    total_orders: number
    today_orders: number
    pending_orders: number
    confirmed_orders: number
    delivered_orders: number
    returned_orders: number
    cancelled_orders: number
  }
  shipments?: {
    total_shipments: number
    pending_pickup_shipments: number
    in_transit_shipments: number
    out_for_delivery_shipments: number
    delivered_shipments: number
    failed_shipments: number
    returned_shipments: number
  }
  warehouse?: {
    warehouse_products_count: number
    low_stock_count: number
    total_available_quantity: number
    total_reserved_quantity: number
    inbound_requests_pending_count: number
  } | null
  finance?: {
    available_balance: string | number
    pending_balance: string | number
    total_cod_collected: string | number
    total_shipping_fees: string | number
    total_warehouse_charges: string | number
    total_payouts_pending: string | number
    total_payouts_completed: string | number
    total_invoices: number
    unpaid_invoices_count: number
    pending_payouts_count: number
  } | null
}

export type MerchantPortalProfileResponse = {
  id: number
  name: string
  company_name: string
  phone?: string | null
  email?: string | null
  address?: string | null
  status?: string
  created_at?: string
}

export type UpdateMerchantPortalProfilePayload = {
  name?: string
  company_name?: string
  phone?: string | null
  email?: string | null
  address?: string | null
}

export type MerchantPortalSettingsResponse = {
  default_fulfillment_type?: string | null
  default_payment_type?: string | null
  default_pickup_address?: string | null
  default_label_format?: string | null
  notification_preferences: {
    email_enabled?: boolean
    sms_enabled?: boolean
    whatsapp_enabled?: boolean
    order_status_changed?: boolean
    shipment_status_changed?: boolean
    low_stock?: boolean
    inbound_request_status_changed?: boolean
    invoice_issued?: boolean
    payout_status_changed?: boolean
  }
  integration_preferences: Record<string, any>
  created_at?: string
  updated_at?: string
}

export type UpdateMerchantPortalSettingsPayload = {
  default_fulfillment_type?: string | null
  default_payment_type?: string | null
  default_pickup_address?: string | null
  default_label_format?: string | null
  notification_preferences?: {
    email_enabled?: boolean
    sms_enabled?: boolean
    whatsapp_enabled?: boolean
    order_status_changed?: boolean
    shipment_status_changed?: boolean
    low_stock?: boolean
    inbound_request_status_changed?: boolean
    invoice_issued?: boolean
    payout_status_changed?: boolean
  }
  integration_preferences?: Record<string, any>
}
