import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '../ui/Button'
import { cn } from '../../utils/cn'

export type AppliedFilterChip = {
  key?: string
  id?: string
  label: string
  value?: string
}

export type AppliedChip = AppliedFilterChip


export type AppliedFilterChipsProps = {
  chips: AppliedFilterChip[]
  onRemove: (key: string) => void
  onClearAll?: () => void
  className?: string
  ariaLabel?: string
}

export function AppliedFilterChips({
  chips,
  onRemove,
  onClearAll,
  className,
  ariaLabel,
}: AppliedFilterChipsProps) {
  const { t } = useTranslation()

  if (!chips.length) {
    return null
  }

  return (
    <div
      className={cn('applied-filter-chips', className)}
      aria-label={ariaLabel ?? t('Applied filters', { defaultValue: 'Applied filters' })}
      role="region"
    >
      <div className="applied-filter-chips__list">
        {chips.map((chip) => {
          const chipKey = chip.key ?? chip.id ?? chip.label
          const displayText = chip.value ? `${chip.label}: ${chip.value}` : chip.label

          return (
            <span className="applied-filter-chip" key={chipKey}>
              <span className="applied-filter-chip__text">{displayText}</span>
              <button
                type="button"
                className="applied-filter-chip__remove"
                onClick={() => onRemove(chipKey)}
                aria-label={t('Remove {{label}} filter', {
                  defaultValue: `Remove ${chip.label} filter`,
                  label: chip.label,
                })}
              >
                <X size={13} aria-hidden="true" />
              </button>
            </span>
          )
        })}
      </div>

      {onClearAll && chips.length > 1 ? (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="applied-filter-chips__clear-all"
          onClick={onClearAll}
        >
          {t('Clear all', { defaultValue: 'Clear all' })}
        </Button>
      ) : null}
    </div>
  )
}
