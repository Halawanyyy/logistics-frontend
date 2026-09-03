export type StatAccent =
  | 'orders'
  | 'shipments'
  | 'success'
  | 'warning'
  | 'danger'
  | 'inventory'
  | 'finance'
  | 'drivers'

const accentKeywords: Array<[StatAccent, RegExp]> = [
  ['danger', /return|overdue|reject|damage|dispose|difference|discrep|failed|cancel|مرتجع|متأخر|مرفوض|تالف|فرق|ملغي/i],
  ['warning', /pending|expense|await|warning|معلق|مصروف|انتظار|تحذير/i],
  ['inventory', /inventory|stock|warehouse product|location|bin|مخزون|منتج مستودع|موقع/i],
  ['drivers', /driver|manifest|courier|سائق|مندوب|مانيفست/i],
  ['success', /revenue|profit|shipping fee|paid|completed|approved|delivered|credit|إيراد|ربح|رسوم شحن|مدفوع|مكتمل|معتمد|تم التسليم/i],
  ['finance', /cod|wallet|treasury|payable|payout|balance|cash|charge|invoice|money|محفظة|خزينة|مستحق|دفعة|رصيد|نقد|رسوم|فاتورة/i],
  ['shipments', /shipment|delivery|pick|pack|fulfillment|شحنة|شحن|تسليم|التقاط|تعبئة/i],
  ['orders', /order|inbound|request|طلب|وارد/i],
]

export function inferStatAccent(label: string, fallback: StatAccent = 'finance'): StatAccent {
  return accentKeywords.find(([, pattern]) => pattern.test(label))?.[0] ?? fallback
}
