import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useEffect, useState } from 'react'
import { completePackingTask, getPackingTask } from '../api/warehouse.api'
import type { CompletePackingTaskRequest } from '../types/warehouse.types'
import { getApiErrorMessage, isApiNotFound } from '../../../shared/api/api-error'
import { Can } from '../../../shared/auth/Can'
import { PERMISSIONS } from '../../../shared/auth/permission-keys'
import { FieldError } from '../../../shared/components/forms/FieldError'
import { NotFoundState } from '../../../shared/components/states/NotFoundState'
import { ErrorState } from '../../../shared/components/states/ErrorState'
import { LoadingState } from '../../../shared/components/states/LoadingState'
import { MoneyDisplay } from '../../../shared/components/display/MoneyDisplay'
import { Button } from '../../../shared/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/Card'
import { Dialog } from '../../../shared/components/ui/Dialog'
import { Input } from '../../../shared/components/ui/Input'
import { PageHeader } from '../../../shared/components/ui/PageHeader'
import { StatusBadge } from '../../../shared/components/ui/StatusBadge'
import { useFormApiErrors } from '../../../shared/hooks/useFormApiErrors'
import { adminPath } from '../../../shared/routing/paths'
import { formatDate } from '../../../shared/utils/formatters'

type CompletePackingTaskFormValues = {
  package_weight: number
  package_length: number
  package_width: number
  package_height: number
  packaging_fee: number
  notes: string
}

function CompletePackingTaskDialog({
  error,
  isSubmitting,
  onClose,
  onSubmit,
  open,
  defaultValues,
}: {
  error?: unknown
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (values: CompletePackingTaskFormValues) => void
  open: boolean
  defaultValues: CompletePackingTaskFormValues
}) {
  const { t } = useTranslation()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CompletePackingTaskFormValues>({
    defaultValues,
  })
  const { formError, getFieldError } = useFormApiErrors(error)

  useEffect(() => {
    reset(defaultValues)
  }, [defaultValues, reset])

  return (
    <Dialog open={open} onClose={onClose} title={<CardTitle>{t('Complete Packing Task', { defaultValue: 'Complete Packing Task' })}</CardTitle>}>
      <form className="form-grid" onSubmit={handleSubmit(onSubmit)}>
        <label className="field">
          <span>{t('Package Weight', { defaultValue: 'Package Weight' })}</span>
          <Input type="number" step="0.01" min="0" {...register('package_weight', { valueAsNumber: true, min: 0 })} />
          <FieldError error={errors.package_weight?.message ?? getFieldError('package_weight')} />
        </label>
        <label className="field">
          <span>{t('Package Length', { defaultValue: 'Package Length' })}</span>
          <Input type="number" step="0.01" min="0" {...register('package_length', { valueAsNumber: true, min: 0 })} />
          <FieldError error={errors.package_length?.message ?? getFieldError('package_length')} />
        </label>
        <label className="field">
          <span>{t('Package Width', { defaultValue: 'Package Width' })}</span>
          <Input type="number" step="0.01" min="0" {...register('package_width', { valueAsNumber: true, min: 0 })} />
          <FieldError error={errors.package_width?.message ?? getFieldError('package_width')} />
        </label>
        <label className="field">
          <span>{t('Package Height', { defaultValue: 'Package Height' })}</span>
          <Input type="number" step="0.01" min="0" {...register('package_height', { valueAsNumber: true, min: 0 })} />
          <FieldError error={errors.package_height?.message ?? getFieldError('package_height')} />
        </label>
        <label className="field">
          <span>{t('Packaging Fee', { defaultValue: 'Packaging Fee' })}</span>
          <Input type="number" step="0.01" min="0" {...register('packaging_fee', { valueAsNumber: true, min: 0 })} />
          <FieldError error={errors.packaging_fee?.message ?? getFieldError('packaging_fee')} />
        </label>
        <label className="field">
          <span>{t('Notes')}</span>
          <Input {...register('notes')} />
          <FieldError error={errors.notes?.message ?? getFieldError('notes')} />
        </label>
        {formError ? <div className="form-error">{formError}</div> : null}
        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={onClose}>{t('Cancel')}</Button>
          <Button type="submit" loading={isSubmitting}>{t('Complete Task', { defaultValue: 'Complete Task' })}</Button>
        </div>
      </form>
    </Dialog>
  )
}

