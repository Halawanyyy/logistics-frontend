import { forwardRef } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '../../utils/cn'

export type FilterButtonProps = {
  activeCount?: number
  open?: boolean
  onClick?: () => void
  className?: string
  ariaControls?: string
  label?: string
  disabled?: boolean
}

export const FilterButton = forwardRef<HTMLButtonElement, FilterButtonProps>(function FilterButton(
  {
    activeCount = 0,
    open = false,
    onClick,
    className,
    ariaControls,
    label,
    disabled = false,
  },
  ref,
) {
  const { t } = useTranslation()
  const displayLabel = label ?? t('Filters', { defaultValue: 'Filters' })

  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        'filter-button',
        open && 'filter-button--open',
        activeCount > 0 && 'filter-button--has-filters',
        className,
      )}
      onClick={onClick}
      disabled={disabled}
      aria-expanded={open}
      aria-haspopup="dialog"
      aria-controls={ariaControls}
      aria-label={
        activeCount > 0
          ? `${displayLabel} (${activeCount})`
          : displayLabel
      }
    >
      <SlidersHorizontal size={15} aria-hidden="true" className="filter-button__icon" />
      <span className="filter-button__label">{displayLabel}</span>
      {activeCount > 0 ? (
        <span className="filter-button__badge" aria-hidden="true">
          {activeCount}
        </span>
      ) : null}
    </button>
  )
})
