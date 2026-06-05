import type { ReactNode } from 'react'
import { PermissionGate } from '../../auth/PermissionGate'
import type { Permission } from '../../auth/permission-keys'
import { Button } from '../ui/Button'

type ActionConfig = {
  label: string
  onClick: () => void
  permission?: Permission
  loading?: boolean
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'danger'
  icon?: ReactNode
}

type ApprovalActionButtonsProps = {
  approve?: ActionConfig
  reject?: ActionConfig
  complete?: ActionConfig
  markPaid?: ActionConfig
}

function ActionButton({ action }: { action?: ActionConfig }) {
  if (!action) {
    return null
  }

  const button = (
    <Button
      type="button"
      variant={action.variant ?? 'secondary'}
      loading={action.loading}
      disabled={action.disabled}
      onClick={action.onClick}
    >
      {action.icon}
      {action.label}
    </Button>
  )

  return action.permission ? (
    <PermissionGate permission={action.permission}>
      {button}
    </PermissionGate>
  ) : button
}

export function ApprovalActionButtons(props: ApprovalActionButtonsProps) {
  return (
    <div className="form-actions">
      <ActionButton action={props.approve} />
      <ActionButton action={props.reject} />
      <ActionButton action={props.complete} />
      <ActionButton action={props.markPaid} />
    </div>
  )
}
