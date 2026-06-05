import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  activateMerchantPortalUser,
  createMerchantPortalUser,
  deleteMerchantPortalUser,
  getMerchantPortalUser,
  listMerchantPortalUsers,
  suspendMerchantPortalUser,
  updateMerchantPortalUser,
} from '../api/merchants.api'
import type {
  CreateMerchantPortalUserPayload,
  MerchantPortalUser,
  UpdateMerchantPortalUserPayload,
} from '../types/merchant.types'
import { getApiErrorMessage } from '../../../shared/api/api-error'
import { Can } from '../../../shared/auth/Can'
import { PERMISSIONS } from '../../../shared/auth/permission-keys'
import { FieldError } from '../../../shared/components/forms/FieldError'
import { ConfirmActionModal } from '../../../shared/components/modals/ConfirmActionModal'
import { EmptyState } from '../../../shared/components/states/EmptyState'
import { ErrorState } from '../../../shared/components/states/ErrorState'
import { LoadingState } from '../../../shared/components/states/LoadingState'
import { Button } from '../../../shared/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/Card'
import { Dialog } from '../../../shared/components/ui/Dialog'
import { Input } from '../../../shared/components/ui/Input'
import { Select } from '../../../shared/components/ui/Select'
import { StatusBadge } from '../../../shared/components/ui/StatusBadge'
import { Table, TableCell, TableContainer, TableHead } from '../../../shared/components/ui/Table'
import { useFormApiErrors } from '../../../shared/hooks/useFormApiErrors'
import { pickDisplayLabel } from '../../../shared/i18n/locale'
import { formatDate } from '../../../shared/utils/formatters'

type PortalUserFormValues = {
  mode: 'existing' | 'new'
  user_id: number
  name: string
  email: string
  password: string
  password_confirmation: string
  role: string
  status: string
}

function mapPortalUserToValues(user?: MerchantPortalUser | null): PortalUserFormValues {
  return {
    mode: user?.user_id ? 'existing' : 'new',
    user_id: user?.user_id ?? 0,
    name: user?.name ?? '',
    email: user?.email ?? '',
    password: '',
    password_confirmation: '',
    role: user?.role ?? 'staff',
    status: user?.status ?? 'active',
  }
}

