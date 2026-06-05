import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import {
  completePackingTask,
  generatePackingTask,
  listPackingTasks,
  listPickingLists,
} from '../api/warehouse.api'
import type { CompletePackingTaskRequest, PackingTask, PickingList } from '../types/warehouse.types'
import { getApiErrorMessage } from '../../../shared/api/api-error'
import { Can } from '../../../shared/auth/Can'
import { PERMISSIONS } from '../../../shared/auth/permission-keys'
import { FieldError } from '../../../shared/components/forms/FieldError'
import { EmptyState } from '../../../shared/components/states/EmptyState'
import { ErrorState } from '../../../shared/components/states/ErrorState'
import { LoadingState } from '../../../shared/components/states/LoadingState'
import { MoneyDisplay } from '../../../shared/components/display/MoneyDisplay'
import { Button } from '../../../shared/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/Card'
import { Dialog } from '../../../shared/components/ui/Dialog'
import { Input } from '../../../shared/components/ui/Input'
import { PageHeader } from '../../../shared/components/ui/PageHeader'
import { Select } from '../../../shared/components/ui/Select'
import { StatusBadge } from '../../../shared/components/ui/StatusBadge'
import { Table, TableCell, TableContainer, TableHead } from '../../../shared/components/ui/Table'
import { useFormApiErrors } from '../../../shared/hooks/useFormApiErrors'
import { adminPath } from '../../../shared/routing/paths'
import { formatDate } from '../../../shared/utils/formatters'

type GeneratePackingTaskFormValues = {
  picking_list_id: number
}

type CompletePackingTaskFormValues = {
  package_weight: number
  package_length: number
  package_width: number
  package_height: number
  packaging_fee: number
  notes: string
}

function GeneratePackingTaskDialog({
  error,
  isSubmitting,
  onClose,
  onSubmit,
  open,
}: {
  error?: unknown
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (values: GeneratePackingTaskFormValues) => void
  open: boolean
}) {
  const pickingListsQuery = useQuery({
    queryKey: ['picking-lists', 'packing-generate'],
    queryFn: () => listPickingLists(),
    enabled: open,
  })
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GeneratePackingTaskFormValues>({
    defaultValues: {
      picking_list_id: 0,
    },
  })
  const { formError, getFieldError } = useFormApiErrors(error)

  return (
    <Dialog open={open} onClose={onClose} title={<CardTitle>Generate Packing Tasks</CardTitle>} variant="small">
      <form className="form-grid" onSubmit={handleSubmit(onSubmit)}>
        <label className="field">
          <span>Picking List</span>
          <Select {...register('picking_list_id', { valueAsNumber: true })}>
            <option value={0}>Select picking list</option>
            {(pickingListsQuery.data?.data ?? []).map((pickingList: PickingList) => (
              <option key={pickingList.id} value={pickingList.id}>
                {pickingList.picking_number ?? pickingList.picking_list_number ?? `#${pickingList.id}`}
              </option>
            ))}
          </Select>
          <FieldError error={errors.picking_list_id?.message ?? getFieldError('picking_list_id')} />
        </label>
        {formError ? <div className="form-error">{formError}</div> : null}
        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={isSubmitting}>Generate Tasks</Button>
        </div>
      </form>
    </Dialog>
  )
}

