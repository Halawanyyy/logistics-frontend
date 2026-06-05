import { Check, ChevronDown, Search } from 'lucide-react'
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '../../utils/cn'

export type SearchableSelectOption = {
  label: string
  value: string
  keywords?: string[]
}

type SearchableSelectProps = {
  value?: string | number
  options: SearchableSelectOption[]
  onChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  disabled?: boolean
  className?: string
}

function getSelectedIndex(options: SearchableSelectOption[], value: string) {
  const selectedIndex = options.findIndex((option) => option.value === value)
  return selectedIndex >= 0 ? selectedIndex : 0
}

export function SearchableSelect({
  className,
  disabled = false,
  emptyMessage = 'No options found.',
  onChange,
  options,
  placeholder = 'Select an option',
  searchPlaceholder = 'Type to filter options...',
  value = '',
}: SearchableSelectProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const normalizedValue = String(value)

  const selectedOption = useMemo(
    () => options.find((option) => option.value === normalizedValue) ?? null,
    [normalizedValue, options],
  )

  const filteredOptions = useMemo(() => {
    if (!query.trim()) {
      return options
    }

    const searchTerm = query.trim().toLowerCase()

    return options.filter((option) => {
      const haystack = [option.label, option.value, ...(option.keywords ?? [])]
        .join(' ')
        .toLowerCase()

      return haystack.includes(searchTerm)
    })
  }, [options, query])

  useEffect(() => {
    if (!open) {
      return
    }

    inputRef.current?.focus()

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }

    window.addEventListener('mousedown', handlePointerDown)
    return () => window.removeEventListener('mousedown', handlePointerDown)
  }, [open])

  function handleSelect(nextValue: string) {
    onChange(nextValue)
    setOpen(false)
    setQuery('')
  }

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) {
      return
    }

    if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
    }
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!filteredOptions.length) {
      if (event.key === 'Escape') {
        setOpen(false)
        setQuery('')
      }
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((current) => Math.min(current + 1, filteredOptions.length - 1))
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((current) => Math.max(current - 1, 0))
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      handleSelect(filteredOptions[activeIndex]?.value ?? '')
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      setOpen(false)
      setQuery('')
    }
  }

  return (
    <div ref={containerRef} className={cn('ui-searchable-select', className)}>
      <button
        aria-expanded={open}
        aria-haspopup="listbox"
        className={cn('ui-searchable-select__trigger', disabled && 'ui-searchable-select__trigger--disabled')}
        disabled={disabled}
        type="button"
        onClick={() => {
          if (open) {
            setOpen(false)
            setQuery('')
            return
          }

          setActiveIndex(getSelectedIndex(filteredOptions, normalizedValue))
          setOpen(true)
        }}
        onKeyDown={handleTriggerKeyDown}
      >
        <span className={cn(!selectedOption && 'ui-searchable-select__placeholder')}>
          {selectedOption?.label ?? t(placeholder, { defaultValue: placeholder })}
        </span>
        <ChevronDown size={16} />
      </button>

      {open ? (
        <div className="ui-searchable-select__content">
          <div className="ui-searchable-select__search">
            <Search size={14} />
            <input
              ref={inputRef}
              className="ui-searchable-select__input"
              placeholder={t(searchPlaceholder, { defaultValue: searchPlaceholder })}
              type="text"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setActiveIndex(0)
              }}
              onKeyDown={handleInputKeyDown}
            />
          </div>
          <div className="ui-searchable-select__options" role="listbox">
            {filteredOptions.length ? (
              filteredOptions.map((option, index) => {
                const isSelected = option.value === normalizedValue

                return (
                  <button
                    key={option.value}
                    aria-selected={isSelected}
                    className={cn(
                      'ui-searchable-select__option',
                      index === activeIndex && 'ui-searchable-select__option--active',
                      isSelected && 'ui-searchable-select__option--selected',
                    )}
                    role="option"
                    type="button"
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => handleSelect(option.value)}
                  >
                    <span>{option.label}</span>
                    {isSelected ? <Check size={14} /> : null}
                  </button>
                )
              })
            ) : (
              <div className="ui-searchable-select__empty">{t(emptyMessage, { defaultValue: emptyMessage })}</div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
