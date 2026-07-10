import { Check, ChevronDown, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '../../utils/cn'

type StringMultiSelectProps = {
  disabled?: boolean
  options: string[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
}

export function StringMultiSelect({
  disabled = false,
  options,
  value,
  onChange,
  placeholder,
}: StringMultiSelectProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    window.addEventListener('mousedown', handlePointerDown)
    window.addEventListener('keydown', handleEscape)
    return () => {
      window.removeEventListener('mousedown', handlePointerDown)
      window.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  function toggleOption(option: string) {
    if (value.includes(option)) {
      onChange(value.filter((o) => o !== option))
    } else {
      onChange([...value, option])
    }
  }

  const summary = value.length
    ? t('{{count}} selected', { count: value.length, defaultValue: `${value.length} selected` })
    : (placeholder ?? t('Select options', { defaultValue: 'Select options' }))

  return (
    <div ref={containerRef} className="permission-multi-select">
      <button
        aria-expanded={open}
        className={cn('permission-multi-select__trigger', disabled && 'permission-multi-select__trigger--disabled')}
        disabled={disabled}
        type="button"
        onClick={() => setOpen(!open)}
      >
        <span className={cn('permission-multi-select__summary', !value.length && 'permission-multi-select__summary--placeholder')}>
          {summary}
        </span>
        <ChevronDown size={16} />
      </button>

      {open && (
        <div className="permission-multi-select__content" style={{ padding: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
          {value.length > 0 && (
            <div className="permission-multi-select__chips" style={{ marginBottom: '0.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)', display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
              {value.map((opt) => (
                <button
                  key={opt}
                  className="permission-multi-select__chip"
                  type="button"
                  onClick={() => toggleOption(opt)}
                >
                  <span>{opt}</span>
                  <X size={12} />
                </button>
              ))}
            </div>
          )}
          <div className="permission-multi-select__options" style={{ padding: 0 }}>
            {options.map((option) => {
              const isSelected = value.includes(option)
              return (
                <button
                  key={option}
                  className={cn('permission-multi-select__option', isSelected && 'permission-multi-select__option--selected')}
                  type="button"
                  onClick={() => toggleOption(option)}
                >
                  <div>
                    <strong>{option}</strong>
                  </div>
                  {isSelected && <Check size={14} />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
