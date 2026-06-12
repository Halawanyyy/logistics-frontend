import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { UserCog } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { createUser } from '../api/users.api'
import { UserForm, type UserFormValues } from '../components/UserForm'
import { listRoles } from '../../roles/api/roles.api'
import { getApiErrorMessage } from '../../../shared/api/api-error'
import { FormPageLayout } from '../../../shared/components/forms/FormPageLayout'
import { ErrorState } from '../../../shared/components/feedback/ErrorState'
import { LoadingState } from '../../../shared/components/feedback/LoadingState'
import { Button } from '../../../shared/components/ui/Button'

export function CreateUserPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const rolesQuery = useQuery({
    queryKey: ['roles', 'user-form'],
    queryFn: listRoles,
  })
  const mutation = useMutation({
    mutationFn: createUser,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] })
      navigate('/admin/users')
    },
  })

  if (rolesQuery.isLoading) {
    return <LoadingState title={t('Loading roles')} />
  }

  if (rolesQuery.isError || !rolesQuery.data) {
    return <ErrorState message={getApiErrorMessage(rolesQuery.error)} onRetry={() => void rolesQuery.refetch()} />
  }

  return (
    <FormPageLayout
      backLabel="Back to users"
      backTo="/admin/users"
      description={t('Create an internal account with the right role assignment for day-to-day admin work.', {
        defaultValue: 'Create an internal account with the right role assignment for day-to-day admin work.',
      })}
      eyebrow={t('Users', { defaultValue: 'Users' })}
      sectionIcon={<UserCog size={18} />}
      sectionDescription={t('Fill in the login identity and choose the role this team member should receive.', {
        defaultValue: 'Fill in the login identity and choose the role this team member should receive.',
      })}
      sectionTitle={t('User Details')}
      title={t('Create User')}
    >
      <UserForm
        error={mutation.error}
        isSubmitting={mutation.isPending}
        roles={rolesQuery.data.data}
        secondaryAction={(
          <Link className="ui-link-reset" to="/admin/users">
            <Button variant="secondary">{t('Cancel', { defaultValue: 'Cancel' })}</Button>
          </Link>
        )}
        submitLabel={t('Create User')}
        onSubmit={(values: UserFormValues) =>
          mutation.mutate({
            name: values.name,
            email: values.email,
            password: values.password ?? '',
            role_id: values.role_id ?? undefined,
          })
        }
      />
    </FormPageLayout>
  )
}
