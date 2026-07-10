import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { getMerchantShopPreview } from '../api/merchantShop.api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/Card'
import { LoadingState } from '../../../shared/components/feedback/LoadingState'
import { ErrorState } from '../../../shared/components/feedback/ErrorState'
import { getApiErrorMessage } from '../../../shared/api/api-error'
import { EmptyState } from '../../../shared/components/feedback/EmptyState'
import { MoneyDisplay } from '../../../shared/components/display/MoneyDisplay'
import { Eye } from 'lucide-react'
import type {
  MerchantShopPackagingProduct,
  MerchantShopStorageFeeRule,
  MerchantShopPickPackFeeRule,
  MerchantShopService,
} from '../types/merchantShop.types'

export function MerchantShopPreviewPanel({ merchantId }: { merchantId: string }) {
  const { t } = useTranslation()

  const query = useQuery({
    queryKey: ['merchant-shop-preview', merchantId],
    queryFn: () => getMerchantShopPreview(merchantId),
    enabled: Boolean(merchantId),
  })

  if (query.isLoading) {
    return <LoadingState title={t('Loading Shop Preview', { defaultValue: 'Loading Shop Preview' })} />
  }

  if (query.isError) {
    return (
      <ErrorState
        message={getApiErrorMessage(query.error)}
        onRetry={() => void query.refetch()}
      />
    )
  }

  const data = query.data?.data

  if (!data) {
    return (
      <EmptyState
        title={t('No Preview Available', { defaultValue: 'No Preview Available' })}
        description={t('No shop preview data available', { defaultValue: 'No shop preview data available' })}
      />
    )
  }

  return (
    <div className="merchant-shop-preview-panel" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header Card */}
      <Card>
        <CardHeader style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <CardTitle style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Eye className="text-primary" size={24} />
              {t('Merchant Shop Preview', { defaultValue: 'Merchant Shop Preview' })}
            </CardTitle>
            <CardDescription style={{ marginTop: '0.5rem' }}>
              {t('Preview what this merchant can see from company catalog and service pricing.', {
                defaultValue: 'Preview what this merchant can see from company catalog and service pricing.',
              })}
            </CardDescription>
            <p className="text-muted" style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
              {t('Merchants cannot purchase from this preview.', { defaultValue: 'Merchants cannot purchase from this preview.' })}
            </p>
          </div>
          <div>
            <span className="badge badge--neutral" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
              {t('Read-only Preview', { defaultValue: 'Read-only Preview' })}
            </span>
          </div>
        </CardHeader>
      </Card>

      {/* Packaging Products */}
      <section>
        <div style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.25rem' }}>
            {t('Packaging Products', { defaultValue: 'Packaging Products' })}
          </h3>
          <p className="text-muted" style={{ fontSize: '0.875rem' }}>
            {t('Packaging products visible to the merchant.', { defaultValue: 'Packaging products visible to the merchant.' })}
          </p>
        </div>

        {!data.packaging_products?.length ? (
          <EmptyState
            title={t('No packaging products visible', { defaultValue: 'No packaging products visible' })}
            description={t('This merchant does not currently have visible items in this section.', { defaultValue: 'This merchant does not currently have visible items in this section.' })}
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {data.packaging_products.map((item: MerchantShopPackagingProduct) => (
              <Card key={item.id}>
                <CardContent style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <h4 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.25rem' }}>{item.name}</h4>
                    {item.sku ? <p className="text-muted" style={{ fontSize: '0.875rem' }}>{t('SKU', { defaultValue: 'SKU' })}: {item.sku}</p> : null}
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-primary)' }}>
                      <MoneyDisplay value={item.unit_price} currency={item.currency} />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <span className="badge badge--outline">{item.status}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Storage & Fulfillment Pricing */}
      <section>
        <div style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.25rem' }}>
            {t('Storage & Fulfillment Pricing', { defaultValue: 'Storage & Fulfillment Pricing' })}
          </h3>
          <p className="text-muted" style={{ fontSize: '0.875rem' }}>
            {t('Storage and fulfillment service prices visible to the merchant.', { defaultValue: 'Storage and fulfillment service prices visible to the merchant.' })}
          </p>
        </div>

        {!data.storage_fees?.length ? (
          <EmptyState
            title={t('No storage services visible', { defaultValue: 'No storage services visible' })}
            description={t('This merchant does not currently have visible items in this section.', { defaultValue: 'This merchant does not currently have visible items in this section.' })}
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {data.storage_fees.map((item: MerchantShopStorageFeeRule) => (
              <Card key={item.id}>
                <CardContent style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <h4 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.25rem' }}>{item.name}</h4>
                    <p className="text-muted" style={{ fontSize: '0.875rem' }}>{item.calculation_type}</p>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                    <div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-primary)' }}>
                        <MoneyDisplay value={item.unit_price} />
                      </div>
                      <p className="text-muted" style={{ fontSize: '0.75rem' }}>{item.free_units} {t('Free Units', { defaultValue: 'Free Units' })}</p>
                    </div>
                    <span className="badge badge--outline">{item.status}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Pick & Pack Fees */}
      <section>
        <div style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.25rem' }}>
            {t('Pick & Pack Fees', { defaultValue: 'Pick & Pack Fees' })}
          </h3>
          <p className="text-muted" style={{ fontSize: '0.875rem' }}>
            {t('Pick and pack fee rules visible to the merchant.', { defaultValue: 'Pick and pack fee rules visible to the merchant.' })}
          </p>
        </div>

        {!data.pick_pack_fees?.length ? (
          <EmptyState
            title={t('No pick & pack fees visible', { defaultValue: 'No pick & pack fees visible' })}
            description={t('This merchant does not currently have visible items in this section.', { defaultValue: 'This merchant does not currently have visible items in this section.' })}
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
            {data.pick_pack_fees.map((item: MerchantShopPickPackFeeRule) => (
              <Card key={item.id}>
                <CardContent style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h4 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.25rem' }}>{item.name}</h4>
                    <span className="badge badge--outline">{item.status}</span>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <div>
                      <p className="text-muted" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>{t('Base Packing Fee', { defaultValue: 'Base Packing Fee' })}</p>
                      <div style={{ fontWeight: 500 }}><MoneyDisplay value={item.packing_fee_base} /></div>
                    </div>
                    <div>
                      <p className="text-muted" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>{t('First Item Fee', { defaultValue: 'First Item Fee' })}</p>
                      <div style={{ fontWeight: 500 }}><MoneyDisplay value={item.pick_fee_first_item} /></div>
                    </div>
                    <div>
                      <p className="text-muted" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>{t('Additional Item Fee', { defaultValue: 'Additional Item Fee' })}</p>
                      <div style={{ fontWeight: 500 }}><MoneyDisplay value={item.pick_fee_additional_item} /></div>
                    </div>
                    <div>
                      <p className="text-muted" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>{t('Fragile Extra Fee', { defaultValue: 'Fragile Extra Fee' })}</p>
                      <div style={{ fontWeight: 500 }}><MoneyDisplay value={item.fragile_extra_fee} /></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Visible Services */}
      <section>
        <div style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.25rem' }}>
            {t('Visible Services', { defaultValue: 'Visible Services' })}
          </h3>
          <p className="text-muted" style={{ fontSize: '0.875rem' }}>
            {t('Other company services visible to the merchant.', { defaultValue: 'Other company services visible to the merchant.' })}
          </p>
        </div>

        {!data.services?.length ? (
          <EmptyState
            title={t('No visible services available', { defaultValue: 'No visible services available' })}
            description={t('This merchant does not currently have visible items in this section.', { defaultValue: 'This merchant does not currently have visible items in this section.' })}
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {data.services.map((item: MerchantShopService) => (
              <Card key={item.id}>
                <CardContent style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <h4 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.25rem' }}>{item.name}</h4>
                    <p className="text-muted" style={{ fontSize: '0.875rem' }}>{item.type}</p>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-primary)' }}>
                      <MoneyDisplay value={item.unit_price} currency={item.currency} />
                    </div>
                    <span className="badge badge--outline">{item.status}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
