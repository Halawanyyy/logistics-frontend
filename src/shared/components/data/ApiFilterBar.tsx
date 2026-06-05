import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { SearchableSelect } from '../ui/SearchableSelect'

export type FilterField = {
  label: string
  name: string
  options?: { label: string; value: string }[]
  type?: 'date' | 'number' | 'select' | 'text'
}

type ApiFilterBarProps<T extends Record<string, string>> = {
  fields: FilterField[]
  filters: T
  extra?: ReactNode
  onChange: (name: keyof T, value: string) => void
  onReset: () => void
}

export function ApiFilterBar<T extends Record<string, string>>({
  extra,
  fields,
  filters,
  onChange,
  onReset,
}: ApiFilterBarProps<T>) {
  const { t } = useTranslation()

  return (
    <div className="api-filter-bar">
      {fields.map((field) => (
        <label className="field" key={field.name}>
          <span>{t(field.label, { defaultValue: field.label })}</span>
          {field.type === 'select' ? (
            <SearchableSelect
              value={filters[field.name as keyof T] ?? ''}
              placeholder={t('All')}
              searchPlaceholder={t('Search {{label}}...', {
                defaultValue: 'Search {{label}}...',
                label: t(field.label, { defaultValue: field.label }).toLowerCase(),
              })}
              onChange={(value) => onChange(field.name as keyof T, value)}
              options={[
                { label: t('All'), value: '' },
                ...(field.options?.map((option) => ({
                  label: t(option.label, { defaultValue: option.label }),
                  value: option.value,
                })) ?? []),
              ]}
            />
          ) : (
            <Input
              type={field.type ?? 'text'}
              value={filters[field.name as keyof T] ?? ''}
              onChange={(event) => onChange(field.name as keyof T, event.target.value)}
            />
          )}
        </label>
      ))}
      <div className="api-filter-bar__actions">
        {extra}
        <Button type="button" variant="secondary" onClick={onReset}>
          {t('Reset')}
        </Button>
      </div>
    </div>
  )
}

export function compactFilters<T extends Record<string, string>>(filters: T) {
  return Object.fromEntries(Object.entries(filters).filter(([, value]) => value)) as Partial<T>
}
