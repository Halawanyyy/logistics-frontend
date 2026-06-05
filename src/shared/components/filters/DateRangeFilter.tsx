import { useTranslation } from 'react-i18next'
import { Input } from '../ui/Input'

type DateRangeFilterProps = {
  dateFrom?: string
  dateTo?: string
  onChange: (value: { date_from: string; date_to: string }) => void
  labels?: {
    from?: string
    to?: string
  }
}

export function DateRangeFilter({
  dateFrom = '',
  dateTo = '',
  onChange,
  labels,
}: DateRangeFilterProps) {
  const { t } = useTranslation()

  return (
    <>
      <label className="field">
        <span>{t(labels?.from ?? 'Date From', { defaultValue: labels?.from ?? 'Date From' })}</span>
        <Input
          type="date"
          value={dateFrom}
          onChange={(event) => onChange({ date_from: event.target.value, date_to: dateTo })}
        />
      </label>
      <label className="field">
        <span>{t(labels?.to ?? 'Date To', { defaultValue: labels?.to ?? 'Date To' })}</span>
        <Input
          type="date"
          value={dateTo}
          onChange={(event) => onChange({ date_from: dateFrom, date_to: event.target.value })}
        />
      </label>
    </>
  )
}
