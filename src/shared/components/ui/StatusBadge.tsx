import type { ReactNode } from 'react'
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
  | 'rose'

type StatusBadgeProps = {
  className?: string
  label?: string | null
  value: boolean | null | string | undefined
  children?: ReactNode
}

const EXACT_VARIANT_MAP = new Map<string, StatusBadgeVariant>([
  ['active', 'success'],
  ['approved', 'success'],
  ['available', 'success'],
  ['closed', 'success'],
  ['completed', 'success'],
  ['confirmed', 'success'],
  ['delivered', 'success'],
  ['fulfilled', 'success'],
  ['inspected', 'info'],
  ['paid', 'success'],
  ['received', 'success'],
  ['restocked', 'success'],
  ['inactive', 'danger'],
  ['disabled', 'slate'],
  ['not_required', 'slate'],
  ['archived', 'slate'],
  ['unknown', 'slate'],
  ['unassigned', 'slate'],
  ['pending', 'warning'],
  ['waiting', 'warning'],
  ['requested', 'warning'],
  ['under_review', 'warning'],
  ['pending_review', 'warning'],
  ['pending_approval', 'warning'],
  ['pending_reservation', 'warning'],
  ['pending_pickup', 'orange'],
  ['pending_return', 'orange'],
  ['low_stock', 'warning'],
  ['draft', 'slate'],
  ['processing', 'info'],
  ['assigned', 'info'],
  ['picked', 'cyan'],
  ['review_required', 'rose'],
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
  ['transferred', 'violet'],
  ['dispatch', 'accent'],
  ['dispatched', 'accent'],
  ['ready_for_dispatch', 'accent'],
  ['partially_delivered', 'teal'],
  ['partially_fulfilled', 'warning'],
  ['partially_paid', 'violet'],
  ['partially_received', 'teal'],
  ['reserved', 'teal'],
  ['unpaid', 'orange'],
  ['packing', 'orange'],
  ['damaged', 'danger'],
  ['delivery_attempted', 'orange'],
  ['overdue', 'danger'],
  ['lost', 'danger'],
  ['out_of_stock', 'danger'],
  ['failed_delivery', 'danger'],
  ['rejected', 'danger'],
  ['failed', 'danger'],
  ['cancelled', 'danger'],
  ['canceled', 'danger'],
  ['suspended', 'danger'],
  ['returned', 'orange'],
  ['returned_to_hub', 'orange'],
  ['returned_to_warehouse', 'orange'],
  ['released', 'slate'],
  ['open', 'info'],
  ['credit', 'success'],
  ['debit', 'warning'],
])

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, '_')
}

function humanizeValue(value: string) {
  return value
    .replaceAll(/[_-]+/g, ' ')
    .replaceAll(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

function normalizeValue(value: boolean | null | string | undefined) {
  if (typeof value === 'boolean') {
    return value ? 'active' : 'inactive'
  }

  if (typeof value !== 'string') {
    return 'unknown'
  }

  return value
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
    || normalized.includes('archiv')
    || normalized.includes('unknown')
    || normalized.includes('not_required')
    || normalized.includes('draft')
    || normalized.includes('closed')
  ) {
    return 'slate'
  }

  if (
    normalized.includes('pending')
    || normalized.includes('approval')
    || normalized.includes('wait')
    || normalized.includes('request')
    || normalized.includes('low_stock')
    || normalized.includes('review')
    || normalized.includes('unpaid')
  ) {
    return 'warning'
  }

  if (normalized.includes('partially')) {
    return 'teal'
  }

  if (normalized.includes('reserved') || normalized.includes('receive')) {
    return 'teal'
  }

  if (normalized.includes('review_required')) {
    return 'rose'
  }

  if (normalized.includes('transit') || normalized.includes('picking')) {
    return 'cyan'
  }

  if (normalized.includes('picked')) {
    return 'cyan'
  }

  if (normalized.includes('delivery')) {
    return 'violet'
  }

  if (normalized.includes('pack') || normalized.includes('attempt')) {
    return 'orange'
  }

  if (
    normalized.includes('active')
    || normalized.includes('deliver')
    || normalized.includes('complete')
    || normalized.includes('approve')
    || normalized.includes('paid')
    || normalized.includes('fulfill')
    || normalized.includes('avail')
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
    || normalized.includes('dispatch')
    || normalized.includes('issue')
    || normalized.includes('transfer')
  ) {
    return 'accent'
  }

  if (normalized.includes('assign')) {
    return 'info'
  }

  if (
    normalized.includes('damage')
    || normalized.includes('suspend')
    || normalized.includes('lost')
    || normalized.includes('overdue')
    || normalized.includes('out_of_stock')
    || normalized.includes('reject')
    || normalized.includes('fail')
    || normalized.includes('cancel')
  ) {
    return 'danger'
  }

  if (normalized.includes('return')) {
    return 'orange'
  }

  return 'neutral'
}

export function StatusBadge({ className, label, value, children }: StatusBadgeProps) {
  const rawValue = normalizeValue(value)
  const displayText = children
    ?? label
    ?? humanizeValue(rawValue)

  return (
    <Badge className={className} variant={getVariant(rawValue)}>
      {displayText}
    </Badge>
  )
}
