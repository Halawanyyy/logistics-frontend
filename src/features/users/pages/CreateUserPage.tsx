import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { createUser } from '../api/users.api'
import { UserForm, type UserFormValues } from '../components/UserForm'
import { listRoles } from '../../roles/api/roles.api'
import { getApiErrorMessage } from '../../../shared/api/api-error'
import { ErrorState } from '../../../shared/components/feedback/ErrorState'
import { LoadingState } from '../../../shared/components/feedback/LoadingState'
import { Button } from '../../../shared/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../shared/components/ui/Card'
import { PageHeader } from '../../../shared/components/ui/PageHeader'

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
    <section className="page-section">
      <PageHeader
        title={t('Create User')}
        description={t('Create an internal account.')}
        actions={
          <Link className="ui-link-reset" to="/admin/users">
            <Button variant="secondary">{t('Back to users')}</Button>
          </Link>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>{t('User Details')}</CardTitle>
        </CardHeader>
        <CardContent>
          <UserForm
            error={mutation.error}
            isSubmitting={mutation.isPending}
            roles={rolesQuery.data.data}
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
        </CardContent>
      </Card>
    </section>
  )
}