function CompletePackingTaskDialog({
  error,
  isSubmitting,
  onClose,
  onSubmit,
  open,
  task,
}: {
  error?: unknown
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (values: CompletePackingTaskFormValues) => void
  open: boolean
  task: PackingTask | null
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CompletePackingTaskFormValues>({
    defaultValues: {
      package_weight: Number(task?.package_weight ?? 0),
      package_length: Number(task?.package_length ?? 0),
      package_width: Number(task?.package_width ?? 0),
      package_height: Number(task?.package_height ?? 0),
      packaging_fee: Number(task?.packaging_fee ?? 0),
      notes: task?.notes ?? '',
    },
  })
  const { formError, getFieldError } = useFormApiErrors(error)

  useEffect(() => {
    reset({
      package_weight: Number(task?.package_weight ?? 0),
      package_length: Number(task?.package_length ?? 0),
      package_width: Number(task?.package_width ?? 0),
      package_height: Number(task?.package_height ?? 0),
      packaging_fee: Number(task?.packaging_fee ?? 0),
      notes: task?.notes ?? '',
    })
  }, [reset, task])

  return (
    <Dialog open={open} onClose={onClose} title={<CardTitle>Complete Packing Task</CardTitle>}>
      <form className="form-grid" onSubmit={handleSubmit(onSubmit)}>
        <label className="field">
          <span>Package Weight</span>
          <Input type="number" step="0.01" {...register('package_weight', { valueAsNumber: true })} />
          <FieldError error={errors.package_weight?.message ?? getFieldError('package_weight')} />
        </label>
        <label className="field">
          <span>Package Length</span>
          <Input type="number" step="0.01" {...register('package_length', { valueAsNumber: true })} />
          <FieldError error={errors.package_length?.message ?? getFieldError('package_length')} />
        </label>
        <label className="field">
          <span>Package Width</span>
          <Input type="number" step="0.01" {...register('package_width', { valueAsNumber: true })} />
          <FieldError error={errors.package_width?.message ?? getFieldError('package_width')} />
        </label>
        <label className="field">
          <span>Package Height</span>
          <Input type="number" step="0.01" {...register('package_height', { valueAsNumber: true })} />
          <FieldError error={errors.package_height?.message ?? getFieldError('package_height')} />
        </label>
        <label className="field">
          <span>Packaging Fee</span>
          <Input type="number" step="0.01" {...register('packaging_fee', { valueAsNumber: true })} />
          <FieldError error={errors.packaging_fee?.message ?? getFieldError('packaging_fee')} />
        </label>
        <label className="field">
          <span>Notes</span>
          <Input {...register('notes')} />
          <FieldError error={errors.notes?.message ?? getFieldError('notes')} />
        </label>
        {formError ? <div className="form-error">{formError}</div> : null}
        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={isSubmitting}>Complete Task</Button>
        </div>
      </form>
    </Dialog>
  )
}

export function PackingTasksPage() {
  const queryClient = useQueryClient()
  const [generateOpen, setGenerateOpen] = useState(false)
  const [taskPendingComplete, setTaskPendingComplete] = useState<PackingTask | null>(null)
  const packingTasksQuery = useQuery({
    queryKey: ['packing-tasks'],
    queryFn: () => listPackingTasks(),
  })
  const generateMutation = useMutation({
    mutationFn: (values: GeneratePackingTaskFormValues) => generatePackingTask(values),
    onSuccess: async () => {
      setGenerateOpen(false)
      await queryClient.invalidateQueries({ queryKey: ['packing-tasks'] })
    },
  })
  const completeMutation = useMutation({
    mutationFn: ({
      packingTaskId,
      values,
    }: {
      packingTaskId: number
      values: CompletePackingTaskFormValues
    }) => {
      const payload: CompletePackingTaskRequest = {
        package_weight: values.package_weight || undefined,
        package_length: values.package_length || undefined,
        package_width: values.package_width || undefined,
        package_height: values.package_height || undefined,
        packaging_fee: values.packaging_fee || undefined,
        notes: values.notes || undefined,
      }
      return completePackingTask(packingTaskId, payload)
    },
    onSuccess: async () => {
      setTaskPendingComplete(null)
      await queryClient.invalidateQueries({ queryKey: ['packing-tasks'] })
    },
  })
  const tasks = packingTasksQuery.data?.data ?? []

  return (
    <section className="page-section">
      <PageHeader
        title="Packing Tasks"
        description="Generate and complete packing tasks from warehouse picking lists."
        actions={(
          <Can permission={PERMISSIONS.PACKING_TASKS_CREATE}>
            <Button type="button" onClick={() => setGenerateOpen(true)}>
              Generate Packing Tasks
            </Button>
          </Can>
        )}
      />

      <Card className="table-card">
        <CardHeader>
          <CardTitle>Packing Tasks</CardTitle>
          <CardDescription>Packing tasks returned by the warehouse API.</CardDescription>
        </CardHeader>
        <CardContent>
          {packingTasksQuery.isLoading ? <LoadingState title="Loading packing tasks" /> : null}
          {packingTasksQuery.isError ? (
            <ErrorState
              title="Unable to load packing tasks"
              message={getApiErrorMessage(packingTasksQuery.error)}
              onRetry={() => void packingTasksQuery.refetch()}
            />
          ) : null}
          {!packingTasksQuery.isLoading && !packingTasksQuery.isError && !tasks.length ? (
            <EmptyState
              title="No packing tasks"
              description="No packing tasks were returned by the warehouse API."
            />
          ) : null}
          {tasks.length ? (
            <TableContainer>
              <Table variant="compact">
                <thead>
                  <tr>
                    <TableHead>Task</TableHead>
                    <TableHead>Picking List</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Merchant</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Packaging Fee</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => (
                    <tr key={task.id}>
                      <TableCell>
                        <Link className="table-link" to={adminPath(`/warehouse/packing-tasks/${task.id}`)}>
                          {task.packing_number ?? task.packing_task_number ?? `Packing Task #${task.id}`}
                        </Link>
                      </TableCell>
                      <TableCell>{task.picking_number_ref ?? task.picking_list_id ?? '-'}</TableCell>
                      <TableCell>{task.order_number ?? task.order_id ?? '-'}</TableCell>
                      <TableCell>{task.merchant_name ?? '-'}</TableCell>
                      <TableCell><StatusBadge value={task.status ?? 'pending'} /></TableCell>
                      <TableCell><MoneyDisplay value={task.packaging_fee ?? null} /></TableCell>
                      <TableCell>{formatDate(task.created_at)}</TableCell>
                      <TableCell>
                        <div className="page-header__button-row">
                          <Link className="table-link" to={adminPath(`/warehouse/packing-tasks/${task.id}`)}>
                            View
                          </Link>
                          <Can permission={PERMISSIONS.PACKING_TASKS_COMPLETE}>
                            {task.status !== 'packed' ? (
                              <Button type="button" variant="secondary" onClick={() => setTaskPendingComplete(task)}>
                                Complete
                              </Button>
                            ) : null}
                          </Can>
                        </div>
                      </TableCell>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableContainer>
          ) : null}
        </CardContent>
      </Card>

      <GeneratePackingTaskDialog
        error={generateMutation.error}
        isSubmitting={generateMutation.isPending}
        onClose={() => setGenerateOpen(false)}
        onSubmit={(values) => generateMutation.mutate(values)}
        open={generateOpen}
      />
      <CompletePackingTaskDialog
        error={completeMutation.error}
        isSubmitting={completeMutation.isPending}
        onClose={() => setTaskPendingComplete(null)}
        onSubmit={(values) => {
          if (taskPendingComplete) {
            completeMutation.mutate({ packingTaskId: taskPendingComplete.id, values })
          }
        }}
        open={Boolean(taskPendingComplete)}
        task={taskPendingComplete}
      />
    </section>
  )
}
