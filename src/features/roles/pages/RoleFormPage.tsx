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
import { ErrorState } from '../../../shared/components/feedback/ErrorState'
import { LoadingState } from '../../../shared/components/feedback/LoadingState'
import { Button } from '../../../shared/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../shared/components/ui/Card'
import { PageHeader } from '../../../shared/components/ui/PageHeader'

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
    <section className="page-section">
      <PageHeader
        title={mode === 'create' ? 'Create Role' : 'Edit Role'}
        description={mode === 'create' ? 'Create a custom role.' : roleQuery.data?.data.name ?? ''}
        actions={
          <Link className="ui-link-reset" to={mode === 'create' ? '/admin/roles' : `/admin/roles/${roleId}`}>
            <Button variant="secondary">{t('Back')}</Button>
          </Link>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>{t('Role Details')}</CardTitle>
        </CardHeader>
        <CardContent>
          <RoleForm
            defaultValues={roleQuery.data?.data}
            error={mutation.error}
            groupedPermissions={groupedPermissionsQuery.data?.data ?? []}
            isEdit={mode === 'edit'}
            isSubmitting={mutation.isPending}
            submitLabel={mode === 'create' ? 'Create Role' : 'Save Role'}
            onSubmit={(values) => mutation.mutate(values)}
          />
        </CardContent>
      </Card>
    </section>
  )
}
