import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '../../../shared/components/ui/PageHeader'
import { merchantPath } from '../../../shared/routing/paths'
import { MerchantIntegrationTokensTab } from './components/MerchantIntegrationTokensTab'
import { MerchantIntegrationDocsTab } from './components/MerchantIntegrationDocsTab'
import { MerchantIntegrationTestTab } from './components/MerchantIntegrationTestTab'
import { cn } from '../../../utils/cn'

export function MerchantIntegrationsPage() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()

  const tabs = [
    { id: 'tokens', label: t('API Tokens', { defaultValue: 'API Tokens' }), path: merchantPath('/integrations/tokens') },
    { id: 'docs', label: t('API Documentation', { defaultValue: 'API Documentation' }), path: merchantPath('/integrations/docs') },
    { id: 'test', label: t('Test Integration', { defaultValue: 'Test Integration' }), path: merchantPath('/integrations/test') },
  ]

  const currentTab = tabs.find((tab) => location.pathname.startsWith(tab.path))?.id ?? 'tokens'

  return (
    <div className="page-stack">
      <PageHeader
        title={t('Integrations', { defaultValue: 'Integrations' })}
        description={t('Manage API tokens and connect your external store or systems.', {
          defaultValue: 'Manage API tokens and connect your external store or systems.',
        })}
      />

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
        <Route path="tokens" element={<MerchantIntegrationTokensTab />} />
        <Route path="docs" element={<MerchantIntegrationDocsTab />} />
        <Route path="test" element={<MerchantIntegrationTestTab />} />
        <Route path="*" element={<Navigate to="tokens" replace />} />
      </Routes>
    </div>
  )
}
