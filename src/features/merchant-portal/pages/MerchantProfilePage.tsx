import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useMerchantPortalContext } from '../context/merchantPortal.context'
import { StatusBadge } from '../../../shared/components/ui/StatusBadge'
import { cn } from '../../../shared/utils/cn'
import { merchantPath } from '../../../shared/routing/paths'
import { MerchantProfileOverviewTab } from './components/MerchantProfileOverviewTab'
import { MerchantProfileStoreTab } from './components/MerchantProfileStoreTab'
import { MerchantIntegrationTokensTab } from '../integrations/pages/components/MerchantIntegrationTokensTab'

export function MerchantProfilePage() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const { user, merchant, portalStatus } = useMerchantPortalContext()

  const tabs = [
    { id: 'overview', label: t('Overview', { defaultValue: 'Overview' }), path: merchantPath('/profile/overview') },
    { id: 'store', label: t('Shop Preview', { defaultValue: 'Shop Preview' }), path: merchantPath('/profile/store') },
    { id: 'integrations', label: t('Integration Tokens', { defaultValue: 'Integration Tokens' }), path: merchantPath('/profile/integrations') },
  ]

  const currentTab = tabs.find((tab) => location.pathname.startsWith(tab.path))?.id ?? 'overview'

  return (
    <section className="page-section page-section--with-sidebar">
      {/* Premium Header */}
      <header className="page-header page-header--premium">
        <div className="page-header__content">
          <div className="page-header__eyebrow">{t('MERCHANT PORTAL')}</div>
          <h1 className="page-header__title">{merchant?.company_name || merchant?.name}</h1>
          <div className="page-header__description">{user?.email}</div>
        </div>
        <div className="page-header__actions">
          <div className="page-header__badges">
            <StatusBadge value={portalStatus}>{portalStatus ?? 'Unknown'}</StatusBadge>
          </div>
        </div>
      </header>

      <div className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={cn('tabs__tab', currentTab === tab.id && 'tabs__tab--active')}
            onClick={() => navigate(tab.path)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Routes>
        <Route path="overview" element={<MerchantProfileOverviewTab />} />
        <Route path="store" element={<MerchantProfileStoreTab />} />
        <Route path="integrations" element={<MerchantIntegrationTokensTab />} />
        <Route path="*" element={<Navigate to="overview" replace />} />
      </Routes>
    </section>
  )
}
