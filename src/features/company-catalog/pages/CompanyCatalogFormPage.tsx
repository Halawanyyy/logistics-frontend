import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Boxes } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  createCompanyCatalogItem,
  getCompanyCatalogItem,
  updateCompanyCatalogItem,
} from '../api/companyCatalog.api'
import {
  CompanyCatalogItemForm,
} from '../components/CompanyCatalogItemForm'
import type { CreateCompanyCatalogItemRequest } from '../types/companyCatalog.types'
import { getApiErrorMessage, isApiNotFound } from '../../../shared/api/api-error'
import { FormPageLayout } from '../../../shared/components/forms/FormPageLayout'
import { Button } from '../../../shared/components/ui/Button'
import { ErrorState } from '../../../shared/components/states/ErrorState'
import { LoadingState } from '../../../shared/components/states/LoadingState'
import { NotFoundState } from '../../../shared/components/states/NotFoundState'
import { adminPath } from '../../../shared/routing/paths'

type CompanyCatalogFormPageProps = {
  mode: 'create' | 'edit'
}

export function CompanyCatalogFormPage({ mode }: CompanyCatalogFormPageProps) {
  const { t } = useTranslation()
  const { companyCatalogItemId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = mode === 'edit'

  const itemQuery = useQuery({
    queryKey: ['company-catalog-items', companyCatalogItemId],
    queryFn: () => getCompanyCatalogItem(companyCatalogItemId!),
    enabled: isEdit && Boolean(companyCatalogItemId),
  })

  const mutation = useMutation({
    mutationFn: (values: CreateCompanyCatalogItemRequest) => (
      isEdit
        ? updateCompanyCatalogItem(companyCatalogItemId!, values)
        : createCompanyCatalogItem(values)
    ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['company-catalog-items'] })
      if (companyCatalogItemId) {
        await queryClient.invalidateQueries({ queryKey: ['company-catalog-items', companyCatalogItemId] })
      }
      navigate(adminPath('/company-catalog'))
    },
  })

  if (isEdit && itemQuery.isLoading) {
    return <LoadingState title={t('Loading company catalog item', { defaultValue: 'Loading company catalog item' })} />
  }

  if (isEdit && itemQuery.isError && isApiNotFound(itemQuery.error)) {
    return (
      <NotFoundState
        title={t('Company catalog item not found', { defaultValue: 'Company catalog item not found' })}
        description={t('The requested company catalog item could not be found in the API.', {
          defaultValue: 'The requested company catalog item could not be found in the API.',
        })}
      />
    )
  }

  if (isEdit && (itemQuery.isError || !itemQuery.data)) {
    return <ErrorState message={getApiErrorMessage(itemQuery.error)} onRetry={() => void itemQuery.refetch()} />
  }

  return (
    <FormPageLayout
      backLabel={t('Back to company catalog', { defaultValue: 'Back to company catalog' })}
      backTo={adminPath('/company-catalog')}
      description={isEdit
        ? itemQuery.data?.data.name ?? ''
        : t('Create company-owned packaging products and service items without changing the backend contract.', {
          defaultValue: 'Create company-owned packaging products and service items without changing the backend contract.',
        })}
      eyebrow={t('Company Catalog', { defaultValue: 'Company Catalog' })}
      sectionIcon={<Boxes size={18} />}
      sectionDescription={t('Capture the catalog item identity, pricing, dimensions, and merchant visibility before saving.', {
        defaultValue: 'Capture the catalog item identity, pricing, dimensions, and merchant visibility before saving.',
      })}
      sectionTitle={t('Catalog Item Details', { defaultValue: 'Catalog Item Details' })}
      title={t(isEdit ? 'Edit Company Catalog Item' : 'Create Company Catalog Item', {
        defaultValue: isEdit ? 'Edit Company Catalog Item' : 'Create Company Catalog Item',
      })}
    >
      <CompanyCatalogItemForm
        defaultValues={itemQuery.data?.data}
        error={mutation.error}
        isSubmitting={mutation.isPending}
        secondaryAction={(
          <Link className="ui-link-reset" to={adminPath('/company-catalog')}>
            <Button variant="secondary">{t('Cancel', { defaultValue: 'Cancel' })}</Button>
          </Link>
        )}
        submitLabel={t(isEdit ? 'Save Company Catalog Item' : 'Create Company Catalog Item', {
          defaultValue: isEdit ? 'Save Company Catalog Item' : 'Create Company Catalog Item',
        })}
        onSubmit={(values) => mutation.mutate(values)}
      />
    </FormPageLayout>
  )
}
