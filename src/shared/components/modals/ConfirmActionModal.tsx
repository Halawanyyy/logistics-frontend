import { useTranslation } from 'react-i18next'
import { CardTitle } from '../ui/Card'
import { Dialog } from '../ui/Dialog'
import { Button } from '../ui/Button'

type ConfirmActionModalProps = {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'default'
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmActionModal({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmActionModalProps) {
  const { t } = useTranslation()

  return (
    <Dialog open={open} onClose={onCancel} title={<CardTitle>{t(title, { defaultValue: title })}</CardTitle>} variant="small">
      <div className="form-grid">
        <p>{t(description, { defaultValue: description })}</p>
        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
            {t(cancelLabel, { defaultValue: cancelLabel })}
          </Button>
          <Button
            type="button"
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            loading={loading}
          >
            {t(confirmLabel, { defaultValue: confirmLabel })}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
