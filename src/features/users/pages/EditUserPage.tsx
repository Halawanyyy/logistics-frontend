import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { assignUserRole, getUser, updateUser } from '../api/users.api'
import { UserForm, type UserFormValues } from '../components/UserForm'
import { getApiErrorMessage } from '../../../shared/api/api-error'
import { ErrorState } from '../../../shared/components/feedback/ErrorState'
import { LoadingState } from '../../../shared/components/feedback/LoadingState'
import { Button } from '../../../shared/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../shared/components/ui/Card'
import { PageHeader } from '../../../shared/components/ui/PageHeader'
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
    <section className="page-section">
      <PageHeader
        title={t('Edit User')}
        description={query.data.data.name}
        actions={
          <Link className="ui-link-reset" to={`/admin/users/${userId}`}>
            <Button variant="secondary">{t('Back to user')}</Button>
          </Link>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>{t('User Details')}</CardTitle>
        </CardHeader>
        <CardContent>
          <UserForm
            defaultValues={query.data.data}
            error={mutation.error}
            isEdit
            isSubmitting={mutation.isPending}
            roles={rolesQuery.data.data}
            submitLabel={t('Save User', { defaultValue: 'Save User' })}
            onSubmit={(values) => mutation.mutate(values)}
          />
        </CardContent>
      </Card>
    </section>
  )
}
