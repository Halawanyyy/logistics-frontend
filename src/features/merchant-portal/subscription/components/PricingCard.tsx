import { Check, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { BillingCycle, SubscriptionPlan } from '../types/subscription.types'
import { buildPricingGmailUrl } from '../utils/pricingGmailUrl'

interface PricingCardProps {
  plan: SubscriptionPlan
  billingCycle: BillingCycle
  isCurrentPlan: boolean
  contactEmail?: string | null
  merchantName?: string
  merchantEmail?: string
  onSubscribe: () => void
  isSubscribing: boolean
}

export function PricingCard({
  plan,
  billingCycle,
  isCurrentPlan,
  contactEmail,
  merchantName,
  merchantEmail,
  onSubscribe,
  isSubscribing,
}: PricingCardProps) {
  const { t } = useTranslation()
  const isCustomPricing = Boolean(plan.requires_contact || plan.is_custom_pricing)
  const price = billingCycle === 'monthly' ? plan.monthly_price : plan.yearly_price
  const period = billingCycle === 'monthly'
    ? t('month', { defaultValue: 'month' })
    : t('year', { defaultValue: 'year' })

  const formattedPrice = price === null || price === undefined
    ? '—'
    : Number(price).toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      })

  const gmailUrl = contactEmail && isCustomPricing
    ? buildPricingGmailUrl({
        recipient: contactEmail,
        planName: plan.name,
        merchantName,
        merchantEmail,
      })
    : ''

  return (
    <article
      className={`pricing-card ${plan.is_popular ? 'pricing-card--popular' : ''} ${isCurrentPlan ? 'pricing-card--current' : ''}`}
    >
      {(plan.is_popular || isCurrentPlan) ? (
        <div className="pricing-card__badges">
          {plan.is_popular ? (
            <span className="pricing-card__badge">{t('Most Popular', { defaultValue: 'Most Popular' })}</span>
          ) : null}
          {isCurrentPlan ? (
            <span className="pricing-card__badge pricing-card__badge--current">
              {t('Current Plan', { defaultValue: 'Current Plan' })}
            </span>
          ) : null}
        </div>
      ) : null}

      <h3 className="pricing-card__name">{plan.name}</h3>
      <p className="pricing-card__description">{plan.description || '—'}</p>

      {isCustomPricing ? (
        <p className="pricing-card__custom-label">{t('Custom pricing', { defaultValue: 'Custom pricing' })}</p>
      ) : (
        <div className="pricing-card__price">
          <span className="pricing-card__amount">{plan.currency || 'EGP'} {formattedPrice}</span>
          <span className="pricing-card__period">/ {period}</span>
        </div>
      )}

      <ul className="pricing-card__features">
        {(plan.features ?? []).map((feature, index) => {
          const isIncluded = feature.is_included ?? true
          const key = feature.id ?? `${feature.label}-${index}`

          return (
            <li
              key={key}
              className={`pricing-card__feature ${isIncluded ? 'pricing-card__feature--included' : 'pricing-card__feature--excluded'}`}
            >
              <span
                className={`pricing-card__feature-icon ${isIncluded ? 'pricing-card__feature-icon--included' : 'pricing-card__feature-icon--excluded'}`}
                aria-hidden="true"
              >
                {isIncluded ? (
                  <Check size={13} strokeWidth={3} />
                ) : (
                  <X size={13} strokeWidth={3} />
                )}
              </span>
              <span className="sr-only">
                {isIncluded
                  ? t('Included: ', { defaultValue: 'Included: ' })
                  : t('Not included: ', { defaultValue: 'Not included: ' })}
              </span>
              <span className="pricing-card__feature-label">{feature.label}</span>
            </li>
          )
        })}
      </ul>

      {isCurrentPlan ? (
        <button className="pricing-card__cta pricing-card__cta--current" disabled type="button">
          {t('Current Plan', { defaultValue: 'Current Plan' })}
        </button>
      ) : isCustomPricing ? (
        contactEmail ? (
          <a
            href={gmailUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`pricing-card__cta pricing-card__cta--contact ${plan.is_popular ? 'pricing-card__cta--primary' : 'pricing-card__cta--default'}`}
          >
            {t('Contact Us', { defaultValue: 'Contact Us' })}
          </a>
        ) : (
          <button
            className="pricing-card__cta pricing-card__cta--default"
            disabled
            type="button"
            title={t('Contact email is not configured.', { defaultValue: 'Contact email is not configured.' })}
          >
            {t('Contact Us (Unavailable)', { defaultValue: 'Contact Us (Unavailable)' })}
          </button>
        )
      ) : (
        <button
          className={`pricing-card__cta ${plan.is_popular ? 'pricing-card__cta--primary' : 'pricing-card__cta--default'}`}
          disabled={isSubscribing}
          type="button"
          onClick={onSubscribe}
        >
          {isSubscribing
            ? t('Subscribing...', { defaultValue: 'Subscribing...' })
            : t('Subscribe', { defaultValue: 'Subscribe' })}
        </button>
      )}
    </article>
  )
}
