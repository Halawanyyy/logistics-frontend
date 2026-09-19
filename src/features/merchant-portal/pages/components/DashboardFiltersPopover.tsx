import { useEffect, useId, useRef, useState } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useLocale } from '../../../../shared/i18n/useLocale'
import type { MerchantPortalLocationOption } from '../../api/merchantPortal.api'
import type { DashboardDatePreset, DashboardFilters } from '../../types/merchantPortal.types'

function toDateInputValue(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function calculatePresetDates(preset: DashboardDatePreset): { date_from: string; date_to: string } {
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

type DashboardFiltersPopoverProps = {
  appliedFilters: DashboardFilters
  governorates: MerchantPortalLocationOption[]
  onApply: (filters: DashboardFilters) => void
  onReset: () => void
}

export function DashboardFiltersPopover({
  appliedFilters,
  governorates,
  onApply,
  onReset,
}: DashboardFiltersPopoverProps) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const [isOpen, setIsOpen] = useState(false)
  const [draftFilters, setDraftFilters] = useState<DashboardFilters>(appliedFilters)
  const [validationError, setValidationError] = useState('')

  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const dateFromId = useId()
  const dateToId = useId()
  const governorateId = useId()

  function handleToggleOpen() {
    if (!isOpen) {
      setDraftFilters(appliedFilters)
      setValidationError('')
      setIsOpen(true)
    } else {
      setIsOpen(false)
    }
  }

  useEffect(() => {
    if (!isOpen) {
      return
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        setIsOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        setIsOpen(false)
        triggerRef.current?.focus()
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  function handleSelectPreset(preset: DashboardDatePreset) {
    if (preset === 'custom') {
      setDraftFilters((prev) => ({ ...prev, preset: 'custom' }))
      return
    }

    const { date_from, date_to } = calculatePresetDates(preset)
    setDraftFilters((prev) => ({
      ...prev,
      preset,
      date_from,
      date_to,
    }))
    setValidationError('')
  }

  function handleDateFromChange(value: string) {
    setDraftFilters((prev) => ({
      ...prev,
      preset: 'custom',
      date_from: value,
    }))
    setValidationError('')
  }

  function handleDateToChange(value: string) {
    setDraftFilters((prev) => ({
      ...prev,
      preset: 'custom',
      date_to: value,
    }))
    setValidationError('')
  }

  function handleApplyClick() {
    if (draftFilters.date_from && draftFilters.date_to && draftFilters.date_from > draftFilters.date_to) {
      setValidationError(
        t('From date must be before or equal to To date.', {
          defaultValue: 'From date must be before or equal to To date.',
        })
      )
      return
    }

    onApply(draftFilters)
    setIsOpen(false)
    triggerRef.current?.focus()
  }

  function handleResetClick() {
    onReset()
    setIsOpen(false)
    triggerRef.current?.focus()
  }

  // Summary display text (e.g. "All dates · All governorates")
  const dateSummary = (() => {
    if (appliedFilters.preset === 'today') return t('Today', { defaultValue: 'Today' })
    if (appliedFilters.preset === '7days') return t('Last 7 days', { defaultValue: 'Last 7 days' })
    if (appliedFilters.preset === '30days') return t('Last 30 days', { defaultValue: 'Last 30 days' })
    if (appliedFilters.date_from && appliedFilters.date_to) {
      return `${appliedFilters.date_from} → ${appliedFilters.date_to}`
    }
    if (appliedFilters.date_from) {
      return `${t('From', { defaultValue: 'From' })} ${appliedFilters.date_from}`
    }
    return t('All dates', { defaultValue: 'All dates' })
  })()

  const selectedGov = governorates.find((g) => String(g.id) === appliedFilters.delivery_governorate_id)
  const govSummary = selectedGov
    ? (locale === 'ar' ? selectedGov.name_ar : selectedGov.name) || selectedGov.name || ''
    : t('All governorates', { defaultValue: 'All governorates' })

  const summaryLabel = `${dateSummary} · ${govSummary}`

  const presets: Array<{ id: DashboardDatePreset; label: string }> = [
    { id: 'all', label: t('All dates', { defaultValue: 'All dates' }) },
    { id: 'today', label: t('Today', { defaultValue: 'Today' }) },
    { id: '7days', label: t('Last 7 days', { defaultValue: 'Last 7 days' }) },
    { id: '30days', label: t('Last 30 days', { defaultValue: 'Last 30 days' }) },
    { id: 'custom', label: t('Custom', { defaultValue: 'Custom' }) },
  ]

  return (
    <div className="merchant-dashboard-filters" ref={popoverRef}>
      <div className="merchant-dashboard-filters__trigger-wrap">
        <button
          ref={triggerRef}
          type="button"
          className={`merchant-dashboard-filters__btn${isOpen ? ' is-active' : ''}`}
          onClick={handleToggleOpen}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          aria-label={t('Open dashboard filters', { defaultValue: 'Open dashboard filters' })}
        >
          <SlidersHorizontal size={15} aria-hidden="true" />
          <span>{t('Filters', { defaultValue: 'Filters' })}</span>
        </button>
        <span className="merchant-dashboard-filters__summary" title={summaryLabel}>
          {summaryLabel}
        </span>
      </div>

      {isOpen && (
        <div
          className="merchant-dashboard-filters__popup"
          role="dialog"
          aria-label={t('Dashboard filters', { defaultValue: 'Dashboard filters' })}
        >
          <div className="merchant-dashboard-filters__title">
            {t('Dashboard filters', { defaultValue: 'Dashboard filters' })}
          </div>

          {/* Date Presets */}
          <div className="merchant-dashboard-presets" role="group" aria-label={t('Date presets', { defaultValue: 'Date presets' })}>
            {presets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className={`merchant-dashboard-presets__btn${draftFilters.preset === preset.id ? ' is-active' : ''}`}
                onClick={() => handleSelectPreset(preset.id)}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* From / To Date Inputs */}
          <div className="merchant-dashboard-filters__fields">
            <div className="merchant-dashboard-field">
              <label htmlFor={dateFromId} className="merchant-dashboard-field__label">
                {t('From', { defaultValue: 'From' })}
              </label>
              <input
                id={dateFromId}
                type="date"
                className="ui-input merchant-dashboard-field__input"
                value={draftFilters.date_from}
                onChange={(e) => handleDateFromChange(e.target.value)}
              />
            </div>
            <div className="merchant-dashboard-field">
              <label htmlFor={dateToId} className="merchant-dashboard-field__label">
                {t('To', { defaultValue: 'To' })}
              </label>
              <input
                id={dateToId}
                type="date"
                className="ui-input merchant-dashboard-field__input"
                value={draftFilters.date_to}
                onChange={(e) => handleDateToChange(e.target.value)}
              />
            </div>
          </div>

          {/* Governorate Select */}
          <div className="merchant-dashboard-field merchant-dashboard-field--full">
            <label htmlFor={governorateId} className="merchant-dashboard-field__label">
              {t('Governorate', { defaultValue: 'Governorate' })}
            </label>
            <select
              id={governorateId}
              className="ui-select merchant-dashboard-field__select"
              value={draftFilters.delivery_governorate_id}
              onChange={(e) =>
                setDraftFilters((prev) => ({
                  ...prev,
                  delivery_governorate_id: e.target.value,
                }))
              }
            >
              <option value="">{t('All governorates', { defaultValue: 'All governorates' })}</option>
              {governorates.map((gov) => (
                <option key={gov.id} value={String(gov.id)}>
                  {(locale === 'ar' ? gov.name_ar : gov.name) || gov.name || ''}
                </option>
              ))}
            </select>
          </div>

          {validationError && (
            <p className="merchant-dashboard-filters__error" role="alert">
              {validationError}
            </p>
          )}

          {/* Actions */}
          <div className="merchant-dashboard-filters__actions">
            <button
              type="button"
              className="ui-button ui-button--secondary merchant-dashboard-filters__reset-btn"
              onClick={handleResetClick}
            >
              {t('Reset', { defaultValue: 'Reset' })}
            </button>
            <button
              type="button"
              className="ui-button ui-button--primary merchant-dashboard-filters__apply-btn"
              onClick={handleApplyClick}
            >
              {t('Apply filters', { defaultValue: 'Apply filters' })}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
