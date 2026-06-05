import { Badge } from './Badge'

type StatusBadgeVariant =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral'
  | 'accent'
  | 'slate'
  | 'teal'
  | 'cyan'
  | 'violet'
  | 'orange'

type StatusBadgeProps = {
  value: boolean | null | string | undefined
  children?: string
}

const EXACT_VARIANT_MAP = new Map<string, StatusBadgeVariant>([
  ['active', 'success'],
  ['inactive', 'slate'],
  ['disabled', 'slate'],
  ['pending', 'warning'],
  ['pending_review', 'warning'],
  ['pending_approval', 'warning'],
  ['draft', 'slate'],
  ['confirmed', 'info'],
  ['processing', 'info'],
  ['shipment_created', 'accent'],
  ['issued', 'accent'],
  ['driver_assigned', 'accent'],
  ['picked_up', 'info'],
  ['arrived_at_hub', 'info'],
  ['sorting', 'info'],
  ['in_transit', 'cyan'],
  ['picking', 'cyan'],
  ['out_for_delivery', 'violet'],
  ['packed', 'violet'],
  ['ready_for_dispatch', 'accent'],
  ['partially_delivered', 'teal'],
  ['partially_received', 'teal'],
  ['received', 'teal'],
  ['reserved', 'teal'],
  ['restocked', 'success'],
  ['fulfilled', 'success'],
  ['delivered', 'success'],
  ['completed', 'success'],
  ['approved', 'success'],
  ['paid', 'success'],
  ['unpaid', 'warning'],
  ['packing', 'orange'],
  ['damaged', 'orange'],
  ['delivery_attempted', 'orange'],
  ['rejected', 'danger'],
  ['failed', 'danger'],
  ['cancelled', 'danger'],
  ['canceled', 'danger'],
  ['returned', 'danger'],
  ['returned_to_hub', 'danger'],
  ['returned_to_warehouse', 'danger'],
  ['released', 'slate'],
  ['closed', 'slate'],
  ['open', 'info'],
  ['credit', 'success'],
  ['debit', 'warning'],
])

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, '_')
}

function getVariant(value: string): StatusBadgeVariant {
  const normalized = normalize(value)
  const exactVariant = EXACT_VARIANT_MAP.get(normalized)

  if (exactVariant) {
    return exactVariant
  }

  if (normalized === 'yes' || normalized.startsWith('is_')) {
    return 'success'
  }

  if (
    normalized.includes('inactive')
    || normalized.includes('disabled')
    || normalized.includes('draft')
    || normalized.includes('closed')
  ) {
    return 'slate'
  }

  if (
    normalized.includes('pending')
    || normalized.includes('review')
    || normalized.includes('approval')
    || normalized.includes('unpaid')
  ) {
    return 'warning'
  }

  if (
    normalized.includes('partially')
    || normalized.includes('received')
    || normalized.includes('reserved')
    || normalized.includes('release')
  ) {
    return 'teal'
  }

  if (normalized.includes('transit') || normalized.includes('picking')) {
    return 'cyan'
  }

  if (normalized.includes('delivery')) {
    return 'violet'
  }

  if (normalized.includes('pack') || normalized.includes('attempt') || normalized.includes('damage')) {
    return 'orange'
  }

  if (
    normalized.includes('active')
    || normalized.includes('deliver')
    || normalized.includes('complete')
    || normalized.includes('approve')
    || normalized.includes('paid')
    || normalized.includes('fulfill')
    || normalized.includes('restock')
  ) {
    return 'success'
  }

  if (
    normalized.includes('confirm')
    || normalized.includes('process')
    || normalized.includes('sort')
    || normalized.includes('hub')
    || normalized.includes('open')
  ) {
    return 'info'
  }

  if (
    normalized.includes('create')
    || normalized.includes('assign')
    || normalized.includes('dispatch')
    || normalized.includes('issue')
  ) {
    return 'accent'
  }

  if (
    normalized.includes('reject')
    || normalized.includes('fail')
    || normalized.includes('cancel')
    || normalized.includes('return')
  ) {
    return 'danger'
  }

  return 'neutral'
}

export function StatusBadge({ value, children }: StatusBadgeProps) {
  const text =
    children
    ?? (typeof value === 'boolean' ? (value ? 'Active' : 'Inactive') : value ?? 'Unknown')

  return <Badge variant={getVariant(String(text))}>{text}</Badge>
}
