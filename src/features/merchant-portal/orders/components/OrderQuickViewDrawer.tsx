import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Eye, Package, User, MapPin } from 'lucide-react'
import { Drawer } from '../../../../shared/components/ui/Drawer'
import { Button } from '../../../../shared/components/ui/Button'
import { MerchantOrderStatusBadge } from './MerchantOrderStatusBadge'
import { MoneyDisplay } from '../../../../shared/components/display/MoneyDisplay'
import { formatDate } from '../../../../shared/utils/formatters'
import { merchantPath } from '../../../../shared/routing/paths'
import { getMerchantPortalOrder } from '../api/merchantPortalOrders.api'

type OrderQuickViewDrawerProps = {
  orderId: number | null
  open: boolean
  onClose: () => void
}

export function OrderQuickViewDrawer({ orderId, open, onClose }: OrderQuickViewDrawerProps) {
  const { t } = useTranslation()

  const { data, isLoading } = useQuery({
    queryKey: ['merchant-portal', 'order-details', orderId],
    queryFn: () => getMerchantPortalOrder(orderId!),
    enabled: !!orderId && open,
  })

  const order = data?.data

  return (
    <Drawer
      isOpen={open}
      onClose={onClose}
      title={order ? `${t('Order')} #${order.order_number}` : t('Order Preview')}
    >
      {isLoading ? (
        <div className="p-6 text-sm text-slate-400">{t('Loading order details...')}</div>
      ) : !order ? (
        <div className="p-6 text-sm text-slate-400">{t('Order not found.')}</div>
      ) : (
        <div className="space-y-6">
          {/* Header Status & Total */}
          <div className="flex items-center justify-between bg-slate-800/80 p-4 rounded-xl border border-slate-700/60">
            <div>
              <span className="text-xs font-semibold text-slate-400 block">{t('Status')}</span>
              <div className="mt-1">
                <MerchantOrderStatusBadge value={order.status} />
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold text-slate-400 block">{t('Total Amount')}</span>
              <div className="mt-1 text-lg font-bold text-slate-100">
                <MoneyDisplay value={order.total_amount || 0} />
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/40 space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <User className="h-4 w-4 text-violet-400" />
              {t('Customer Details')}
            </h4>
            <div className="text-sm font-semibold text-slate-200">{order.customer_name}</div>
            <div className="text-xs text-slate-400 font-mono">{order.customer_phone}</div>
          </div>

          {/* Delivery Address */}
          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/40 space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-blue-400" />
              {t('Delivery Destination')}
            </h4>
            <div className="text-sm text-slate-300">
              {order.delivery_address || '-'}
            </div>
            <div className="text-xs text-slate-400">
              {order.delivery_governorate_name || ''} {order.delivery_area_name ? `- ${order.delivery_area_name}` : ''}
            </div>
          </div>

          {/* Items Summary */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Package className="h-4 w-4 text-emerald-400" />
              {t('Order Items')} ({order.items?.length || 0})
            </h4>
            <div className="divide-y divide-slate-700/50 border border-slate-700/50 rounded-xl overflow-hidden">
              {order.items?.map((item) => (
                <div key={item.id} className="p-3 bg-slate-800/30 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-slate-200">{item.product_name}</div>
                    <div className="text-slate-400 font-mono">SKU: {item.sku || '-'}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-200">x{item.quantity}</div>
                    <div className="text-slate-400">
                      <MoneyDisplay value={item.unit_price} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Meta Dates */}
          <div className="text-xs text-slate-500 pt-2 border-t border-slate-800">
            {t('Created')}: {formatDate(order.created_at)}
          </div>

          {/* Action Links */}
          <div className="pt-2">
            <Link to={merchantPath(`/orders/${order.id}`)} onClick={onClose} className="w-full block">
              <Button variant="primary" className="w-full flex items-center justify-center gap-2">
                <Eye className="h-4 w-4" />
                {t('View Full Order Details')}
              </Button>
            </Link>
          </div>
        </div>
      )}
    </Drawer>
  )
}
