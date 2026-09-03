import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  activateMerchantUser,
  createMerchantUser,
  deleteMerchantUser,
  listMerchantUsers,
  suspendMerchantUser,
  updateMerchantUser,
} from '../api/merchantPortalUsers.api'
import type { MerchantPortalUser } from '../../../merchants/types/merchant.types'
import { ConfirmActionModal } from '../../../../shared/components/modals/ConfirmActionModal'
import { EmptyState } from '../../../../shared/components/states/EmptyState'
import { ErrorState } from '../../../../shared/components/states/ErrorState'
import { LoadingState } from '../../../../shared/components/states/LoadingState'
import { Button } from '../../../../shared/components/ui/Button'
import { Card, CardContent } from '../../../../shared/components/ui/Card'
import { StatusBadge } from '../../../../shared/components/ui/StatusBadge'
import { Table, TableContainer, TableHead } from '../../../../shared/components/ui/Table'
import { PageHeader } from '../../../../shared/components/ui/PageHeader'
import { MerchantUserDialog } from '../components/MerchantUserDialog'
import { useMerchantPortalContext } from '../../context/merchantPortal.context'

export function MerchantUsersPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { hasMerchantCapability } = useMerchantPortalContext()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<MerchantPortalUser | null>(null)
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<MerchantPortalUser | null>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['merchant-portal-users'],
    queryFn: () => listMerchantUsers(),
  })

  const createMutation = useMutation({
    mutationFn: createMerchantUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant-portal-users'] })
      setIsDialogOpen(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: any }) => updateMerchantUser(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant-portal-users'] })
      setIsDialogOpen(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteMerchantUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant-portal-users'] })
      setDeleteConfirmUser(null)
    },
  })

  const suspendMutation = useMutation({
    mutationFn: suspendMerchantUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant-portal-users'] })
    },
  })

  const activateMutation = useMutation({
    mutationFn: activateMerchantUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant-portal-users'] })
    },
  })

  const handleEditClick = (user: MerchantPortalUser) => {
    setSelectedUser(user)
    setIsDialogOpen(true)
  }

  const handleCreateClick = () => {
    setSelectedUser(null)
    setIsDialogOpen(true)
  }

  const handleSubmit = (values: any) => {
    const payload = { ...values }
    if (payload.mode === 'new') {
      delete payload.user_id
    }
    
    // For updates, the backend prohibits user_id, and we only send role/status
    // or name/email/password if supported. But the dialog right now doesn't edit name/email.
    // Actually if selectedUser exists, it's an update. We should delete mode and user_id.
    delete payload.mode
    if (selectedUser) {
      delete payload.user_id
      delete payload.name
      delete payload.email
      delete payload.password
      delete payload.password_confirmation
      updateMutation.mutate({ id: selectedUser.id, payload })
    } else {
      // For create existing user, we need user_id but not name/email/password
      if (values.mode === 'existing') {
        delete payload.name
        delete payload.email
        delete payload.password
        delete payload.password_confirmation
      }
      createMutation.mutate(payload)
    }
  }

  const handleDelete = () => {
    if (deleteConfirmUser) {
      deleteMutation.mutate(deleteConfirmUser.id)
    }
  }

  if (isLoading) return <LoadingState />
  if (error) return <ErrorState message={(error as Error).message} />

  const users = data?.data ?? []
  const canManage = hasMerchantCapability('users.manage')

  return (
    <div className="page-container">
      <PageHeader
        title={t('Portal Users', { defaultValue: 'Portal Users' })}
        description={t('Manage access to your merchant portal.', { defaultValue: 'Manage access to your merchant portal.' })}
        actions={
          canManage ? (
            <Button onClick={handleCreateClick}>{t('Add User', { defaultValue: 'Add User' })}</Button>
          ) : null
        }
      />

      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <thead>
                <tr>
                  <TableHead>{t('Name', { defaultValue: 'Name' })}</TableHead>
                  <TableHead>{t('Email', { defaultValue: 'Email' })}</TableHead>
                  <TableHead>{t('Role', { defaultValue: 'Role' })}</TableHead>
                  <TableHead>{t('Status', { defaultValue: 'Status' })}</TableHead>
                  
                  {canManage && <th style={{ textAlign: 'right' }}>{t('Actions', { defaultValue: 'Actions' })}</th>}
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={canManage ? 6 : 5}>
                      <EmptyState
                        title={t('No users found', { defaultValue: 'No users found' })}
                        description={t('Get started by creating a new portal user.', { defaultValue: 'Get started by creating a new portal user.' })}
                        action={canManage ? <Button onClick={handleCreateClick}>{t('Add User', { defaultValue: 'Add User' })}</Button> : undefined}
                      />
                    </td>
                  </tr>
                ) : (
                  users.map((user: MerchantPortalUser) => (
                    <tr key={user.id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>
                        <span style={{ textTransform: 'capitalize' }}>{user.role.replace('_', ' ')}</span>
                      </td>
                      <td>
                        <StatusBadge value={user.status} />
                      </td>
                      
                      {canManage && (
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <Button size="sm" variant="secondary" onClick={() => handleEditClick(user)}>
                              {t('Edit', { defaultValue: 'Edit' })}
                            </Button>
                            {user.status === 'active' ? (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => suspendMutation.mutate(user.id)}
                                loading={suspendMutation.isPending}
                              >
                                {t('Suspend', { defaultValue: 'Suspend' })}
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => activateMutation.mutate(user.id)}
                                loading={activateMutation.isPending}
                              >
                                {t('Activate', { defaultValue: 'Activate' })}
                              </Button>
                            )}
                            <Button size="sm" variant="danger" onClick={() => setDeleteConfirmUser(user)}>
                              {t('Remove', { defaultValue: 'Remove' })}
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <MerchantUserDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        currentUser={selectedUser}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        error={createMutation.error || updateMutation.error}
      />

      <ConfirmActionModal
        open={!!deleteConfirmUser}
        onCancel={() => setDeleteConfirmUser(null)}
        onConfirm={handleDelete}
        title={t('Remove User', { defaultValue: 'Remove User' })}
        description={t('Are you sure you want to remove this user from the merchant portal? They will no longer have access.', { defaultValue: 'Are you sure you want to remove this user from the merchant portal? They will no longer have access.' })}
        confirmLabel={t('Remove', { defaultValue: 'Remove' })}
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
