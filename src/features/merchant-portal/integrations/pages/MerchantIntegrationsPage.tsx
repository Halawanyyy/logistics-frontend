import { useTranslation } from 'react-i18next'
import { PageHeader } from '../../../../shared/components/ui/PageHeader'
import { MerchantIntegrationTokensTab } from './components/MerchantIntegrationTokensTab'
import { MerchantIntegrationDocsTab } from './components/MerchantIntegrationDocsTab'
import { MerchantIntegrationTestTab } from './components/MerchantIntegrationTestTab'

export function MerchantIntegrationsPage() {
  const { t } = useTranslation()

  return (
    <div className="page-stack">
      <PageHeader
        title={t('Integrations', { defaultValue: 'Integrations' })}
        description={t('Manage API tokens and connect your external store or systems.', {
          defaultValue: 'Manage API tokens and connect your external store or systems.',
        })}
      />

      <div className="merchant-integrations-sections">
        <section className="merchant-integrations-section" aria-labelledby="integration-tokens-heading">
          <div className="merchant-integrations-section__header">
            <span className="eyebrow">{t('Section 1', { defaultValue: 'Section 1' })}</span>
            <h2 id="integration-tokens-heading">{t('API Tokens', { defaultValue: 'API Tokens' })}</h2>
          </div>
          <MerchantIntegrationTokensTab />
        </section>

        <section className="merchant-integrations-section" aria-labelledby="integration-docs-heading">
          <div className="merchant-integrations-section__header">
            <span className="eyebrow">{t('Section 2', { defaultValue: 'Section 2' })}</span>
            <h2 id="integration-docs-heading">{t('API Documentation', { defaultValue: 'API Documentation' })}</h2>
          </div>
          <MerchantIntegrationDocsTab />
        </section>

        <section className="merchant-integrations-section" aria-labelledby="integration-test-heading">
          <div className="merchant-integrations-section__header">
            <span className="eyebrow">{t('Section 3', { defaultValue: 'Section 3' })}</span>
            <h2 id="integration-test-heading">{t('Test Integration', { defaultValue: 'Test Integration' })}</h2>
          </div>
          <MerchantIntegrationTestTab />
        </section>
      </div>
    </div>
  )
}
