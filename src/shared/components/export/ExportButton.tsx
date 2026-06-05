import type { Permission } from '../../auth/permission-keys'
import { useTranslation } from 'react-i18next'
import { PermissionGate } from '../../auth/PermissionGate'
import { Button } from '../ui/Button'

type ExportButtonProps = {
  onExport: () => void
  disabled?: boolean
  loading?: boolean
  label?: string
  permission?: Permission
}

export function ExportButton({
  onExport,
  disabled = false,
  loading = false,
  label = 'Export',
  permission,
}: ExportButtonProps) {
  const { t } = useTranslation()

  const button = (
    <Button type="button" variant="secondary" disabled={disabled} loading={loading} onClick={onExport}>
      {t(label, { defaultValue: label })}
    </Button>
  )

  return permission ? (
    <PermissionGate permission={permission}>
      {button}
    </PermissionGate>
  ) : button
}
