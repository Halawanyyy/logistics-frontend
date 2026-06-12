import { useMutation } from '@tanstack/react-query'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { calculateShippingRate } from '../api/location-pricing.api'
import { getApiErrorMessage } from '../../../shared/api/api-error'
import { Button } from '../../../shared/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../shared/components/ui/Card'
import { Input } from '../../../shared/components/ui/Input'
import { PageHeader } from '../../../shared/components/ui/PageHeader'
import { MerchantSelector } from '../../../shared/components/selectors/MerchantSelector'
import { GovernorateAreaSelector } from '../../../shared/components/selectors/GovernorateAreaSelector'
import { Select } from '../../../shared/components/ui/Select'
import { formatMoney } from '../../../shared/utils/formatters'

const calculatorSchema = z.object({
  merchant_id: z.string().optional(),
  order_type: z.string().optional(),
  governorate_id: z.string().min(1, 'Governorate is required.'),
  area_id: z.string().optional(),
})

type CalculatorValues = z.infer<typeof calculatorSchema>

export function ShippingRateCalculatorPage() {
  const { t } = useTranslation()
  const mutation = useMutation({ mutationFn: calculateShippingRate })
  const {
    control,
    register,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<CalculatorValues>({
    resolver: zodResolver(calculatorSchema),
    defaultValues: { merchant_id: '', order_type: '', governorate_id: '', area_id: '' },
  })
  const merchantId = useWatch({ control, name: 'merchant_id' })
  const governorateId = useWatch({ control, name: 'governorate_id' })
  const areaId = useWatch({ control, name: 'area_id' })

  function onSubmit(values: CalculatorValues) {
    mutation.mutate({
      governorate_id: Number(values.governorate_id),
      area_id: values.area_id ? Number(values.area_id) : null,
      merchant_id: values.merchant_id ? Number(values.merchant_id) : null,
      order_type: values.order_type || undefined,
    })
  }

  return (
    <section className="page-section">
      <PageHeader
        title={t('Shipping Rate Calculator', { defaultValue: 'Shipping Rate Calculator' })}
        description={t('Calculate the shipping fee for a destination.', {
          defaultValue: 'Calculate the shipping fee for a destination.',
        })}
        actions={<Link className="ui-link-reset" to="/admin/shipping-rates"><Button variant="secondary">{t('Back')}</Button></Link>}
      />
      <Card>
        <CardHeader><CardTitle>{t('Destination', { defaultValue: 'Destination' })}</CardTitle></CardHeader>
        <CardContent>
          <form className="form-grid" onSubmit={handleSubmit(onSubmit)}>
            <label className="field">
              <span>{t('Merchant')}</span>
              <MerchantSelector
                value={merchantId ?? ''}
                includeAllOption
                onChange={(merchant_id) => setValue('merchant_id', merchant_id)}
              />
            </label>
            <label className="field">
              <span>{t('Order Type')}</span>
              <Select {...register('order_type')}>
                <option value="">{t('Default delivery', { defaultValue: 'Default delivery' })}</option>
                <option value="delivery">{t('delivery', { defaultValue: 'delivery' })}</option>
                <option value="swap">{t('swap', { defaultValue: 'swap' })}</option>
                <option value="return">{t('return', { defaultValue: 'return' })}</option>
              </Select>
            </label>
            <GovernorateAreaSelector
              governorateId={governorateId}
              areaId={areaId}
              governorateLabel={t('Delivery Governorate', { defaultValue: 'Delivery Governorate' })}
              areaLabel={t('Delivery Area', { defaultValue: 'Delivery Area' })}
              onChange={({ governorate_id, area_id }) => {
                setValue('governorate_id', governorate_id, { shouldValidate: true })
                setValue('area_id', area_id)
              }}
            />
            {errors.governorate_id?.message ? <div className="form-error">{t(errors.governorate_id.message)}</div> : null}
            {mutation.error ? <div className="form-error">{getApiErrorMessage(mutation.error)}</div> : null}
            <div className="form-actions"><Button type="submit" loading={mutation.isPending}>{t('Calculate', { defaultValue: 'Calculate' })}</Button></div>
          </form>
        </CardContent>
      </Card>
      {mutation.data ? (
        <Card>
          <CardHeader><CardTitle>{t('Result', { defaultValue: 'Result' })}</CardTitle></CardHeader>
          <CardContent>
            <Input value={formatMoney(mutation.data.data.shipping_fee ?? mutation.data.data.delivery_fee ?? '0')} readOnly />
          </CardContent>
        </Card>
      ) : null}
    </section>
  )
}
