import { useState, useRef, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Input } from '../ui/Input'
import { SearchableSelect } from '../ui/SearchableSelect'
import { MerchantSelector } from '../selectors/MerchantSelector'
import { WarehouseSelector } from '../selectors/WarehouseSelector'
import { DriverSelector } from '../selectors/DriverSelector'
import { FilterButton } from '../filters/FilterButton'
import { FilterPopover } from '../filters/FilterPopover'
import { FilterField as FilterFieldWrapper } from '../filters/FilterField'
import { AppliedFilterChips, type AppliedFilterChip } from '../filters/AppliedFilterChips'

export type FilterField = {
  label: string
  name: string
  options?: { label: string; value: string }[]
  type?: 'date' | 'driver' | 'merchant' | 'number' | 'select' | 'text' | 'warehouse'
}

type ApiFilterBarProps<T extends Record<string, string>> = {
  fields: FilterField[]
  filters: T
  extra?: ReactNode
  onChange: (name: keyof T, value: string) => void
  onReset: () => void
  title?: string
}

export function ApiFilterBar<T extends Record<string, string>>({
  extra,
  fields,
  filters,
  onChange,
  onReset,
  title,
}: ApiFilterBarProps<T>) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [draftFilters, setDraftFilters] = useState<T>({ ...filters })
  const triggerRef = useRef<HTMLButtonElement>(null)

  // Separate main search field from advanced filters
  const searchField = fields.find((f) => f.name === 'search')
  const advancedFields = fields.filter((f) => f.name !== 'search')

  // Calculate active filters (excluding search)
  const activeFilters = advancedFields.filter((f) => Boolean(filters[f.name as keyof T]))
  const activeCount = activeFilters.length

  function handleOpenChange(open: boolean) {
    if (open) {
      setDraftFilters({ ...filters })
    }
    setIsOpen(open)
  }

  function handleDraftChange(name: keyof T, value: string) {
    setDraftFilters((prev) => ({ ...prev, [name]: value }))
  }

  function handleApply() {
    // Commit all changed draft filters to applied
    for (const field of advancedFields) {
      const fieldName = field.name as keyof T
      if (draftFilters[fieldName] !== filters[fieldName]) {
        onChange(fieldName, draftFilters[fieldName] ?? '')
      }
    }
    setIsOpen(false)
    triggerRef.current?.focus()
  }

  function handleReset() {
    onReset()
    setDraftFilters({ ...filters, ...Object.fromEntries(advancedFields.map((f) => [f.name, ''])) } as T)
    setIsOpen(false)
    triggerRef.current?.focus()
  }

  // Generate chips for applied filters
  const chips: AppliedFilterChip[] = activeFilters.map((field) => {
    const val = filters[field.name as keyof T] ?? ''
    let displayVal: string = String(val ?? '')

    if (field.type === 'select' && field.options) {
      const matched = field.options.find((opt) => opt.value === val)
      if (matched) {
        displayVal = t(matched.label, { defaultValue: matched.label })
      }
    }

    return {
      key: field.name,
      label: `${t(field.label, { defaultValue: field.label })}: ${displayVal}`,
    }
  })

  return (
    <div className="api-filter-bar-wrapper">
      <div className="page-toolbar">
        {/* Search input stays visible outside */}
        {searchField ? (
          <div className="page-toolbar__search">
            <Input
              type="text"
              placeholder={t('Search...', { defaultValue: 'Search...' })}
              value={filters[searchField.name as keyof T] ?? ''}
              onChange={(e) => onChange(searchField.name as keyof T, e.target.value)}
            />
          </div>
        ) : <div />}

        <div className="page-toolbar__actions">
          {advancedFields.length > 0 && (
            <>
              <FilterButton
                ref={triggerRef}
                activeCount={activeCount}
                open={isOpen}
                onClick={() => handleOpenChange(!isOpen)}
              />
              <FilterPopover
                open={isOpen}
                onOpenChange={handleOpenChange}
                triggerRef={triggerRef}
                title={title ?? t('Filters', { defaultValue: 'Filters' })}
                onApply={handleApply}
                onReset={handleReset}
              >
                {advancedFields.map((field) => (
                  <FilterFieldWrapper
                    key={field.name}
                    label={t(field.label, { defaultValue: field.label })}
                  >
                    {field.type === 'driver' ? (
                      <DriverSelector
                        includeAllOption
                        value={draftFilters[field.name as keyof T] ?? ''}
                        onChange={(value) => handleDraftChange(field.name as keyof T, value)}
                      />
                    ) : field.type === 'merchant' ? (
                      <MerchantSelector
                        includeAllOption
                        value={draftFilters[field.name as keyof T] ?? ''}
                        onChange={(value) => handleDraftChange(field.name as keyof T, value)}
                      />
                    ) : field.type === 'warehouse' ? (
                      <WarehouseSelector
                        includeAllOption
                        value={draftFilters[field.name as keyof T] ?? ''}
                        onChange={(value) => handleDraftChange(field.name as keyof T, value)}
                      />
                    ) : field.type === 'select' ? (
                      <SearchableSelect
                        value={draftFilters[field.name as keyof T] ?? ''}
                        placeholder={t('All', { defaultValue: 'All' })}
                        searchPlaceholder={t('Search {{label}}...', {
                          defaultValue: 'Search {{label}}...',
                          label: t(field.label, { defaultValue: field.label }).toLowerCase(),
                        })}
                        onChange={(value) => handleDraftChange(field.name as keyof T, value)}
                        options={[
                          { label: t('All', { defaultValue: 'All' }), value: '' },
                          ...(field.options?.map((option) => ({
                            label: t(option.label, { defaultValue: option.label }),
                            value: option.value,
                          })) ?? []),
                        ]}
                      />
                    ) : (
                      <Input
                        type={field.type ?? 'text'}
                        value={draftFilters[field.name as keyof T] ?? ''}
                        onChange={(event) => handleDraftChange(field.name as keyof T, event.target.value)}
                      />
                    )}
                  </FilterFieldWrapper>
                ))}
              </FilterPopover>
            </>
          )}

          {extra}
        </div>
      </div>

      {/* Removable chips for applied filters */}
      <AppliedFilterChips
        chips={chips}
        onRemove={(key) => onChange(key as keyof T, '')}
        onClearAll={onReset}
      />
    </div>
  )
}

export function compactFilters<T extends Record<string, string>>(filters: T) {
  return Object.fromEntries(Object.entries(filters).filter(([, value]) => value)) as Partial<T>
}
