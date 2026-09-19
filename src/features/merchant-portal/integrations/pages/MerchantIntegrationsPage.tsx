import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Play, ShoppingCart } from 'lucide-react'
import { CanMerchant } from '../../components/CanMerchant'
import { Button } from '../../../../shared/components/ui/Button'
import { MerchantIntegrationTokensTab } from './components/MerchantIntegrationTokensTab'
import { MerchantIntegrationDocsTab } from './components/MerchantIntegrationDocsTab'
import { MerchantIntegrationTestTab } from './components/MerchantIntegrationTestTab'

export function MerchantIntegrationsPage() {
  const { t } = useTranslation()
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'docs' | 'test'>('docs')

  return (
    <div className="merchant-integrations-page">
      {/* 1. Compact Page Header */}
      <header className="merchant-integrations-header">
        <div>
          <div className="merchant-integrations-header__eyebrow">
            {t('MERCHANT PORTAL', { defaultValue: 'MERCHANT PORTAL' })}
          </div>
          <h1 className="merchant-integrations-header__title">
            {t('Integrations', { defaultValue: 'Integrations' })}
          </h1>
          <p className="merchant-integrations-header__desc">
            {t(
              'Manage API tokens, explore documentation, and test your connection.',
              {
                defaultValue:
                  'Manage API tokens, explore documentation, and test your connection.',
              }
            )}
          </p>
        </div>

        {/* Header Right Action */}
        <div>
          <CanMerchant capability="integrations.manage">
            <Button
              type="button"
              className="merchant-integrations-btn--create"
              onClick={() => setCreateModalOpen(true)}
            >
              <Plus size={16} />
              <span>
                {t('Create Token', { defaultValue: 'Create Token' })}
              </span>
            </Button>
          </CanMerchant>
        </div>
      </header>

      {/* 2. API Tokens Card */}
      <section>
        <MerchantIntegrationTokensTab
          createOpen={createModalOpen}
          onCloseCreate={() => setCreateModalOpen(false)}
          onOpenCreate={() => setCreateModalOpen(true)}
          hideCardHeaderButton={true}
        />
      </section>

      {/* 3. Developer Tools Card */}
      <section
        className="merchant-integrations-card"
        aria-labelledby="developer-tools-heading"
      >
        {/* Card Header */}
        <div className="merchant-integrations-card__header">
          <div>
            <h2 id="developer-tools-heading" className="merchant-integrations-card__title">
              {t('Developer Tools', { defaultValue: 'Developer Tools' })}
            </h2>
            <p className="merchant-integrations-card__desc">
              {t('Explore the API documentation or test your integration.', {
                defaultValue:
                  'Explore the API documentation or test your integration.',
              })}
            </p>
          </div>

          <div className="merchant-integrations-badges">
            <span className="merchant-integrations-badge--blue">
              {t('API v1', { defaultValue: 'API v1' })}
            </span>
            <span className="merchant-integrations-badge--slate">
              {t('Bearer Token', { defaultValue: 'Bearer Token' })}
            </span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div
          className="merchant-dev-tabs"
          role="tablist"
          aria-label={t('Developer Tools Tabs', {
            defaultValue: 'Developer Tools Tabs',
          })}
        >
          <button
            type="button"
            role="tab"
            id="tab-docs"
            aria-selected={activeTab === 'docs'}
            aria-controls="panel-docs"
            className={`merchant-dev-tab ${
              activeTab === 'docs' ? 'is-active' : ''
            }`}
            onClick={() => setActiveTab('docs')}
          >
            <ShoppingCart size={15} aria-hidden="true" />
            <span>
              {t('API Documentation', { defaultValue: 'API Documentation' })}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            id="tab-test"
            aria-selected={activeTab === 'test'}
            aria-controls="panel-test"
            className={`merchant-dev-tab ${
              activeTab === 'test' ? 'is-active' : ''
            }`}
            onClick={() => setActiveTab('test')}
          >
            <Play size={14} aria-hidden="true" />
            <span>
              {t('Test Integration', { defaultValue: 'Test Integration' })}
            </span>
          </button>
        </div>

        {/* Tab Content Panel */}
        <div
          id={activeTab === 'docs' ? 'panel-docs' : 'panel-test'}
          role="tabpanel"
          aria-labelledby={activeTab === 'docs' ? 'tab-docs' : 'tab-test'}
        >
          {activeTab === 'docs' ? (
            <MerchantIntegrationDocsTab />
          ) : (
            <MerchantIntegrationTestTab />
          )}
        </div>
      </section>
    </div>
  )
}
