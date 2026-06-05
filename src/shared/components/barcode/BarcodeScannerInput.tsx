import { useEffect, useRef } from 'react'
import { Input } from '../ui/Input'

type BarcodeScannerInputProps = {
  value: string
  onChange: (value: string) => void
  onScan: (value: string) => void
  autoFocus?: boolean
  clearOnScan?: boolean
  disabled?: boolean
  placeholder?: string
}

export function BarcodeScannerInput({
  value,
  onChange,
  onScan,
  autoFocus = false,
  clearOnScan = true,
  disabled = false,
  placeholder = 'Scan or enter barcode',
}: BarcodeScannerInputProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus()
    }
  }, [autoFocus])

  return (
    <Input
      ref={inputRef}
      disabled={disabled}
      placeholder={placeholder}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault()
          const nextValue = value.trim()
          if (!nextValue) {
            return
          }
          onScan(nextValue)
          if (clearOnScan) {
            onChange('')
          }
        }
      }}
    />
  )
}
