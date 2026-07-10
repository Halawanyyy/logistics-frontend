import { useMemo, useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Building, Palette, Settings, Printer, Globe, Save } from 'lucide-react'
import {
  getLabelSettings,
  listLabelTemplates,
  previewLabelDocument,
  testLabelDocument,
} from '../../../shared/api/labels.api'
import { getApiErrorMessage } from '../../../shared/api/api-error'
import { BrandMark } from '../../../shared/components/branding/BrandMark'
import { EmptyState } from '../../../shared/components/feedback/EmptyState'
import { ErrorState } from '../../../shared/components/feedback/ErrorState'
import { LoadingState } from '../../../shared/components/feedback/LoadingState'
import { FieldError } from '../../../shared/components/forms/FieldError'
import { useFormApiErrors } from '../../../shared/hooks/useFormApiErrors'
import { LabelDocumentDialog } from '../../../shared/components/labels/LabelDocumentDialog'
import { Button } from '../../../shared/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/Card'
import { Input } from '../../../shared/components/ui/Input'
import { PageHeader } from '../../../shared/components/ui/PageHeader'
import { Select } from '../../../shared/components/ui/Select'
import { isImageLikeValue, useBranding } from '../../../shared/branding/useBranding'
import {
  bulkUpdateSettings,
  getSettingsGroup,
  listPublicSettings,
  listSettingsGroups,
} from '../api/settings.api'
import type { SettingRecord } from '../types/settings.types'
import { cn } from '../../../shared/utils/cn'

import type { TFunction } from 'i18next'

const SETTINGS_LABEL_MAP: Record<string, string> = {
  packaging_fee_auto_charge: 'Packaging Fee Auto Charge',
  merchant_shop_enabled: 'Merchant Shop Enabled',
  merchant_shop_show_storage_fees: 'Show Storage Fees in Merchant Shop',
  merchant_shop_show_pick_pack_fees: 'Show Pick & Pack Fees in Merchant Shop',
  merchant_shop_show_packaging_products: 'Show Packaging Products in Merchant Shop',
}

function getSettingLabel(setting: SettingRecord, t: TFunction) {
  const mapped = SETTINGS_LABEL_MAP[setting.key]
  return mapped ? t(mapped, { defaultValue: mapped }) : setting.label
}

function getFieldValue(value: unknown) {
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false'
  }

  if (Array.isArray(value)) {
    return value.join(', ')
  }

  return value == null ? '' : String(value)
}

