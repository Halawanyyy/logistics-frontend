import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { UserCog } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { assignUserRole, getUser, updateUser } from '../api/users.api'
import { UserForm, type UserFormValues } from '../components/UserForm'
import { getApiErrorMessage } from '../../../shared/api/api-error'
import { FormPageLayout } from '../../../shared/components/forms/FormPageLayout'
import { ErrorState } from '../../../shared/components/feedback/ErrorState'
import { LoadingState } from '../../../shared/components/feedback/LoadingState'
import { Button } from '../../../shared/components/ui/Button'
import { listRoles } from '../../roles/api/roles.api'

export function EditUserPage() {
  const { t } = useTranslation()
  const { userId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: ['users', userId],
    queryFn: () => getUser(userId!),
    enabled: Boolean(userId),
  })
  const rolesQuery = useQuery({
    queryKey: ['roles', 'user-form'],
    queryFn: listRoles,
  })
  const mutation = useMutation({
    mutationFn: async (values: UserFormValues) => {
      const response = await updateUser(userId!, {
        name: values.name,
        email: values.email,
        password: values.password || undefined,
      })

      if (values.role_id && values.role_id !== response.data.role_id) {
        await assignUserRole(userId!, { role_id: values.role_id })
      }

      return response
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] })
      await queryClient.invalidateQueries({ queryKey: ['users', userId] })
      navigate(`/admin/users/${userId}`)
    },
  })

  if (query.isLoading || rolesQuery.isLoading) {
    return <LoadingState title={t('Loading user', { defaultValue: 'Loading user' })} />
  }

  if (query.isError || !query.data || rolesQuery.isError || !rolesQuery.data) {
    return <ErrorState message={getApiErrorMessage(query.error ?? rolesQuery.error)} onRetry={() => { void query.refetch(); void rolesQuery.refetch() }} />
  }

  return (
    <FormPageLayout
      backLabel="Back to user"
      backTo={`/admin/users/${userId}`}
      description={query.data.data.name}
      eyebrow={t('Users', { defaultValue: 'Users' })}
      sectionIcon={<UserCog size={18} />}
      sectionDescription={t('Update identity details and role assignment while keeping the current permission flow intact.', {
        defaultValue: 'Update identity details and role assignment while keeping the current permission flow intact.',
      })}
      sectionTitle={t('User Details')}
      title={t('Edit User')}
    >
      <UserForm
        defaultValues={query.data.data}
        error={mutation.error}
        isEdit
        isSubmitting={mutation.isPending}
        roles={rolesQuery.data.data}
        secondaryAction={(
          <Link className="ui-link-reset" to={`/admin/users/${userId}`}>
            <Button variant="secondary">{t('Cancel', { defaultValue: 'Cancel' })}</Button>
          </Link>
        )}
        submitLabel={t('Save User', { defaultValue: 'Save User' })}
        onSubmit={(values) => mutation.mutate(values)}
      />
    </FormPageLayout>
  )
}
