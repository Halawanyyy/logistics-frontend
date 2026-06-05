import { Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '../shared/components/ui/Card'
import { BrandMark } from '../shared/components/branding/BrandMark'
import { useBranding } from '../shared/branding/useBranding'

export function AuthLayout() {
  const { t } = useTranslation()
  const branding = useBranding()

  return (
    <div className="auth-shell">
      <section className="auth-shell__hero">
        <div className="auth-brand">
          <BrandMark className="auth-brand__icon" logoUrl={branding.companyLogo} name={branding.companyName} size="lg" />
          <div>
            <p className="eyebrow">{branding.companyName}</p>
            <h1>{t('Operate logistics from one intuitive admin workspace.', { defaultValue: 'Operate logistics from one intuitive admin workspace.' })}</h1>
            <p>{t('Manage orders, shipments, merchants, users, and pricing with a cleaner, faster workflow.', { defaultValue: 'Manage orders, shipments, merchants, users, and pricing with a cleaner, faster workflow.' })}</p>
          </div>
        </div>

        <div className="auth-highlights">
          <Card>
            <CardHeader>
              <CardTitle>{t('Live operations', { defaultValue: 'Live operations' })}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{t('All dashboard modules stay wired to the Laravel API and your auth session.', { defaultValue: 'All dashboard modules stay wired to the Laravel API and your auth session.' })}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t('Consistent admin UI', { defaultValue: 'Consistent admin UI' })}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{t('Shared layouts, tables, badges, and detail views keep the product scalable.', { defaultValue: 'Shared layouts, tables, badges, and detail views keep the product scalable.' })}</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="auth-shell__panel">
        <Outlet />
      </section>
    </div>
  )
}
