import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Box, CheckCircle2, Package, Tag, FileText, BarChart2 } from 'lucide-react'
import { getApiErrorMessage } from '../../../../shared/api/api-error'
import { ErrorState } from '../../../../shared/components/states/ErrorState'
import { LoadingState } from '../../../../shared/components/states/LoadingState'
import { Button } from '../../../../shared/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../shared/components/ui/Card'
import { PageHeader } from '../../../../shared/components/ui/PageHeader'
import { StatusBadge } from '../../../../shared/components/ui/StatusBadge'
import { merchantPath } from '../../../../shared/routing/paths'
import { formatDate } from '../../../../shared/utils/formatters'
import { createHtmlLabelDocument } from '../../../../shared/utils/printHtml'
import type { AppLocale } from '../../../../shared/i18n/locale'
import { CanMerchant } from '../../components/CanMerchant'
import {
  getMerchantPortalWarehouseProduct,
  getMerchantPortalWarehouseProductLabel,
} from '../api/merchantPortalWarehouse.api'
import { LabelDocumentDialog } from '../../../../shared/components/labels/LabelDocumentDialog'

export function MerchantWarehouseProductDetailsPage() {
  const { t } = useTranslation()
  const { productId } = useParams<{ productId: string }>()

  const [printState, setPrintState] = useState<{ productId: number; type: 'label' } | null>(null)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['merchant-portal', 'warehouse-product', productId],
    queryFn: () => getMerchantPortalWarehouseProduct(productId!),
    enabled: !!productId,
  })

  if (isLoading) {
    return <LoadingState title={t('Loading product details...')} />
  }

  if (isError) {
    return (
      <ErrorState
        actions={
          <Button variant="secondary" asChild>
            <Link to={merchantPath('/warehouse/products')}>{t('Back to Products')}</Link>
          </Button>
        }
        message={getApiErrorMessage(error, t('Failed to load product details.'))}
        onRetry={refetch}
      />
    )
  }

  if (!data?.data) {
    return (
      <ErrorState
        actions={
          <Button variant="secondary" asChild>
            <Link to={merchantPath('/warehouse/products')}>{t('Back to Products')}</Link>
          </Button>
        }
        message={t('Product not found.')}
      />
    )
  }

  const product = data.data

  return (
    <>
      <div className="mb-4">
        <Link
          className="inline-flex items-center text-sm text-muted hover:text-foreground"
          to={merchantPath('/warehouse/products')}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          {t('Back to Warehouse Products')}
        </Link>
      </div>

      <PageHeader
        actions={
          <CanMerchant capability="labels.print">
            <Button
              variant="secondary"
              onClick={() => setPrintState({ productId: product.id, type: 'label' })}
            >
              {t('Print Label')}
            </Button>
          </CanMerchant>
        }
        description={t('Detailed view of your warehouse product.')}
        title={product.name}
      />
      <div className="mb-6">
        <StatusBadge value={product.status}>
          {product.status_label || product.status}
        </StatusBadge>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Main Details */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="mr-2 h-5 w-5 text-muted" />
                {t('Product Details')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-muted">{t('Product Name')}</dt>
                  <dd className="mt-1 text-sm text-foreground">{product.name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted">{t('Category')}</dt>
                  <dd className="mt-1 text-sm text-foreground">{product.category_name || '-'}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-muted">{t('Description')}</dt>
                  <dd className="mt-1 text-sm text-foreground whitespace-pre-wrap">{product.description || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted">{t('Created At')}</dt>
                  <dd className="mt-1 text-sm text-foreground">{formatDate(product.created_at)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Tag className="mr-2 h-5 w-5 text-muted" />
                {t('Identifiers')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-muted">{t('SKU')}</dt>
                  <dd className="mt-1 text-sm font-mono text-foreground">{product.sku}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted">{t('Barcode')}</dt>
                  <dd className="mt-1 text-sm font-mono text-foreground">{product.barcode || '-'}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart2 className="mr-2 h-5 w-5 text-muted" />
                {t('Stock Summary')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-muted">{t('On Hand')}</dt>
                  <dd className="mt-1 text-2xl font-bold text-foreground">
                    {product.inventory_summary?.on_hand_quantity ?? 0}
                  </dd>
                </div>
                <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
                  <div>
                    <dt className="text-sm font-medium text-muted">{t('Available')}</dt>
                    <dd className="mt-1 text-lg font-semibold text-success">
                      {product.inventory_summary?.available_quantity ?? 0}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted">{t('Reserved')}</dt>
                    <dd className="mt-1 text-lg font-semibold text-warning">
                      {product.inventory_summary?.reserved_quantity ?? 0}
                    </dd>
                  </div>
                </div>
                <div className="border-t border-border pt-4">
                  <dt className="text-sm font-medium text-muted">{t('Warehouses Count')}</dt>
                  <dd className="mt-1 text-sm text-foreground">
                    {product.inventory_summary?.warehouses_count ?? 0}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>

      {printState && (
        <LabelDocumentDialog
          fetchDocument={async () => {
            const res = await getMerchantPortalWarehouseProductLabel(printState.productId)
            return createHtmlLabelDocument({
              html: res.data.html || '',
              fileName: `product-label-${printState.productId}.html`,
              locale: (document.documentElement.lang || 'en') as AppLocale,
              title: t('Product Label')
            })
          }}
          open={true}
          title={t('Product Label')}
          triggerLabel="Print" hideTrigger={true} onOpenChange={(open) => { if (!open) () => setPrintState(null); } }
        />
      )}
    </>
  )
}