export function PackingTaskDetailsPage() {
  const { t } = useTranslation()
  const { packingTaskId } = useParams()
  const queryClient = useQueryClient()
  const [completeOpen, setCompleteOpen] = useState(false)
  const query = useQuery({
    queryKey: ['packing-tasks', packingTaskId],
    queryFn: () => getPackingTask(packingTaskId!),
    enabled: Boolean(packingTaskId),
  })

  const completeMutation = useMutation({
    mutationFn: (values: CompletePackingTaskFormValues) => {
      const payload: CompletePackingTaskRequest = {
        package_weight: values.package_weight || undefined,
        package_length: values.package_length || undefined,
        package_width: values.package_width || undefined,
        package_height: values.package_height || undefined,
        packaging_fee: values.packaging_fee || undefined,
        notes: values.notes || undefined,
      }
      return completePackingTask(packingTaskId!, payload)
    },
    onSuccess: async () => {
      setCompleteOpen(false)
      await queryClient.invalidateQueries({ queryKey: ['packing-tasks'] })
      await query.refetch()
    },
  })

  if (query.isLoading) {
    return <LoadingState title={t('Loading packing task', { defaultValue: 'Loading packing task' })} />
  }

  if (query.isError && isApiNotFound(query.error)) {
    return (
      <NotFoundState
        title={t('Packing task not found', { defaultValue: 'Packing task not found' })}
        description={t('No packing task with this ID was returned by the warehouse API.', { defaultValue: 'No packing task with this ID was returned by the warehouse API.' })}
      />
    )
  }

  if (query.isError || !query.data) {
    return <ErrorState title={t('Unable to load packing task', { defaultValue: 'Unable to load packing task' })} message={getApiErrorMessage(query.error)} onRetry={() => void query.refetch()} />
  }

  const task = query.data.data
  const canComplete = task.status !== 'packed' && task.status !== 'cancelled'

  return (
    <section className="page-section">
      <PageHeader
        title={task.packing_number ?? task.packing_task_number ?? t('Packing Task #{{id}}', { id: task.id, defaultValue: `Packing Task #${task.id}` })}
        description={t('Detail data is loaded from the documented packing task detail endpoint.', { defaultValue: 'Detail data is loaded from the documented packing task detail endpoint.' })}
        actions={(
          <div className="page-header__button-row">
            <Can permission={PERMISSIONS.PACKING_TASKS_COMPLETE}>
              {canComplete ? (
                <Button type="button" variant="secondary" onClick={() => setCompleteOpen(true)}>
                  {t('Complete Task', { defaultValue: 'Complete Task' })}
                </Button>
              ) : null}
            </Can>
            <Link className="ui-link-reset" to={adminPath('/warehouse/packing-tasks')}>
              <Button variant="secondary">{t('Back')}</Button>
            </Link>
          </div>
        )}
      />

      {completeMutation.error ? <div className="form-error">{getApiErrorMessage(completeMutation.error)}</div> : null}

      <div className="details-grid">
        <Card className="detail-card">
          <CardHeader>
            <CardTitle>{t('Overview')}</CardTitle>
            <CardDescription>{t('Packing task references and completion state.', { defaultValue: 'Packing task references and completion state.' })}</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="detail-list">
              <div><dt>{t('Status')}</dt><dd><StatusBadge value={task.status ?? 'pending'} /></dd></div>
              <div><dt>{t('Picking List', { defaultValue: 'Picking List' })}</dt><dd>{task.picking_number_ref ?? task.picking_list_id ?? '-'}</dd></div>
              <div><dt>{t('Order')}</dt><dd>{task.order_number ?? task.order_id ?? '-'}</dd></div>
              <div><dt>{t('Shipment')}</dt><dd>{task.shipment_number ?? task.shipment_id ?? '-'}</dd></div>
              <div><dt>{t('Merchant')}</dt><dd>{task.merchant_name ?? '-'}</dd></div>
              <div><dt>{t('Packed By', { defaultValue: 'Packed By' })}</dt><dd>{task.packed_by_name ?? '-'}</dd></div>
              <div><dt>{t('Packed At', { defaultValue: 'Packed At' })}</dt><dd>{task.packed_at ? formatDate(task.packed_at) : '-'}</dd></div>
              <div><dt>{t('Created At')}</dt><dd>{formatDate(task.created_at)}</dd></div>
            </dl>
          </CardContent>
        </Card>

        <Card className="detail-card">
          <CardHeader>
            <CardTitle>{t('Package', { defaultValue: 'Package' })}</CardTitle>
            <CardDescription>{t('Dimensions and packaging fee returned by the API.', { defaultValue: 'Dimensions and packaging fee returned by the API.' })}</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="detail-list">
              <div><dt>{t('Weight')}</dt><dd>{task.package_weight ?? '-'}</dd></div>
              <div><dt>{t('Length')}</dt><dd>{task.package_length ?? '-'}</dd></div>
              <div><dt>{t('Width')}</dt><dd>{task.package_width ?? '-'}</dd></div>
              <div><dt>{t('Height')}</dt><dd>{task.package_height ?? '-'}</dd></div>
              <div><dt>{t('Packaging Fee', { defaultValue: 'Packaging Fee' })}</dt><dd><MoneyDisplay value={task.packaging_fee ?? null} /></dd></div>
              <div><dt>{t('Notes')}</dt><dd>{task.notes ?? '-'}</dd></div>
            </dl>
          </CardContent>
        </Card>
      </div>

      <CompletePackingTaskDialog
        defaultValues={{
          package_weight: Number(task.package_weight ?? 0),
          package_length: Number(task.package_length ?? 0),
          package_width: Number(task.package_width ?? 0),
          package_height: Number(task.package_height ?? 0),
          packaging_fee: Number(task.packaging_fee ?? 0),
          notes: task.notes ?? '',
        }}
        error={completeMutation.error}
        isSubmitting={completeMutation.isPending}
        onClose={() => setCompleteOpen(false)}
        onSubmit={(values) => completeMutation.mutate(values)}
        open={completeOpen}
      />
    </section>
  )
}
