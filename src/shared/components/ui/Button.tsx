import type { ButtonHTMLAttributes, PropsWithChildren } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '../../utils/cn'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'icon'
type ButtonSize = 'sm' | 'md'

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    loading?: boolean
    size?: ButtonSize
    variant?: ButtonVariant
  }
>

export function Button({
  children,
  className,
  disabled,
  loading = false,
  size = 'md',
  type = 'button',
  variant = 'primary',
  ...props
}: ButtonProps) {
  const { t } = useTranslation()

  return (
    <button
      type={type}
      className={cn('ui-button', `ui-button--${variant}`, `ui-button--${size}`, className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <span className="ui-button__spinner" aria-hidden="true" /> : null}
      <span className="ui-button__content">
        {typeof children === 'string' ? (
          <span className="ui-button__label">{loading ? t('Loading...') : t(children, { defaultValue: children })}</span>
        ) : (
          children
        )}
      </span>
    </button>
  )
}
