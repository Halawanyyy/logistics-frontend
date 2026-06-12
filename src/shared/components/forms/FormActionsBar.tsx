import type { ReactNode } from 'react'
import { Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '../ui/Button'
import { cn } from '../../utils/cn'

type FormActionsBarProps = {
  className?: string
  isSubmitting?: boolean
  secondaryAction?: ReactNode
  submitIcon?: ReactNode
  submitIconPosition?: 'leading' | 'trailing'
  submitLabel: string
}

export function FormActionsBar({
  className,
  isSubmitting = false,
  secondaryAction,
  submitIcon = <Check size={16} />,
  submitIconPosition = 'trailing',
  submitLabel,
}: FormActionsBarProps) {
  const { t } = useTranslation()

  return (
    <div className={cn('form-actions', secondaryAction && 'form-actions--split', className)}>
      {secondaryAction ? <div className="form-actions__secondary">{secondaryAction}</div> : null}
      <div className="form-actions__primary">
        <Button type="submit" loading={isSubmitting}>
          <>
            {submitIcon && submitIconPosition === 'leading' ? (
              <span className="ui-button__icon" aria-hidden="true">{submitIcon}</span>
            ) : null}
            <span className="ui-button__label">{t(submitLabel, { defaultValue: submitLabel })}</span>
            {submitIcon && submitIconPosition === 'trailing' ? (
              <span className="ui-button__icon" aria-hidden="true">{submitIcon}</span>
            ) : null}
          </>
        </Button>
      </div>
    </div>
  )
}
