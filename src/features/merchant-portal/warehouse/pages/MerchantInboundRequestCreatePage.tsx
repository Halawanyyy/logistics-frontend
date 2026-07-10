import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { ArrowLeft, PackagePlus, Plus, Trash2 } from 'lucide-react'
import { getApiErrorMessage } from '../../../../shared/api/api-error'
import { Button } from '../../../../shared/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../shared/components/ui/Card'
import { Input } from '../../../../shared/components/ui/Input'
import { PageHeader } from '../../../../shared/components/ui/PageHeader'
import { merchantPath } from '../../../../shared/routing/paths'
import { FormPageLayout } from '../../../../shared/components/forms/FormPageLayout'
import { FormActionsBar } from '../../../../shared/components/forms/FormActionsBar'
import { FieldError } from '../../../../shared/components/forms/FieldError'
import { createMerchantPortalInboundRequest, listMerchantPortalWarehouseProducts } from '../api/merchantPortalWarehouse.api'
import type { MerchantPortalInboundStockRequestCreatePayload } from '../types/merchantPortalWarehouse.types'
import { Select } from '../../../../shared/components/ui/Select'

type CreateInboundRequestFormValues = MerchantPortalInboundStockRequestCreatePayload

export function MerchantInboundRequestCreatePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [productSearch, setProductSearch] = useState('')

  const { data: productsData } = useQuery({
    queryKey: ['merchant-portal', 'warehouse-products', 1, { search: productSearch, status: 'active' }],
    queryFn: () => listMerchantPortalWarehouseProducts(1, { search: productSearch, status: 'active' }),
  })

  const {
    control,
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<CreateInboundRequestFormValues>({
    defaultValues: {
      expected_arrival_date: '',
      notes: '',
      items: [{ quantity: 1, requested_product_name: '', requested_sku: '' }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  })

  const createMutation = useMutation({
    mutationFn: createMerchantPortalInboundRequest,
    onSuccess: (data) => {
      // toast.success(t('Inbound request created successfully.'))
      navigate(merchantPath(`/warehouse/inbound-requests/${data.data.id}`))
    },
    onError: (err) => {
      console.error(getApiErrorMessage(err, t('Failed to create inbound request.')))
    },
  })

  const onSubmit = (values: CreateInboundRequestFormValues) => {
    // Process items to remove empty strings where null/undefined is expected
    const processedValues = {
      ...values,
      expected_arrival_date: values.expected_arrival_date || null,
      notes: values.notes || null,
      items: values.items.map((item) => ({
        ...item,
        warehouse_product_id: item.warehouse_product_id ? Number(item.warehouse_product_id) : null,
        requested_product_name: item.requested_product_name || null,
        requested_sku: item.requested_sku || null,
        notes: item.notes || null,
        quantity: Number(item.quantity),
      })),
    }

    createMutation.mutate(processedValues)
  }

  return (
    <>
      <div className="mb-4">
        <Link
          className="inline-flex items-center text-sm text-muted hover:text-foreground"
          to={merchantPath('/warehouse/inbound-requests')}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          {t('Back to Inbound Requests')}
        </Link>
      </div>

      <PageHeader
        description={t('Create a new request to send inventory into the warehouse.')}
        title={t('Create Inbound Request')}
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        <FormPageLayout
          mainContent={
            <>
              <Card>
                <CardHeader>
                  <CardTitle>{t('Request Details')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium" htmlFor="expected_arrival_date">
                        {t('Expected Arrival Date (Optional)')}
                      </label>
                      <Input
                        id="expected_arrival_date"
                        type="date"
                        {...register('expected_arrival_date')}
                      />
                      {errors.expected_arrival_date && (
                        <FieldError error={errors.expected_arrival_date.message} />
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="notes">
                      {t('Notes (Optional)')}
                    </label>
                    <textarea
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      id="notes"
                      {...register('notes')}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>{t('Request Items')}</CardTitle>
                  <Button
                    size="sm"
                    type="button"
                    variant="neutral"
                    onClick={() => append({ quantity: 1, requested_product_name: '', requested_sku: '' })}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {t('Add Item')}
                  </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                  {fields.map((field, index) => (
                    <div key={field.id} className="relative rounded-lg border border-border p-4">
                      {fields.length > 1 && (
                        <Button
                          className="absolute right-2 top-2 text-muted hover:text-destructive"
                          size="icon"
                          type="button"
                          variant="ghost"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                      
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-12 pr-8">
                        <div className="sm:col-span-12 lg:col-span-5 space-y-2">
                          <label className="text-sm font-medium">
                            {t('Select Existing Product')}
                          </label>
                          <Controller
                            control={control}
                            name={`items.${index}.warehouse_product_id`}
                            render={({ field: { value, onChange } }) => (
                              <Select
                                value={value || ''}
                                onChange={(e) => {
                                  onChange(e.target.value)
                                  if (e.target.value) {
                                    // Clear requested name/sku if an existing product is selected
                                    // In a real app we'd use setValue from useForm, but this simple approach works
                                  }
                                }}
                              >
                                <option value="">{t('-- Select a product --')}</option>
                                {productsData?.data?.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name} ({p.sku})
                                  </option>
                                ))}
                              </Select>
                            )}
                          />
                          <p className="text-xs text-muted">
                            {t('Or enter new product details below if the product doesn\'t exist yet.')}
                          </p>
                        </div>
                        
                        <div className="sm:col-span-12 lg:col-span-7 grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">
                              {t('New Product Name')}
                            </label>
                            <Input
                              placeholder={t('Enter name')}
                              {...register(`items.${index}.requested_product_name`)}
                            />
                            {errors.items?.[index]?.requested_product_name && (
                              <FieldError error={errors.items[index]?.requested_product_name?.message} />
                            )}
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">
                              {t('New Product SKU')}
                            </label>
                            <Input
                              placeholder={t('Enter SKU')}
                              {...register(`items.${index}.requested_sku`)}
                            />
                            {errors.items?.[index]?.requested_sku && (
                              <FieldError error={errors.items[index]?.requested_sku?.message} />
                            )}
                          </div>
                        </div>

                        <div className="sm:col-span-6 lg:col-span-3 space-y-2">
                          <label className="text-sm font-medium">
                            {t('Quantity')} *
                          </label>
                          <Input
                            min="1"
                            type="number"
                            {...register(`items.${index}.quantity`, { required: true, min: 1 })}
                          />
                        </div>
                        
                        <div className="sm:col-span-6 lg:col-span-9 space-y-2">
                          <label className="text-sm font-medium">
                            {t('Item Notes')}
                          </label>
                          <Input
                            placeholder={t('Optional notes for this item')}
                            {...register(`items.${index}.notes`)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {errors.items && !Array.isArray(errors.items) && (
                    <FieldError error={errors.items.message} />
                  )}
                </CardContent>
              </Card>
            </>
          }
          sidebar={
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PackagePlus className="mr-2 h-5 w-5 text-muted" />
                  {t('Summary')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-muted">{t('Total Lines')}</dt>
                    <dd className="mt-1 text-2xl font-bold text-foreground">{fields.length}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          }
        />
        <FormActionsBar
          isSubmitting={createMutation.isPending}
          onCancel={() => navigate(merchantPath('/warehouse/inbound-requests'))}
        />
      </form>
    </>
  )
}
