import type { TFunction } from 'i18next'
import type { AuditLogItem } from '../types/audit.types'

export function formatAuditLogDetails(item: AuditLogItem, t: TFunction): string {
  if (item.notes) return item.notes

  const changes: string[] = []
  
  if (item.old_values && item.new_values) {
    for (const key of Object.keys(item.new_values)) {
      const oldVal = item.old_values[key]
      const newVal = item.new_values[key]
      
      if (String(oldVal) !== String(newVal)) {
        const readableKey = key.replace(/_/g, ' ')
        // capitalize first letter
        const capitalizedKey = readableKey.charAt(0).toUpperCase() + readableKey.slice(1)
        
        changes.push(t('{{key}} updated from {{oldVal}} to {{newVal}}', {
          key: capitalizedKey,
          oldVal: oldVal === null || oldVal === undefined || oldVal === '' ? 'empty' : String(oldVal),
          newVal: newVal === null || newVal === undefined || newVal === '' ? 'empty' : String(newVal),
          defaultValue: `${capitalizedKey} updated from ${oldVal === null || oldVal === undefined || oldVal === '' ? 'empty' : String(oldVal)} to ${newVal === null || newVal === undefined || newVal === '' ? 'empty' : String(newVal)}`,
        }))
      }
    }
  } else if (item.new_values && !item.old_values && item.action === 'created') {
    changes.push(t('Record created', { defaultValue: 'Record created' }))
  }

  if (changes.length > 0) {
    return changes.join(' | ')
  }

  return t('No details recorded.', { defaultValue: 'No details recorded.' })
}
