import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'

export type FilterFieldProps = {
  label: string
  children: ReactNode
  error?: string
  className?: string
  fullWidth?: boolean
  htmlFor?: string
}

export function FilterField({
  label,
  children,
  error,
  className,
  fullWidth = false,
  htmlFor,
}: FilterFieldProps) {
  return (
    <div
      className={cn(
        'filter-field',
        fullWidth && 'filter-field--full',
        Boolean(error) && 'filter-field--error',
        className,
      )}
    >
      <label htmlFor={htmlFor} className="filter-field__label">
        {label}
      </label>
      <div className="filter-field__control">{children}</div>
      {error ? (
        <p className="filter-field__error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
