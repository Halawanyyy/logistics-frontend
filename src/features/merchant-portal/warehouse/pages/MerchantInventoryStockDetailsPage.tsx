import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Box, Boxes, Calendar, MapPin, Package } from 'lucide-react'
import { getApiErrorMessage } from '../../../../shared/api/api-error'
import { ErrorState } from '../../../../shared/components/states/ErrorState'
import { LoadingState } from '../../../../shared/components/states/LoadingState'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../shared/components/ui/Card'
import { PageHeader } from '../../../../shared/components/ui/PageHeader'
import { merchantPath } from '../../../../shared/routing/paths'
import { formatDate } from '../../../../shared/utils/formatters'
import { getMerchantPortalInventoryStock } from '../api/merchantPortalWarehouse.api'
import { Badge } from '../../../../shared/components/ui/Badge'

export function MerchantInventoryStockDetailsPage() {
  const { t } = useTranslation()
  const { inventoryStockId } = useParams<{ inventoryStockId: string }>()

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['merchant-portal', 'inventory-stock', inventoryStockId],
    queryFn: () => getMerchantPortalInventoryStock(inventoryStockId!),
    enabled: !!inventoryStockId,
  })

  if (isLoading) {
    return <LoadingState title={t('Loading inventory details...')} />
  }

  if (isError) {
    return (
      <ErrorState
        actions={
          <Button variant="secondary" asChild>
            <Link to={merchantPath('/warehouse/inventory')}>{t('Back to Inventory')}</Link>
          </Button>
        }
        message={getApiErrorMessage(error, t('Failed to load inventory details.'))}
        onRetry={refetch}
      />
    )
  }

  if (!data?.data) {
    return (
      <ErrorState
        actions={
          <Button variant="secondary" asChild>
            <Link to={merchantPath('/warehouse/inventory')}>{t('Back to Inventory')}</Link>
          </Button>
        }
        message={t('Inventory stock not found.')}
      />
    )
  }

  const stock = data.data

  return (
    <>
      <div className="mb-4">
        <Link
          className="inline-flex items-center text-sm text-muted hover:text-foreground"
          to={merchantPath('/warehouse/inventory')}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          {t('Back to Inventory Stocks')}
        </Link>
      </div>

      <PageHeader
        description={t('Detailed view of inventory stock quantities and location.')}
        title={t('Inventory Details')}
      >
        {stock.low_stock ? (
          <Badge variant="danger">{t('Low Stock')}</Badge>
        ) : (
          <Badge variant="success">{t('In Stock')}</Badge>
        )}
      </PageHeader>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="mr-2 h-5 w-5 text-muted" />
              {t('Product Info')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-muted">{t('Product Name')}</dt>
                <dd className="mt-1">
                  {stock.product_summary?.id ? (
                    <Link
                      className="text-primary hover:underline font-medium"
                      to={merchantPath(`/warehouse/products/${stock.product_summary.id}`)}
                    >
                      {stock.product_summary.name || '-'}
                    </Link>
                  ) : (
                    <span className="font-medium text-foreground">{stock.product_summary?.name || '-'}</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted">{t('SKU')}</dt>
                <dd className="mt-1 font-mono text-sm text-foreground">{stock.product_summary?.sku || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted">{t('Barcode')}</dt>
                <dd className="mt-1 font-mono text-sm text-foreground">{stock.product_summary?.barcode || '-'}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Boxes className="mr-2 h-5 w-5 text-muted" />
              {t('Quantities')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <dt className="text-sm font-medium text-muted">{t('Total On Hand')}</dt>
                <dd className="mt-1 text-3xl font-bold text-foreground">{stock.on_hand_quantity}</dd>
              </div>
              <div className="rounded-md bg-success/10 p-4 border border-success/20">
                <dt className="text-sm font-medium text-success-foreground">{t('Available')}</dt>
                <dd className="mt-1 text-xl font-semibold text-success-foreground">{stock.available_quantity}</dd>
              </div>
              <div className="rounded-md bg-warning/10 p-4 border border-warning/20">
                <dt className="text-sm font-medium text-warning-foreground">{t('Reserved')}</dt>
                <dd className="mt-1 text-xl font-semibold text-warning-foreground">{stock.reserved_quantity}</dd>
              </div>
              {stock.damaged_quantity > 0 && (
                <div className="col-span-2 rounded-md bg-destructive/10 p-4 border border-destructive/20">
                  <dt className="text-sm font-medium text-destructive-foreground">{t('Damaged')}</dt>
                  <dd className="mt-1 text-xl font-semibold text-destructive-foreground">{stock.damaged_quantity}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="mr-2 h-5 w-5 text-muted" />
              {t('Location')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-muted">{t('Warehouse')}</dt>
                <dd className="mt-1 text-sm font-medium text-foreground">{stock.warehouse_summary?.name || '-'}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5 text-muted" />
              {t('Updates')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-muted">{t('Last Updated')}</dt>
                <dd className="mt-1 text-sm text-foreground">{formatDate(stock.updated_at)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
