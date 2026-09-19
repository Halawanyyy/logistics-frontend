import { useTranslation } from 'react-i18next'
import { Input } from '../ui/Input'
import { cn } from '../../utils/cn'

function toDateInputValue(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export type DatePreset = 'all' | 'today' | '7days' | '30days' | 'custom'

export function calculatePresetDateRange(preset: DatePreset): { date_from: string; date_to: string } {
  const today = new Date()

  if (preset === 'today') {
    const str = toDateInputValue(today)
    return { date_from: str, date_to: str }
  }

  if (preset === '7days') {
    const past = new Date()
    past.setDate(past.getDate() - 6)
    return { date_from: toDateInputValue(past), date_to: toDateInputValue(today) }
  }

  if (preset === '30days') {
    const past = new Date()
    past.setDate(past.getDate() - 29)
    return { date_from: toDateInputValue(past), date_to: toDateInputValue(today) }
  }

  return { date_from: '', date_to: '' }
}

export type DateRangeFilterProps = {
  dateFrom?: string
  dateTo?: string
  onChange: (value: { date_from: string; date_to: string }) => void
  labels?: {
    from?: string
    to?: string
  }
  showPresets?: boolean
  preset?: DatePreset
  onPresetChange?: (preset: DatePreset) => void
  error?: string
  className?: string
}

export function DateRangeFilter({
  dateFrom = '',
  dateTo = '',
  onChange,
  labels,
  showPresets = true,
  preset,
  onPresetChange,
  error,
  className,
}: DateRangeFilterProps) {
  const { t } = useTranslation()

  const presets: Array<{ id: DatePreset; label: string }> = [
    { id: 'all', label: t('All dates', { defaultValue: 'All dates' }) },
    { id: 'today', label: t('Today', { defaultValue: 'Today' }) },
    { id: '7days', label: t('Last 7 days', { defaultValue: 'Last 7 days' }) },
    { id: '30days', label: t('Last 30 days', { defaultValue: 'Last 30 days' }) },
    { id: 'custom', label: t('Custom', { defaultValue: 'Custom' }) },
  ]

  function handleSelectPreset(p: DatePreset) {
    onPresetChange?.(p)
    if (p === 'custom') {
      return
    }
    const range = calculatePresetDateRange(p)
    onChange(range)
  }

  function handleFromChange(val: string) {
    onPresetChange?.('custom')
    onChange({ date_from: val, date_to: dateTo })
  }

  function handleToChange(val: string) {
    onPresetChange?.('custom')
    onChange({ date_from: dateFrom, date_to: val })
  }

  return (
    <div className={cn('date-range-filter', className)}>
      {showPresets && (
        <div
          className="date-range-filter__presets"
          role="group"
          aria-label={t('Date presets', { defaultValue: 'Date presets' })}
        >
          {presets.map((p) => (
            <button
              key={p.id}
              type="button"
              className={cn(
                'date-range-filter__preset-btn',
                preset === p.id && 'date-range-filter__preset-btn--active',
              )}
              onClick={() => handleSelectPreset(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      <div className="date-range-filter__fields">
        <label className="field date-range-filter__field">
          <span>{t(labels?.from ?? 'From', { defaultValue: labels?.from ?? 'From' })}</span>
          <Input
            type="date"
            value={dateFrom}
            onChange={(event) => handleFromChange(event.target.value)}
          />
        </label>
        <label className="field date-range-filter__field">
          <span>{t(labels?.to ?? 'To', { defaultValue: labels?.to ?? 'To' })}</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(event) => handleToChange(event.target.value)}
          />
        </label>
      </div>

      {error ? (
        <p className="date-range-filter__error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