function MerchantPortalUserDialog({
  currentUser,
  error,
  isSubmitting,
  onClose,
  onSubmit,
  open,
}: {
  currentUser?: MerchantPortalUser | null
  error?: unknown
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (values: PortalUserFormValues) => void
  open: boolean
}) {
  const { formError, getFieldError } = useFormApiErrors(error)
  const {
    handleSubmit,
    register,
    reset,
    watch,
    formState: { errors },
  } = useForm<PortalUserFormValues>({
    defaultValues: mapPortalUserToValues(currentUser),
  })
  const mode = watch('mode')

  useEffect(() => {
    if (open) {
      reset(mapPortalUserToValues(currentUser))
    }
  }, [currentUser, open, reset])

  return (
    <Dialog open={open} onClose={onClose} title={<CardTitle>{currentUser ? 'Edit Portal User' : 'Create Portal User'}</CardTitle>}>
      <form className="form-grid" onSubmit={handleSubmit(onSubmit)}>
        {!currentUser ? (
          <label className="field">
            <span>User Source</span>
            <Select {...register('mode')}>
              <option value="existing">Link existing user</option>
              <option value="new">Create new user</option>
            </Select>
          </label>
        ) : null}

        {mode === 'existing' && !currentUser ? (
          <label className="field">
            <span>User ID</span>
            <Input type="number" {...register('user_id', { valueAsNumber: true })} />
            <FieldError error={errors.user_id?.message ?? getFieldError('user_id')} />
          </label>
        ) : null}

        {mode === 'new' || currentUser ? (
          <>
            <label className="field">
              <span>Name</span>
              <Input {...register('name')} />
              <FieldError error={errors.name?.message ?? getFieldError('name')} />
            </label>
            <label className="field">
              <span>Email</span>
              <Input {...register('email')} />
              <FieldError error={errors.email?.message ?? getFieldError('email')} />
            </label>
          </>
        ) : null}

        {mode === 'new' || currentUser ? (
          <>
            <label className="field">
              <span>Password</span>
              <Input type="password" {...register('password')} />
              <FieldError error={errors.password?.message ?? getFieldError('password')} />
            </label>
            <label className="field">
              <span>Password Confirmation</span>
              <Input type="password" {...register('password_confirmation')} />
              <FieldError error={errors.password_confirmation?.message ?? getFieldError('password_confirmation')} />
            </label>
          </>
        ) : null}

        <label className="field">
          <span>Role</span>
          <Select {...register('role')}>
            <option value="owner">owner</option>
            <option value="manager">manager</option>
            <option value="staff">staff</option>
          </Select>
          <FieldError error={errors.role?.message ?? getFieldError('role')} />
        </label>

        <label className="field">
          <span>Status</span>
          <Select {...register('status')}>
            <option value="active">active</option>
            <option value="suspended">suspended</option>
          </Select>
          <FieldError error={errors.status?.message ?? getFieldError('status')} />
        </label>

        {formError ? <div className="form-error">{formError}</div> : null}

        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {currentUser ? 'Save Portal User' : 'Create Portal User'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

export function MerchantPortalUsersPanel({ merchantId }: { merchantId: string }) {
  const queryClient = useQueryClient()
  const [portalUserInForm, setPortalUserInForm] = useState<MerchantPortalUser | null>(null)
  const [selectedPortalUserId, setSelectedPortalUserId] = useState<number | null>(null)
  const [pendingAction, setPendingAction] = useState<{ kind: 'delete' | 'suspend' | 'activate'; user: MerchantPortalUser } | null>(null)
  const usersQuery = useQuery({
    queryKey: ['merchant-profile', merchantId, 'portal-users'],
    queryFn: () => listMerchantPortalUsers(merchantId),
  })
  const detailsQuery = useQuery({
    queryKey: ['merchant-profile', merchantId, 'portal-users', selectedPortalUserId],
    queryFn: () => getMerchantPortalUser(merchantId, selectedPortalUserId!),
    enabled: Boolean(selectedPortalUserId),
  })
  const saveMutation = useMutation({
    mutationFn: ({ portalUserId, payload }: { portalUserId?: number; payload: CreateMerchantPortalUserPayload | UpdateMerchantPortalUserPayload }) => (
      portalUserId
        ? updateMerchantPortalUser(merchantId, portalUserId, payload)
        : createMerchantPortalUser(merchantId, payload as CreateMerchantPortalUserPayload)
    ),
    onSuccess: async () => {
      setPortalUserInForm(null)
      await queryClient.invalidateQueries({ queryKey: ['merchant-profile', merchantId, 'portal-users'] })
    },
  })
  const actionMutation = useMutation({
    mutationFn: async ({ kind, portalUserId }: { kind: 'delete' | 'suspend' | 'activate'; portalUserId: number }) => {
      switch (kind) {
        case 'delete':
          return deleteMerchantPortalUser(merchantId, portalUserId)
        case 'suspend':
          return suspendMerchantPortalUser(merchantId, portalUserId)
        case 'activate':
          return activateMerchantPortalUser(merchantId, portalUserId)
      }
    },
    onSuccess: async () => {
      setPendingAction(null)
      await queryClient.invalidateQueries({ queryKey: ['merchant-profile', merchantId, 'portal-users'] })
      if (selectedPortalUserId) {
        await detailsQuery.refetch()
      }
    },
  })

  const portalUsers = usersQuery.data?.data ?? []

  return (
    <div className="page-stack">
      <Card>
        <CardHeader>
          <div className="section-title-row">
            <div>
              <CardTitle>Portal Users</CardTitle>
              <CardDescription>Admin-only management for merchant portal memberships in this admin frontend.</CardDescription>
            </div>
            <Can permission={PERMISSIONS.MERCHANT_PORTAL_USERS_MANAGE}>
              <Button type="button" variant="secondary" onClick={() => setPortalUserInForm({} as MerchantPortalUser)}>
                Add Portal User
              </Button>
            </Can>
          </div>
        </CardHeader>
        <CardContent>
          {usersQuery.isLoading ? <LoadingState title="Loading portal users" /> : null}
          {usersQuery.isError ? <ErrorState title="Unable to load portal users" message={getApiErrorMessage(usersQuery.error)} onRetry={() => void usersQuery.refetch()} /> : null}
          {!usersQuery.isLoading && !usersQuery.isError && !portalUsers.length ? (
            <EmptyState title="No portal users" description="No merchant portal users have been linked yet." />
          ) : null}
          {portalUsers.length ? (
            <TableContainer>
              <Table variant="compact">
                <thead>
                  <tr>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </tr>
                </thead>
                <tbody>
                  {portalUsers.map((portalUser) => (
                    <tr key={portalUser.id}>
                      <TableCell>
                        <Button type="button" variant="ghost" onClick={() => setSelectedPortalUserId(portalUser.id)}>
                          {portalUser.name ?? `User #${portalUser.user_id ?? portalUser.id}`}
                        </Button>
                      </TableCell>
                      <TableCell>{portalUser.email ?? '-'}</TableCell>
                      <TableCell>{pickDisplayLabel(portalUser.role, portalUser.portal_role_label)}</TableCell>
                      <TableCell>
                        <StatusBadge value={portalUser.status}>
                          {pickDisplayLabel(portalUser.status, portalUser.portal_status_label)}
                        </StatusBadge>
                      </TableCell>
                      <TableCell>{formatDate(portalUser.created_at)}</TableCell>
                      <TableCell>
                        <div className="page-header__button-row">
                          <Can permission={PERMISSIONS.MERCHANT_PORTAL_USERS_MANAGE}>
                            <Button type="button" variant="secondary" onClick={() => setPortalUserInForm(portalUser)}>
                              Edit
                            </Button>
                          </Can>
                          <Can permission={PERMISSIONS.MERCHANT_PORTAL_USERS_MANAGE}>
                            {portalUser.status === 'active' ? (
                              <Button type="button" variant="secondary" onClick={() => setPendingAction({ kind: 'suspend', user: portalUser })}>
                                Suspend
                              </Button>
                            ) : (
                              <Button type="button" variant="secondary" onClick={() => setPendingAction({ kind: 'activate', user: portalUser })}>
                                Activate
                              </Button>
                            )}
                          </Can>
                          <Can permission={PERMISSIONS.MERCHANT_PORTAL_USERS_MANAGE}>
                            <Button type="button" variant="danger" onClick={() => setPendingAction({ kind: 'delete', user: portalUser })}>
                              Delete
                            </Button>
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

      <MerchantPortalUserDialog
        currentUser={portalUserInForm?.id ? portalUserInForm : null}
        error={saveMutation.error}
        isSubmitting={saveMutation.isPending}
        onClose={() => setPortalUserInForm(null)}
        onSubmit={(values) => {
          const payload: CreateMerchantPortalUserPayload | UpdateMerchantPortalUserPayload = values.mode === 'existing' && !portalUserInForm?.id
            ? {
                user_id: values.user_id,
                role: values.role,
                status: values.status,
              }
            : {
                name: values.name || undefined,
                email: values.email || undefined,
                password: values.password || undefined,
                password_confirmation: values.password_confirmation || undefined,
                role: values.role,
                status: values.status,
              }

          saveMutation.mutate({
            portalUserId: portalUserInForm?.id,
            payload,
          })
        }}
        open={Boolean(portalUserInForm)}
      />

      <Dialog open={Boolean(selectedPortalUserId)} onClose={() => setSelectedPortalUserId(null)} title={<CardTitle>Portal User Details</CardTitle>}>
        {detailsQuery.isLoading ? <LoadingState title="Loading portal user details" /> : null}
        {detailsQuery.isError ? <ErrorState title="Unable to load portal user details" message={getApiErrorMessage(detailsQuery.error)} onRetry={() => void detailsQuery.refetch()} /> : null}
        {detailsQuery.data ? (
          <dl className="detail-list">
            <div><dt>Name</dt><dd>{detailsQuery.data.data.name ?? '-'}</dd></div>
            <div><dt>Email</dt><dd>{detailsQuery.data.data.email ?? '-'}</dd></div>
            <div><dt>Role</dt><dd>{pickDisplayLabel(detailsQuery.data.data.role, detailsQuery.data.data.portal_role_label)}</dd></div>
            <div><dt>Status</dt><dd><StatusBadge value={detailsQuery.data.data.status}>{pickDisplayLabel(detailsQuery.data.data.status, detailsQuery.data.data.portal_status_label)}</StatusBadge></dd></div>
            <div><dt>Created</dt><dd>{formatDate(detailsQuery.data.data.created_at)}</dd></div>
          </dl>
        ) : null}
      </Dialog>

      <ConfirmActionModal
        open={Boolean(pendingAction)}
        title={pendingAction ? `${pendingAction.kind.charAt(0).toUpperCase()}${pendingAction.kind.slice(1)} portal user` : 'Portal user action'}
        description={pendingAction ? `${pendingAction.kind.charAt(0).toUpperCase()}${pendingAction.kind.slice(1)} ${pendingAction.user.name ?? pendingAction.user.email ?? `user #${pendingAction.user.id}`}?` : ''}
        confirmLabel={pendingAction ? `${pendingAction.kind.charAt(0).toUpperCase()}${pendingAction.kind.slice(1)}` : 'Confirm'}
        variant={pendingAction?.kind === 'delete' ? 'danger' : 'default'}
        loading={actionMutation.isPending}
        onCancel={() => setPendingAction(null)}
        onConfirm={() => {
          if (pendingAction) {
            actionMutation.mutate({ kind: pendingAction.kind, portalUserId: pendingAction.user.id })
          }
        }}
      />
    </div>
  )
}
