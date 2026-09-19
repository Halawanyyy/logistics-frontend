import { ArrowDown, ArrowUp, Check, GripVertical, ListChecks, Plus, Trash2, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '../../../shared/components/ui/Button'
import { Input } from '../../../shared/components/ui/Input'
import type { PricingPlanFeatureFormValue } from '../types/location-pricing.types'

type PlanFeaturesEditorProps = {
  value: PricingPlanFeatureFormValue[]
  onChange: (features: PricingPlanFeatureFormValue[]) => void
  errors?: Record<string, string[]>
  disabled?: boolean
}

export function PlanFeaturesEditor({
  value,
  onChange,
  errors = {},
  disabled = false,
}: PlanFeaturesEditorProps) {
  const { t } = useTranslation()

  function handleAddFeature() {
    if (disabled || value.length >= 50) return
    const nextSortOrder = value.length
    const newFeature: PricingPlanFeatureFormValue = {
      clientKey: `feat-temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      label: '',
      is_included: true,
      sort_order: nextSortOrder,
    }
    onChange([...value, newFeature])
  }

  function handleUpdateLabel(index: number, newLabel: string) {
    const updated = value.map((item, i) => (i === index ? { ...item, label: newLabel } : item))
    onChange(updated)
  }

  function handleToggleIncluded(index: number) {
    const updated = value.map((item, i) => (i === index ? { ...item, is_included: !item.is_included } : item))
    onChange(updated)
  }

  function handleRemove(index: number) {
    const updated = value
      .filter((_, i) => i !== index)
      .map((item, i) => ({ ...item, sort_order: i }))
    onChange(updated)
  }

  function handleMoveUp(index: number) {
    if (index === 0) return
    const updated = [...value]
    const current = updated[index]
    const previous = updated[index - 1]

    updated[index - 1] = { ...current, sort_order: index - 1 }
    updated[index] = { ...previous, sort_order: index }
    onChange(updated)
  }

  function handleMoveDown(index: number) {
    if (index === value.length - 1) return
    const updated = [...value]
    const current = updated[index]
    const next = updated[index + 1]

    updated[index + 1] = { ...current, sort_order: index + 1 }
    updated[index] = { ...next, sort_order: index }
    onChange(updated)
  }

  return (
    <div className="plan-features-editor">
      <div className="plan-features-editor__header">
        <div className="plan-features-editor__header-title-group">
          <div className="pricing-plan-editor__icon-box" aria-hidden="true">
            <ListChecks size={18} />
          </div>
          <div>
            <h3 className="plan-features-editor__title">
              {t('Plan Features', { defaultValue: 'Plan Features' })}
            </h3>
            <p className="plan-features-editor__subtitle">
              {t('Add the benefits and limitations displayed on the merchant pricing card.', {
                defaultValue: 'Add the benefits and limitations displayed on the merchant pricing card.',
              })}
            </p>
          </div>
        </div>

        <button
          type="button"
          className="plan-features-editor__add-btn"
          onClick={handleAddFeature}
          disabled={disabled || value.length >= 50}
        >
          <Plus size={15} aria-hidden="true" />
          <span>{t('Add Feature', { defaultValue: 'Add Feature' })}</span>
        </button>
      </div>

      {value.length === 0 ? (
        <div className="plan-features-editor__empty">
          <p>{t('No features added yet.', { defaultValue: 'No features added yet.' })}</p>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={handleAddFeature}
            disabled={disabled}
          >
            <Plus size={14} aria-hidden="true" />
            <span>{t('Add Feature', { defaultValue: 'Add Feature' })}</span>
          </Button>
        </div>
      ) : (
        <div className="plan-features-editor__list" role="list">
          {value.map((feature, index) => {
            const labelError = errors[`features.${index}.label`]?.[0]
            const idError = errors[`features.${index}.id`]?.[0]
            const isFirst = index === 0
            const isLast = index === value.length - 1

            return (
              <div
                key={feature.clientKey || feature.id || `row-${index}`}
                className="plan-features-editor__row"
                role="listitem"
              >
                <div className="plan-features-editor__reorder-handle" title={t('Reorder feature')}>
                  <GripVertical size={16} className="plan-features-editor__grip-icon" aria-hidden="true" />
                  <div className="plan-features-editor__reorder-btns" role="group" aria-label={t('Reorder controls')}>
                    <button
                      type="button"
                      className="plan-features-editor__move-btn"
                      onClick={() => handleMoveUp(index)}
                      disabled={disabled || isFirst}
                      aria-label={t('Move feature up')}
                      title={t('Move feature up')}
                    >
                      <ArrowUp size={12} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="plan-features-editor__move-btn"
                      onClick={() => handleMoveDown(index)}
                      disabled={disabled || isLast}
                      aria-label={t('Move feature down')}
                      title={t('Move feature down')}
                    >
                      <ArrowDown size={12} aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <div className="plan-features-editor__input-container">
                  <Input
                    placeholder={t('Enter a plan feature', {
                      defaultValue: 'Enter a plan feature',
                    })}
                    value={feature.label}
                    onChange={(e) => handleUpdateLabel(index, e.target.value)}
                    disabled={disabled}
                    aria-label={t('Feature label {{index}}', {
                      index: index + 1,
                      defaultValue: `Feature label ${index + 1}`,
                    })}
                  />
                  {labelError ? (
                    <small className="plan-features-editor__error">{t(labelError)}</small>
                  ) : null}
                  {idError ? (
                    <small className="plan-features-editor__error">{t(idError)}</small>
                  ) : null}
                </div>

                <div className="plan-features-editor__controls">
                  <button
                    type="button"
                    className={`plan-features-editor__toggle ${
                      feature.is_included
                        ? 'plan-features-editor__toggle--included'
                        : 'plan-features-editor__toggle--excluded'
                    }`}
                    onClick={() => handleToggleIncluded(index)}
                    disabled={disabled}
                    title={feature.is_included ? t('Click to exclude') : t('Click to include')}
                    aria-pressed={feature.is_included}
                  >
                    {feature.is_included ? (
                      <>
                        <Check size={14} strokeWidth={3} aria-hidden="true" />
                        <span>{t('Included', { defaultValue: 'Included' })}</span>
                      </>
                    ) : (
                      <>
                        <X size={14} strokeWidth={3} aria-hidden="true" />
                        <span>{t('Not included', { defaultValue: 'Not included' })}</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    className="plan-features-editor__delete-btn"
                    onClick={() => handleRemove(index)}
                    disabled={disabled}
                    aria-label={t('Delete feature')}
                    title={t('Delete feature')}
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </div>
              </div>
            )
          })}

          <button
            type="button"
            className="plan-features-editor__add-another-btn"
            onClick={handleAddFeature}
            disabled={disabled || value.length >= 50}
          >
            <Plus size={15} aria-hidden="true" />
            <span>{t('Add another feature', { defaultValue: 'Add another feature' })}</span>
          </button>
        </div>
      )}
    </div>
  )
}
