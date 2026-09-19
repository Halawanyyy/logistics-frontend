import { useRef, useState, type KeyboardEvent } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Pencil } from 'lucide-react'
import { useMerchantPortalContext } from '../context/merchantPortal.context'
import { Button } from '../../../shared/components/ui/Button'
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
  const { user, merchant, portalStatus, hasMerchantCapability } = useMerchantPortalContext()
  const [isEditing, setIsEditing] = useState(false)
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])

  const tabs = [
    { id: 'overview', label: t('Overview', { defaultValue: 'Overview' }), path: merchantPath('/profile/overview') },
    { id: 'store', label: t('Shop Preview', { defaultValue: 'Shop Preview' }), path: merchantPath('/profile/store') },
    { id: 'integrations', label: t('Integration Tokens', { defaultValue: 'Integration Tokens' }), path: merchantPath('/profile/integrations') },
  ]

  const currentTab = tabs.find((tab) => location.pathname.startsWith(tab.path))?.id ?? 'overview'
  const merchantName = merchant?.company_name || merchant?.name || t('Merchant', { defaultValue: 'Merchant' })
  const merchantStatus = merchant?.status ?? portalStatus ?? 'unknown'
  const canEdit = hasMerchantCapability('profile.update')
  const merchantInitials = merchantName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'M'

  function openEditMode() {
    setIsEditing(true)
    if (currentTab !== 'overview') {
      navigate(merchantPath('/profile/overview'))
    }
  }

  function selectTab(index: number) {
    const tab = tabs[index]
    if (!tab) {
      return
    }

    setIsEditing(false)
    navigate(tab.path)
    requestAnimationFrame(() => tabRefs.current[index]?.focus())
  }

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex: number | null = null

    if (event.key === 'ArrowRight') {
      nextIndex = (index + 1) % tabs.length
    } else if (event.key === 'ArrowLeft') {
      nextIndex = (index - 1 + tabs.length) % tabs.length
    } else if (event.key === 'Home') {
      nextIndex = 0
    } else if (event.key === 'End') {
      nextIndex = tabs.length - 1
    }

    if (nextIndex !== null) {
      event.preventDefault()
      selectTab(nextIndex)
    }
  }

  return (
    <section className="page-section merchant-profile-page">
      <header className="merchant-profile-hero">
        <div className="merchant-profile-hero__identity">
          <div className="merchant-profile-hero__avatar" aria-hidden="true">
            {merchantInitials}
          </div>
          <div className="merchant-profile-hero__copy">
            <div className="merchant-profile-hero__eyebrow">
              {t('MERCHANT PORTAL', { defaultValue: 'MERCHANT PORTAL' })}
            </div>
            <h1>{merchantName}</h1>
            <p>{user?.email ?? '—'}</p>
          </div>
        </div>
        <div className="merchant-profile-hero__actions">
          <StatusBadge value={merchantStatus} />
          {canEdit ? (
            <Button
              className="merchant-profile-hero__edit"
              variant="secondary"
              onClick={isEditing ? () => setIsEditing(false) : openEditMode}
            >
              {isEditing ? <ArrowLeft size={17} aria-hidden="true" /> : <Pencil size={17} aria-hidden="true" />}
              <span>
                {isEditing
                  ? t('Back', { defaultValue: 'Back' })
                  : t('Edit Merchant', { defaultValue: 'Edit Merchant' })}
              </span>
            </Button>
          ) : null}
        </div>
      </header>

      <div
        aria-label={t('Merchant profile sections', { defaultValue: 'Merchant profile sections' })}
        className="merchant-profile-tabs"
        role="tablist"
      >
        {tabs.map((tab, index) => (
          <button
            aria-controls={`merchant-profile-panel-${tab.id}`}
            aria-selected={currentTab === tab.id}
            id={`merchant-profile-tab-${tab.id}`}
            key={tab.id}
            ref={(element) => {
              tabRefs.current[index] = element
            }}
            className={cn('merchant-profile-tabs__tab', currentTab === tab.id && 'merchant-profile-tabs__tab--active')}
            onClick={() => selectTab(index)}
            onKeyDown={(event) => handleTabKeyDown(event, index)}
            role="tab"
            tabIndex={currentTab === tab.id ? 0 : -1}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div
        aria-labelledby={`merchant-profile-tab-${currentTab}`}
        className="merchant-profile-page__panel"
        id={`merchant-profile-panel-${currentTab}`}
        role="tabpanel"
        tabIndex={0}
      >
        <Routes>
          <Route
            path="overview"
            element={<MerchantProfileOverviewTab isEditing={isEditing} onEditingChange={setIsEditing} />}
          />
          <Route path="store" element={<MerchantProfileStoreTab />} />
          <Route path="integrations" element={<MerchantIntegrationTokensTab />} />
          <Route path="*" element={<Navigate to="overview" replace />} />
        </Routes>
      </div>
    </section>
  )
}