function formatGroupLabel(group: string) {
  return group
    .split(/[_-]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function isLogoSetting(key: string, label: string) {
  return /logo|brand/i.test(`${key} ${label}`)
}

function isBooleanSetting(setting: SettingRecord) {
  return setting.type === 'boolean' || typeof setting.value === 'boolean'
}

function isNumericSetting(setting: SettingRecord) {
  return ['integer', 'number', 'float', 'decimal'].includes(setting.type)
}

function isCompanyGroup(group: string) {
  return /company|branding|general|public|support/i.test(group)
}

function getGroupIcon(group: string) {
  if (/company/i.test(group)) return Building
  if (/branding/i.test(group)) return Palette
  if (/public/i.test(group)) return Globe
  return Settings
}

function getInputType(setting: SettingRecord) {
  if (isLogoSetting(setting.key, setting.label) || /website|url/i.test(setting.key)) {
    return 'url'
  }

  if (/email/i.test(setting.key)) {
    return 'email'
  }

  if (/phone/i.test(setting.key)) {
    return 'tel'
  }

  if (isNumericSetting(setting)) {
    return 'number'
  }

  return 'text'
}

function normalizeSettingValue(setting: SettingRecord, rawValue: string) {
  if (isBooleanSetting(setting)) {
    return rawValue === 'true'
  }

  if (Array.isArray(setting.value) || setting.type === 'array') {
    return rawValue
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)
  }

  if (isNumericSetting(setting)) {
    if (!rawValue.trim()) {
      return null
    }

    const parsed = Number(rawValue)
    return Number.isFinite(parsed) ? parsed : rawValue
  }

  return rawValue
}

function getSettingFieldError(
  setting: SettingRecord,
  index: number,
  fieldErrors: Record<string, string[]>,
) {
  return (
    fieldErrors[setting.key]?.[0] ??
    fieldErrors[`settings.${index}.value`]?.[0] ??
    fieldErrors[`settings.${index}.${setting.key}`]?.[0] ??
    null
  )
}

export function SettingsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const branding = useBranding()
  const [activeTab, setActiveTab] = useState('')
  const [draftValues, setDraftValues] = useState<Record<string, string>>({})
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null)

  const groupsQuery = useQuery({
    queryKey: ['settings', 'groups'],
    queryFn: listSettingsGroups,
  })
  
  const publicSettingsQuery = useQuery({
    queryKey: ['settings', 'public'],
    queryFn: listPublicSettings,
  })
  
  const labelTemplatesQuery = useQuery({
    queryKey: ['labels', 'templates'],
    queryFn: listLabelTemplates,
  })
  
  const labelSettingsQuery = useQuery({
    queryKey: ['labels', 'settings'],
    queryFn: getLabelSettings,
  })

  const groups = groupsQuery.data?.data ?? []
  
  useEffect(() => {
    if (groups.length > 0 && !activeTab) {
      setActiveTab(groups[0].group)
    }
  }, [groups, activeTab])

  const isApiGroup = activeTab !== 'label-tools' && activeTab !== 'public-details'
  
  const groupQuery = useQuery({
    queryKey: ['settings', 'group', activeTab],
    queryFn: () => getSettingsGroup(activeTab),
    enabled: Boolean(activeTab) && isApiGroup,
  })

  const mutation = useMutation({
    mutationFn: bulkUpdateSettings,
    onSuccess: async () => {
      setLastSavedAt(Date.now())
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['settings'] }),
        queryClient.invalidateQueries({ queryKey: ['settings', 'public'] }),
      ])
    },
  })

  const { formError, normalizedError } = useFormApiErrors(mutation.error)
  const fieldErrors = normalizedError?.fieldErrors ?? {}
  
  const settings = groupQuery.data?.data ?? []
  const publicSettings = publicSettingsQuery.data?.data ?? []

  const editableSettings = useMemo(
    () => settings.filter((setting) => setting.is_editable).sort((a, b) => a.sort_order - b.sort_order),
    [settings],
  )

  const companyNameSetting = editableSettings.find((setting) => setting.key === 'company_name')
  const logoSetting = editableSettings.find((setting) => isLogoSetting(setting.key, setting.label))
  const previewCompanyName = companyNameSetting
    ? ((draftValues[companyNameSetting.key] ?? getFieldValue(companyNameSetting.value)) || branding.companyName)
    : branding.companyName
  const previewLogoValue = logoSetting
    ? draftValues[logoSetting.key] ?? getFieldValue(logoSetting.value)
    : branding.companyLogo
  const selectedGroupLabel = isApiGroup ? formatGroupLabel(activeTab) : ''

  function currentValue(key: string, fallback: unknown) {
    return draftValues[key] ?? getFieldValue(fallback)
  }

  function submitGroup() {
    mutation.mutate({
      settings: editableSettings.map((setting) => ({
        key: setting.key,
        value: normalizeSettingValue(setting, currentValue(setting.key, setting.value)),
      })),
    })
  }

  function handleTabChange(tab: string) {
    setActiveTab(tab)
    setDraftValues({})
    setLastSavedAt(null)
  }

  if (groupsQuery.isLoading) {
    return <LoadingState title={t('Loading settings')} />
  }

  if (groupsQuery.isError || !groupsQuery.data) {
    return <ErrorState message={getApiErrorMessage(groupsQuery.error)} onRetry={() => void groupsQuery.refetch()} />
  }

  return (
    <section className="page-section settings-page">
      <PageHeader
        title={t('Settings')}
        eyebrow={t('Workspace Setup', { defaultValue: 'Workspace Setup' })}
        description={t('Manage company identity, operational preferences, and label tools from one clean control center.', {
          defaultValue: 'Manage company identity, operational preferences, and label tools from one clean control center.',
        })}
      />

      <div className="settings-layout">
        <aside className="settings-sidebar">
          <nav className="settings-nav-menu">
            {groups.map((group) => {
              const Icon = getGroupIcon(group.group)
              const isActive = activeTab === group.group
              return (
                <button
                  key={group.group}
                  className={cn('settings-nav-item', isActive && 'settings-nav-item--active')}
                  onClick={() => handleTabChange(group.group)}
                >
                  <Icon size={18} />
                  <span>{formatGroupLabel(group.group)}</span>
                </button>
              )
            })}
            
            <div style={{ height: '1px', background: 'var(--border)', margin: '0.75rem 0' }} />
            
            <button
              className={cn('settings-nav-item', activeTab === 'label-tools' && 'settings-nav-item--active')}
              onClick={() => handleTabChange('label-tools')}
            >
              <Printer size={18} />
              <span>{t('Label & Printing Tools')}</span>
            </button>
            <button
              className={cn('settings-nav-item', activeTab === 'public-details' && 'settings-nav-item--active')}
              onClick={() => handleTabChange('public-details')}
            >
              <Globe size={18} />
              <span>{t('Live Public Details')}</span>
            </button>
          </nav>
        </aside>

        <main className="settings-content">
          {isApiGroup && isCompanyGroup(activeTab) ? (
            <Card className="settings-brand-card">
              <CardHeader>
                <CardTitle>{t('Company Identity Overview', { defaultValue: 'Company Identity Overview' })}</CardTitle>
                <CardDescription>
                  {t('This is how your storefront name, support details, and logo currently appear across the admin experience.', {
                    defaultValue: 'This is how your storefront name, support details, and logo currently appear across the admin experience.',
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent className="settings-brand-card__content">
                <div className="settings-brand-card__preview">
                  <BrandMark logoUrl={previewLogoValue} name={previewCompanyName} size="lg" />
                  <div>
                    <strong>{previewCompanyName}</strong>
                    <p>{branding.companyWebsite || branding.companyEmail || t('Public company branding preview', { defaultValue: 'Public company branding preview' })}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {isApiGroup ? (
            <>
              {groupQuery.isLoading ? <LoadingState title={t('Loading settings group')} /> : null}
              {groupQuery.isError ? <ErrorState message={getApiErrorMessage(groupQuery.error)} onRetry={() => void groupQuery.refetch()} /> : null}

              {!groupQuery.isLoading && !groupQuery.isError ? (
                <div className="page-stack">
                  <Card className="settings-editor-card">
                    <CardHeader>
                      <CardTitle>{t('{{group}} settings', { group: selectedGroupLabel, defaultValue: `${selectedGroupLabel} settings` })}</CardTitle>
                      <CardDescription>
                        {isCompanyGroup(activeTab)
                          ? t('Use this section to refine brand-facing fields and everyday operational details.', {
                            defaultValue: 'Use this section to refine brand-facing fields and everyday operational details.',
                          })
                          : t('Review each setting carefully before saving. Locked fields stay read-only here.', {
                            defaultValue: 'Review each setting carefully before saving. Locked fields stay read-only here.',
                          })}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="page-stack">
                      {!settings.length ? (
                        <EmptyState
                          title={t('No settings found')}
                          description={t('The selected group returned no settings.', { defaultValue: 'The selected group returned no settings.' })}
                        />
                      ) : null}

                      {lastSavedAt ? (
                        <div className="form-success">
                          {t('Settings saved and shared branding queries refreshed.', {
                            defaultValue: 'Settings saved and shared branding queries refreshed.',
                          })}
                        </div>
                      ) : null}

                      {settings.length ? (
                        <div className="settings-form-grid">
                          {settings
                            .sort((a, b) => a.sort_order - b.sort_order)
                            .map((setting, index) => {
                              const value = currentValue(setting.key, setting.value)
                              const logoField = isLogoSetting(setting.key, setting.label)
                              const imagePreviewVisible = logoField && value && isImageLikeValue(value)

                              return (
                                <label className={logoField ? 'field field--logo-setting' : 'field'} key={setting.id}>
                                  <span>{getSettingLabel(setting, t)}</span>
                                  {setting.options?.length ? (
                                    <Select
                                      disabled={!setting.is_editable}
                                      value={value}
                                      onChange={(event) => {
                                        setDraftValues((current) => ({ ...current, [setting.key]: event.target.value }))
                                        setLastSavedAt(null)
                                      }}
                                    >
                                      {setting.options.map((option) => (
                                        <option key={option} value={option}>
                                          {option}
                                        </option>
                                      ))}
                                    </Select>
                                  ) : isBooleanSetting(setting) ? (
                                    <Select
                                      disabled={!setting.is_editable}
                                      value={value}
                                      onChange={(event) => {
                                        setDraftValues((current) => ({ ...current, [setting.key]: event.target.value }))
                                        setLastSavedAt(null)
                                      }}
                                    >
                                      <option value="true">{t('Yes', { defaultValue: 'Yes' })}</option>
                                      <option value="false">{t('No', { defaultValue: 'No' })}</option>
                                    </Select>
                                  ) : (
                                    <Input
                                      disabled={!setting.is_editable}
                                      type={getInputType(setting)}
                                      value={value}
                                      onChange={(event) => {
                                        setDraftValues((current) => ({ ...current, [setting.key]: event.target.value }))
                                        setLastSavedAt(null)
                                      }}
                                    />
                                  )}

                                  {imagePreviewVisible ? (
                                    <div className="settings-logo-preview">
                                      <BrandMark logoUrl={value} name={previewCompanyName} size="md" />
                                      <div>
                                        <strong>{t('Logo preview', { defaultValue: 'Logo preview' })}</strong>
                                        <p>{t('This preview uses the current URL/path value and falls back safely if the image cannot load.', {
                                          defaultValue: 'This preview uses the current URL/path value and falls back safely if the image cannot load.',
                                        })}</p>
                                      </div>
                                    </div>
                                  ) : null}

                                  {setting.description ? <small className="field-help">{setting.description}</small> : null}
                                  {logoField ? (
                                    <small className="field-help">
                                      {t('Use a public image URL or shared asset path so the logo preview can appear everywhere the brand is shown.', {
                                        defaultValue: 'Use a public image URL or shared asset path so the logo preview can appear everywhere the brand is shown.',
                                      })}
                                    </small>
                                  ) : null}
                                  <FieldError error={getSettingFieldError(setting, index, fieldErrors) ?? undefined} />
                                </label>
                              )
                            })}
                        </div>
                      ) : null}

                      {formError ? <div className="form-error">{formError}</div> : null}
                    </CardContent>
                  </Card>

                  {editableSettings.length > 0 ? (
                    <div className="settings-sticky-save">
                      <Button
                        loading={mutation.isPending}
                        onClick={submitGroup}
                      >
                        <Save size={16} className="icon-start" />
                        {t('Save Changes', { defaultValue: 'Save Changes' })}
                      </Button>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </>
          ) : null}

          {activeTab === 'label-tools' ? (
            <Card className="settings-tools-card">
              <CardHeader>
                <CardTitle>{t('Label & Printing Tools', { defaultValue: 'Label & Printing Tools' })}</CardTitle>
                <CardDescription>
                  {t('Preview and test shipment labels with the same branded layout used for daily operations.', {
                    defaultValue: 'Preview and test shipment labels with the same branded layout used for daily operations.',
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent className="page-stack">
                <div className="settings-tools-grid">
                  <Card variant="flat" className="settings-tool-card">
                    <CardHeader>
                      <CardTitle>{t('Preview Shipment Label', { defaultValue: 'Preview Shipment Label' })}</CardTitle>
                      <CardDescription>
                        {t('Open the current shipment label layout and review spacing, barcode rendering, and translations.', {
                          defaultValue: 'Open the current shipment label layout and review spacing, barcode rendering, and translations.',
                        })}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="page-stack">
                      <LabelDocumentDialog
                        defaultFormat="html"
                        fetchDocument={(options) => previewLabelDocument({ label_type: 'shipment', ...options })}
                        title={t('Label Preview', { defaultValue: 'Label Preview' })}
                        triggerLabel={t('Open Preview', { defaultValue: 'Open Preview' })}
                      />
                    </CardContent>
                  </Card>

                  <Card variant="flat" className="settings-tool-card">
                    <CardHeader>
                      <CardTitle>{t('Test Shipment Label', { defaultValue: 'Test Shipment Label' })}</CardTitle>
                      <CardDescription>
                        {t('Generate a test document to validate label content before using it in day-to-day workflows.', {
                          defaultValue: 'Generate a test document to validate label content before using it in day-to-day workflows.',
                        })}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="page-stack">
                      <LabelDocumentDialog
                        defaultFormat="html"
                        fetchDocument={(options) => testLabelDocument({ label_type: 'shipment', ...options })}
                        title={t('Label Test', { defaultValue: 'Label Test' })}
                        triggerLabel={t('Run Test', { defaultValue: 'Run Test' })}
                      />
                    </CardContent>
                  </Card>
                </div>

                {labelTemplatesQuery.isLoading || labelSettingsQuery.isLoading ? <LoadingState title={t('Loading label tools')} /> : null}
                {labelTemplatesQuery.isError ? <ErrorState message={getApiErrorMessage(labelTemplatesQuery.error)} onRetry={() => void labelTemplatesQuery.refetch()} /> : null}
                {labelSettingsQuery.isError ? <ErrorState message={getApiErrorMessage(labelSettingsQuery.error)} onRetry={() => void labelSettingsQuery.refetch()} /> : null}

                {!labelTemplatesQuery.isLoading && !labelTemplatesQuery.isError ? (
                  <div className="detail-list settings-tool-metrics">
                    <div>
                      <dt>{t('Templates')}</dt>
                      <dd>{labelTemplatesQuery.data?.data.length ?? 0}</dd>
                    </div>
                    <div>
                      <dt>{t('Label Settings')}</dt>
                      <dd>{labelSettingsQuery.data?.data.length ?? 0}</dd>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {activeTab === 'public-details' ? (
            <Card className="settings-public-card">
              <CardHeader>
                <CardTitle>{t('Live Customer-Facing Details', { defaultValue: 'Live Customer-Facing Details' })}</CardTitle>
                <CardDescription>
                  {t('Review the details customers and public-facing screens currently use. These values are read-only here.', {
                    defaultValue: 'Review the details customers and public-facing screens currently use. These values are read-only here.',
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent className="page-stack">
                <div className="settings-guidance">
                  <p>
                    {t('Use the editable settings groups above to update company identity and support details. This section simply reflects the live customer-facing result.', {
                      defaultValue: 'Use the editable settings groups above to update company identity and support details. This section simply reflects the live customer-facing result.',
                    })}
                  </p>
                </div>

                <div className="settings-public-brand">
                  <BrandMark logoUrl={branding.companyLogo} name={branding.companyName} size="lg" />
                  <div>
                    <strong>{branding.companyName}</strong>
                    <p>{branding.companyAddress || branding.companyPhone || t('Live public brand details shown to customers.', {
                      defaultValue: 'Live public brand details shown to customers.',
                    })}</p>
                  </div>
                </div>

                {publicSettingsQuery.isLoading ? <LoadingState title={t('Loading public settings')} /> : null}
                {publicSettingsQuery.isError ? <ErrorState message={getApiErrorMessage(publicSettingsQuery.error)} onRetry={() => void publicSettingsQuery.refetch()} /> : null}
                {!publicSettingsQuery.isLoading && !publicSettingsQuery.isError && !publicSettings.length ? (
                  <EmptyState title={t('No public settings')} description={t('The backend returned no public settings.')} />
                ) : null}
                {publicSettings.length ? (
                  <div className="detail-list">
                    {publicSettings.map((setting) => (
                      <div key={setting.key}>
                        <dt>{getSettingLabel(setting as SettingRecord, t)}</dt>
                        <dd className="settings-public-value">
                          {isLogoSetting(setting.key, setting.label) && typeof setting.value === 'string' && setting.value && isImageLikeValue(setting.value) ? (
                            <BrandMark className="settings-public-logo" logoUrl={setting.value} name={branding.companyName} size="md" />
                          ) : null}
                          <span title={getFieldValue(setting.value)}>{getFieldValue(setting.value)}</span>
                        </dd>
                      </div>
                    ))}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : null}
        </main>
      </div>
    </section>
  )
}
