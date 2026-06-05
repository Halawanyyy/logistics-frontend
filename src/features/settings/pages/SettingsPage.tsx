import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
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
import { SearchableSelect } from '../../../shared/components/ui/SearchableSelect'
import { Select } from '../../../shared/components/ui/Select'
import { isImageLikeValue, useBranding } from '../../../shared/branding/useBranding'
import {
  bulkUpdateSettings,
  getSettingsGroup,
  listPublicSettings,
  listSettingsGroups,
} from '../api/settings.api'
import type { SettingRecord } from '../types/settings.types'

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
  const [selectedGroup, setSelectedGroup] = useState('')
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

  const groupQuery = useQuery({
    queryKey: ['settings', 'group', selectedGroup],
    queryFn: () => getSettingsGroup(selectedGroup),
    enabled: Boolean(selectedGroup),
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
  const groups = groupsQuery.data?.data ?? []
  const settings = groupQuery.data?.data ?? []

  const suggestedGroups = useMemo(
    () => groups.filter((group) => isCompanyGroup(group.group)),
    [groups],
  )

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

  function handleGroupChange(group: string) {
    setSelectedGroup(group)
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
        description={t('Manage live company branding, operational defaults, and public-facing configuration from documented backend settings groups.', {
          defaultValue: 'Manage live company branding, operational defaults, and public-facing configuration from documented backend settings groups.',
        })}
        actions={(
          <Button
            disabled={!selectedGroup || !editableSettings.length}
            loading={mutation.isPending}
            onClick={submitGroup}
          >
            {t('Save Group')}
          </Button>
        )}
      />

      <div className="settings-overview-grid">
        <Card className="settings-brand-card">
          <CardHeader>
            <CardTitle>{t('Company Branding', { defaultValue: 'Company Branding' })}</CardTitle>
            <CardDescription>
              {t('The sidebar, topbar, login experience, and public preview all read from the same live company settings.', {
                defaultValue: 'The sidebar, topbar, login experience, and public preview all read from the same live company settings.',
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
            <div className="settings-brand-card__meta">
              <span>{t('Logo source is currently URL/string based from the documented settings API.', {
                defaultValue: 'Logo source is currently URL/string based from the documented settings API.',
              })}</span>
              <span>{t('Changes here propagate through shared React Query invalidation after save.', {
                defaultValue: 'Changes here propagate through shared React Query invalidation after save.',
              })}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="table-card">
          <CardHeader className="table-card__header">
            <CardTitle>{t('Settings Groups')}</CardTitle>
            <CardDescription>{t('Select a group to edit its configurable settings.')}</CardDescription>
          </CardHeader>
          <CardContent className="page-stack">
            <label className="field">
              <span>{t('Group')}</span>
              <SearchableSelect
                value={selectedGroup}
                placeholder={t('Select a group')}
                searchPlaceholder={t('Search settings groups...')}
                onChange={handleGroupChange}
                options={[
                  { label: t('Select a group'), value: '' },
                  ...groups.map((group) => ({
                    label: `${formatGroupLabel(group.group)} (${group.settings_count})`,
                    value: group.group,
                    keywords: [group.group],
                  })),
                ]}
              />
            </label>

            {suggestedGroups.length ? (
              <div className="settings-quick-links">
                {suggestedGroups.map((group) => (
                  <Button
                    key={group.group}
                    size="sm"
                    variant={selectedGroup === group.group ? 'primary' : 'secondary'}
                    onClick={() => handleGroupChange(group.group)}
                  >
                    {t('Manage {{group}}', { group: formatGroupLabel(group.group), defaultValue: `Manage ${formatGroupLabel(group.group)}` })}
                  </Button>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {groupQuery.isLoading ? <LoadingState title={t('Loading settings group')} /> : null}
      {groupQuery.isError ? <ErrorState message={getApiErrorMessage(groupQuery.error)} onRetry={() => void groupQuery.refetch()} /> : null}

      {selectedGroup && !groupQuery.isLoading && !groupQuery.isError ? (
        <Card className="settings-editor-card">
          <CardHeader>
            <CardTitle>{t('{{group}} settings', { group: formatGroupLabel(selectedGroup), defaultValue: `${formatGroupLabel(selectedGroup)} settings` })}</CardTitle>
            <CardDescription>
              {isCompanyGroup(selectedGroup)
                ? t('Company name updates globally after save. Company logo currently uses the documented string/URL setting flow.', {
                  defaultValue: 'Company name updates globally after save. Company logo currently uses the documented string/URL setting flow.',
                })
                : t('Encrypted values stay masked and non-editable settings remain disabled.')}
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
                        <span>{setting.label}</span>
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
                            {t('Documented backend support currently exposes company_logo as a settings value. Use an image URL or public path here; a binary logo upload endpoint is not documented for settings.', {
                              defaultValue: 'Documented backend support currently exposes company_logo as a settings value. Use an image URL or public path here; a binary logo upload endpoint is not documented for settings.',
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
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{t('Label Tools')}</CardTitle>
          <CardDescription>
            {t('Label preview/test utilities and backend-managed label settings/templates.')}
          </CardDescription>
        </CardHeader>
        <CardContent className="page-stack">
          <div className="page-header__button-row">
            <LabelDocumentDialog
              defaultFormat="html"
              fetchDocument={(options) => previewLabelDocument({ label_type: 'shipment', ...options })}
              title="Label Preview"
              triggerLabel="Preview Shipment Label"
            />
            <LabelDocumentDialog
              defaultFormat="html"
              fetchDocument={(options) => testLabelDocument({ label_type: 'shipment', ...options })}
              title="Label Test"
              triggerLabel="Test Shipment Label"
            />
          </div>

          {labelTemplatesQuery.isLoading || labelSettingsQuery.isLoading ? <LoadingState title={t('Loading label tools')} /> : null}
          {labelTemplatesQuery.isError ? <ErrorState message={getApiErrorMessage(labelTemplatesQuery.error)} onRetry={() => void labelTemplatesQuery.refetch()} /> : null}
          {labelSettingsQuery.isError ? <ErrorState message={getApiErrorMessage(labelSettingsQuery.error)} onRetry={() => void labelSettingsQuery.refetch()} /> : null}

          {!labelTemplatesQuery.isLoading && !labelTemplatesQuery.isError ? (
            <div className="detail-list">
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

      <Card>
        <CardHeader>
          <CardTitle>{t('Public Settings')}</CardTitle>
          <CardDescription>
            {t('Publicly exposable settings from `/api/public/settings`. This section is read-only here.')}
          </CardDescription>
        </CardHeader>
        <CardContent className="page-stack">
          <div className="settings-guidance">
            <p>
              {t('Company name, logo, and support details are managed in the editable admin settings groups above. Public Settings shows the live public output, but editing should happen through the grouped settings form.')}
            </p>
          </div>

          <div className="settings-public-brand">
            <BrandMark logoUrl={branding.companyLogo} name={branding.companyName} size="lg" />
            <div>
              <strong>{branding.companyName}</strong>
              <p>{branding.companyAddress || branding.companyPhone || t('Live public brand output from the public settings endpoint.', {
                defaultValue: 'Live public brand output from the public settings endpoint.',
              })}</p>
            </div>
          </div>

          {publicSettingsQuery.isLoading ? <LoadingState title={t('Loading public settings')} /> : null}
          {publicSettingsQuery.isError ? <ErrorState message={getApiErrorMessage(publicSettingsQuery.error)} onRetry={() => void publicSettingsQuery.refetch()} /> : null}
          {!publicSettingsQuery.isLoading && !publicSettingsQuery.isError && !(publicSettingsQuery.data?.data.length) ? (
            <EmptyState title={t('No public settings')} description={t('The backend returned no public settings.')} />
          ) : null}
          {publicSettingsQuery.data?.data.length ? (
            <div className="detail-list">
              {publicSettingsQuery.data.data.map((setting) => (
                <div key={setting.key}>
                  <dt>{setting.label}</dt>
                  <dd className="settings-public-value">
                    {isLogoSetting(setting.key, setting.label) && typeof setting.value === 'string' && setting.value && isImageLikeValue(setting.value) ? (
                      <BrandMark className="settings-public-logo" logoUrl={setting.value} name={branding.companyName} size="md" />
                    ) : null}
                    <span>{getFieldValue(setting.value)}</span>
                  </dd>
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </section>
  )
}
