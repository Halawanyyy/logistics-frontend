import { useTranslation } from 'react-i18next'
import { PageHeader } from '../../../../shared/components/ui/PageHeader'
import { Card, CardContent } from '../../../../shared/components/ui/Card'
import { Store } from 'lucide-react'

export function MerchantStorePage() {
  const { t } = useTranslation()

  return (
    <div className="page-stack max-w-5xl mx-auto">
      <PageHeader
        title={t('Store', { defaultValue: 'Store' })}
        description={t('View packaging products, fulfillment services, and pricing offered by the company.', { defaultValue: 'View packaging products, fulfillment services, and pricing offered by the company.' })}
        actions={
          <span className="px-3 py-1 bg-muted text-muted-foreground text-sm rounded-full font-medium border">
            {t('View only', { defaultValue: 'View only' })}
          </span>
        }
      />

      <Card className="mt-8 border-dashed border-2 bg-slate-50 dark:bg-slate-900/50">
        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center mb-6">
            <Store size={32} className="text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-foreground">
            {t('No store catalog is available yet.', { defaultValue: 'No store catalog is available yet.' })}
          </h3>
          <p className="text-muted-foreground max-w-md">
            {t('Merchant-safe store endpoints are required before this page can display live catalog data.', { defaultValue: 'Merchant-safe store endpoints are required before this page can display live catalog data.' })}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
