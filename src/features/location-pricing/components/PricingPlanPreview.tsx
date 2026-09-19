import { Activity, CheckCircle2, Eye, XCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { PricingPlanFeatureFormValue } from '../types/location-pricing.types'

export type PricingPlanPreviewProps = {
  name?: string
  description?: string | null
  monthlyPrice?: number | null
  yearlyPrice?: number | null
  currency?: string
  monthlyOrdersFrom?: number | null
  monthlyOrdersTo?: number | null
  requiresContact?: boolean
  isPopular?: boolean
  features: PricingPlanFeatureFormValue[]
}

export function PricingPlanPreview({
  name,
  description,
  monthlyPrice,
  currency = 'EGP',
  monthlyOrdersFrom,
  monthlyOrdersTo,
  requiresContact = false,
  isPopular = false,
  features,
}: PricingPlanPreviewProps) {
  const { t } = useTranslation()

  const displayName = name?.trim() || t('Untitled Plan', { defaultValue: 'Untitled Plan' })
  const displayDescription =
    description?.trim() ||
    t('Add a description to explain this plan.', {
      defaultValue: 'Add a description to explain this plan.',
    })

  // Format order limits
  const hasFrom = monthlyOrdersFrom !== null && monthlyOrdersFrom !== undefined && !Number.isNaN(monthlyOrdersFrom)
  const hasTo = monthlyOrdersTo !== null && monthlyOrdersTo !== undefined && !Number.isNaN(monthlyOrdersTo)

  let orderRangeText: string | null = null
  if (hasFrom && hasTo) {
    orderRangeText = `${monthlyOrdersFrom} – ${monthlyOrdersTo} ${t('orders / month', { defaultValue: 'orders / month' })}`
  } else if (hasFrom) {
    orderRangeText = `${t('From', { defaultValue: 'From' })} ${monthlyOrdersFrom} ${t('orders / month', { defaultValue: 'orders / month' })}`
  } else if (hasTo) {
    orderRangeText = `${t('Up to', { defaultValue: 'Up to' })} ${monthlyOrdersTo} ${t('orders / month', { defaultValue: 'orders / month' })}`
  }

  // Price formatting
  const hasPrice =
    monthlyPrice !== null &&
    monthlyPrice !== undefined &&
    !Number.isNaN(monthlyPrice) &&
    monthlyPrice !== ('' as unknown as number)

  const formattedPrice = hasPrice
    ? Number(monthlyPrice).toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      })
    : null

  // Only show features with non-empty text in preview
  const previewFeatures = features.filter((f) => f.label.trim() !== '')

  return (
    <aside
      id="pricing-plan-live-preview"
      className="pricing-plan-preview"
      aria-label={t('Live Preview', { defaultValue: 'Live Preview' })}
    >
      <div className="pricing-plan-preview__header">
        <div className="pricing-plan-preview__title-group">
          <Eye className="pricing-plan-preview__header-icon" size={18} aria-hidden="true" />
          <h2 className="pricing-plan-preview__title">
            {t('Live Preview', { defaultValue: 'Live Preview' })}
          </h2>
        </div>
        <p className="pricing-plan-preview__subtitle">
          {t('This is how merchants will see the plan.', {
            defaultValue: 'This is how merchants will see the plan.',
          })}
        </p>
      </div>

      <div
        className={`pricing-plan-preview__card ${
          isPopular ? 'pricing-plan-preview__card--popular' : ''
        }`}
      >
        <div className="pricing-plan-preview__badges">
          {isPopular ? (
            <span className="pricing-plan-preview__badge pricing-plan-preview__badge--popular">
              {t('Popular', { defaultValue: 'Popular' })}
            </span>
          ) : null}
          <span className="pricing-plan-preview__badge">
            {t('Draft preview', { defaultValue: 'Draft preview' })}
          </span>
        </div>

        <h3 className="pricing-plan-preview__plan-name">{displayName}</h3>
        <p className="pricing-plan-preview__plan-desc">{displayDescription}</p>

        <div className="pricing-plan-preview__divider" />

        <div className="pricing-plan-preview__price-section">
          {requiresContact ? (
            <div className="pricing-plan-preview__price pricing-plan-preview__price--custom">
              {t('Custom pricing', { defaultValue: 'Custom pricing' })}
            </div>
          ) : hasPrice ? (
            <div className="pricing-plan-preview__price">
              <span className="pricing-plan-preview__amount">{formattedPrice}</span>
              <span className="pricing-plan-preview__currency"> {currency}</span>
              <span className="pricing-plan-preview__period"> / {t('month', { defaultValue: 'month' })}</span>
            </div>
          ) : (
            <div className="pricing-plan-preview__price pricing-plan-preview__price--unset">
              {t('Price not set', { defaultValue: 'Price not set' })}
            </div>
          )}

          {orderRangeText ? (
            <div className="pricing-plan-preview__order-range">
              <Activity size={14} className="pricing-plan-preview__order-icon" aria-hidden="true" />
              <span>{orderRangeText}</span>
            </div>
          ) : null}
        </div>

        <div className="pricing-plan-preview__features-section">
          {previewFeatures.length === 0 ? (
            <div className="pricing-plan-preview__no-features">
              {t('No features configured yet.', { defaultValue: 'No features configured yet.' })}
            </div>
          ) : (
            <ul className="pricing-plan-preview__features-list">
              {previewFeatures.map((feature, idx) => (
                <li
                  key={feature.clientKey || feature.id || `prev-${idx}`}
                  className={`pricing-plan-preview__feature-item ${
                    feature.is_included
                      ? 'pricing-plan-preview__feature-item--included'
                      : 'pricing-plan-preview__feature-item--excluded'
                  }`}
                >
                  {feature.is_included ? (
                    <CheckCircle2
                      size={18}
                      className="pricing-plan-preview__check-icon"
                      aria-hidden="true"
                    />
                  ) : (
                    <XCircle
                      size={18}
                      className="pricing-plan-preview__x-icon"
                      aria-hidden="true"
                    />
                  )}
                  <span className="pricing-plan-preview__feature-text">{feature.label}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="pricing-plan-preview__cta-container">
          <button
            type="button"
            className="pricing-plan-preview__cta-btn"
            disabled
            tabIndex={-1}
            aria-hidden="true"
          >
            {requiresContact
              ? t('Contact Us', { defaultValue: 'Contact Us' })
              : t('Subscribe', { defaultValue: 'Subscribe' })}
          </button>
        </div>
      </div>
    </aside>
  )
}
