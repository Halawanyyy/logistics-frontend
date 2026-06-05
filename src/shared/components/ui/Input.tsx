import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

type InputVariant = 'default' | 'error' | 'disabled'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  variant?: InputVariant
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, disabled, variant = 'default', ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn('ui-input', `ui-input--${disabled ? 'disabled' : variant}`, className)}
      disabled={disabled}
      {...props}
    />
  )
})
