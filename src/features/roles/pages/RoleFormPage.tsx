import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  createRole,
  getRole,
  listGroupedPermissions,
  syncRolePermissions,
  updateRole,
} from '../api/roles.api'
import { RoleForm } from '../components/RoleForm'
import { getApiErrorMessage } from '../../../shared/api/api-error'
import { FormPageLayout } from '../../../shared/components/forms/FormPageLayout'
import { ErrorState } from '../../../shared/components/feedback/ErrorState'
import { LoadingState } from '../../../shared/components/feedback/LoadingState'
import { Button } from '../../../shared/components/ui/Button'

type RoleFormPageProps = {
  mode: 'create' | 'edit'
}

export function RoleFormPage({ mode }: RoleFormPageProps) {
  const { t } = useTranslation()
  const { roleId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const roleQuery = useQuery({
    queryKey: ['roles', roleId],
    queryFn: () => getRole(roleId!),
    enabled: mode === 'edit' && Boolean(roleId),
  })
  const groupedPermissionsQuery = useQuery({
    queryKey: ['permissions', 'grouped'],
    queryFn: listGroupedPermissions,
  })

  const mutation = useMutation({
    mutationFn: async (values: Parameters<typeof RoleForm>[0]['onSubmit'] extends (arg: infer T) => void ? T : never) => {
      if (mode === 'create') {
        return createRole(values)
      }

      const roleResponse = await updateRole(roleId!, {
        name: values.name,
        slug: values.slug,
        description: values.description,
        status: values.status,
      })
      await syncRolePermissions(roleId!, { permissions: values.permissions })
      return roleResponse
    },
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({ queryKey: ['roles'] })
      await queryClient.invalidateQueries({ queryKey: ['roles', response.data.id] })
      navigate(`/admin/roles/${response.data.id}`)
    },
  })

  if (groupedPermissionsQuery.isLoading || (mode === 'edit' && roleQuery.isLoading)) {
    return <LoadingState title={t('Loading role form')} />
  }

  if (groupedPermissionsQuery.isError || (mode === 'edit' && (roleQuery.isError || !roleQuery.data))) {
    return (
      <ErrorState
        message={getApiErrorMessage(groupedPermissionsQuery.error ?? roleQuery.error)}
        onRetry={() => {
          void groupedPermissionsQuery.refetch()
          void roleQuery.refetch()
        }}
      />
    )
  }

  return (
    <FormPageLayout
      backTo={mode === 'create' ? '/admin/roles' : `/admin/roles/${roleId}`}
      description={mode === 'create'
        ? t('Create a custom role with the right grouped permissions for your team.', {
          defaultValue: 'Create a custom role with the right grouped permissions for your team.',
        })
        : roleQuery.data?.data.name ?? ''}
      eyebrow={t('Roles', { defaultValue: 'Roles' })}
      sectionDescription={t('Define the role identity first, then assign permissions through the grouped permission picker below.', {
        defaultValue: 'Define the role identity first, then assign permissions through the grouped permission picker below.',
      })}
      sectionTitle={t('Role Details')}
      title={mode === 'create' ? 'Create Role' : 'Edit Role'}
    >
      <RoleForm
        defaultValues={roleQuery.data?.data}
        error={mutation.error}
        groupedPermissions={groupedPermissionsQuery.data?.data ?? []}
        isEdit={mode === 'edit'}
        isSubmitting={mutation.isPending}
        secondaryAction={(
          <Link className="ui-link-reset" to={mode === 'create' ? '/admin/roles' : `/admin/roles/${roleId}`}>
            <Button variant="secondary">{t('Cancel', { defaultValue: 'Cancel' })}</Button>
          </Link>
        )}
        submitLabel={mode === 'create' ? 'Create Role' : 'Save Role'}
        onSubmit={(values) => mutation.mutate(values)}
      />
    </FormPageLayout>
  )
}
