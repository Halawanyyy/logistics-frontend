import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { getApiErrorMessage } from '../../../shared/api/api-error'
import { FieldError } from '../../../shared/components/forms/FieldError'
import { FormActionsBar } from '../../../shared/components/forms/FormActionsBar'
import { ErrorState } from '../../../shared/components/states/ErrorState'
import { LoadingState } from '../../../shared/components/states/LoadingState'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/Card'
import { PageHeader } from '../../../shared/components/ui/PageHeader'
import { Select } from '../../../shared/components/ui/Select'
import { StatusBadge } from '../../../shared/components/ui/StatusBadge'
import { getMerchantPortalSettings, updateMerchantPortalSettings } from '../api/merchantPortal.api'
import { useMerchantPortalContext } from '../context/merchantPortal.context'
import type { UpdateMerchantPortalSettingsPayload } from '../types/merchantPortal.types'

export function MerchantSettingsPage() {
  const { t } = useTranslation()
  const { hasMerchantCapability } = useMerchantPortalContext()
  const queryClient = useQueryClient()
  const [successMessage, setSuccessMessage] = useState('')

  const canEdit = hasMerchantCapability('settings.update')
  const settingsQuery = useQuery({
    queryKey: ['merchant-portal-settings'],
    queryFn: getMerchantPortalSettings,
  })

  const mutation = useMutation({
    mutationFn: updateMerchantPortalSettings,
    onSuccess: async () => {
      setSuccessMessage(t('Settings updated successfully.', { defaultValue: 'Settings updated successfully.' }))
      await queryClient.invalidateQueries({ queryKey: ['merchant-portal-settings'] })
    },
    onError: (error: any) => {
      if (error.response?.status === 422) {
        const errors = error.response.data.errors ?? {}
        Object.keys(errors).forEach((key) => {
          setError(key as any, {
            type: 'manual',
            message: errors[key]?.[0],
          })
        })
      }
    },
  })

  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setError,
  } = useForm<UpdateMerchantPortalSettingsPayload>({
    defaultValues: {
      default_fulfillment_type: '',
      default_payment_type: '',
      default_pickup_address: '',
      default_label_format: '',
      notification_preferences: {
        email_enabled: false,
        sms_enabled: false,
        whatsapp_enabled: false,
        order_status_changed: false,
        shipment_status_changed: false,
        low_stock: false,
        inbound_request_status_changed: false,
        invoice_issued: false,
        payout_status_changed: false,
      },
    },
  })

  useEffect(() => {
    if (!settingsQuery.data?.data) {
      return
    }

    const settings = settingsQuery.data.data
    reset({
      default_fulfillment_type: settings.default_fulfillment_type ?? '',
      default_payment_type: settings.default_payment_type ?? '',
      default_pickup_address: settings.default_pickup_address ?? '',
      default_label_format: settings.default_label_format ?? '',
      notification_preferences: {
        email_enabled: settings.notification_preferences?.email_enabled ?? false,
        sms_enabled: settings.notification_preferences?.sms_enabled ?? false,
        whatsapp_enabled: settings.notification_preferences?.whatsapp_enabled ?? false,
        order_status_changed: settings.notification_preferences?.order_status_changed ?? false,
        shipment_status_changed: settings.notification_preferences?.shipment_status_changed ?? false,
        low_stock: settings.notification_preferences?.low_stock ?? false,
        inbound_request_status_changed: settings.notification_preferences?.inbound_request_status_changed ?? false,
        invoice_issued: settings.notification_preferences?.invoice_issued ?? false,
        payout_status_changed: settings.notification_preferences?.payout_status_changed ?? false,
      },
    })
  }, [reset, settingsQuery.data])

  const enabledNotificationCount = useMemo(() => {
    const preferences = settingsQuery.data?.data?.notification_preferences

    if (!preferences) {
      return 0
    }

    return Object.values(preferences).filter(Boolean).length
  }, [settingsQuery.data])

  if (settingsQuery.isLoading) {
    return <LoadingState title={t('Loading settings', { defaultValue: 'Loading settings' })} />
  }

  if (settingsQuery.isError || !settingsQuery.data?.data) {
    return (
      <ErrorState
        title={t('Failed to load settings.', { defaultValue: 'Failed to load settings.' })}
        message={getApiErrorMessage(settingsQuery.error)}
        onRetry={() => void settingsQuery.refetch()}
      />
    )
  }

  const settings = settingsQuery.data.data

  return (
    <section className="page-section">
      <PageHeader
        eyebrow={t('Merchant Portal', { defaultValue: 'Merchant Portal' })}
        title={t('Portal Settings', { defaultValue: 'Portal Settings' })}
        description={t('Manage your portal preferences and notifications.', {
          defaultValue: 'Manage your portal preferences and notifications.',
        })}
      />

      <div className="details-grid">
        <Card className="detail-card">
          <CardHeader>
            <CardTitle>{t('Settings Summary', { defaultValue: 'Settings Summary' })}</CardTitle>
            <CardDescription>
              {t('Read-only highlights of the merchant settings currently returned by the portal API.', {
                defaultValue: 'Read-only highlights of the merchant settings currently returned by the portal API.',
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="detail-list">
              <div>
                <dt>{t('Access Mode', { defaultValue: 'Access Mode' })}</dt>
                <dd>
                  <StatusBadge value={canEdit ? 'active' : 'read_only'}>
                    {canEdit ? t('Editable', { defaultValue: 'Editable' }) : t('Read Only', { defaultValue: 'Read Only' })}
                  </StatusBadge>
                </dd>
              </div>
              <div>
                <dt>{t('Default Fulfillment Type', { defaultValue: 'Default Fulfillment Type' })}</dt>
                <dd>{settings.default_fulfillment_type || '-'}</dd>
              </div>
              <div>
                <dt>{t('Default Payment Type', { defaultValue: 'Default Payment Type' })}</dt>
                <dd>{settings.default_payment_type || '-'}</dd>
              </div>
              <div>
                <dt>{t('Default Label Format', { defaultValue: 'Default Label Format' })}</dt>
                <dd>{settings.default_label_format || '-'}</dd>
              </div>
              <div>
                <dt>{t('Enabled Notifications', { defaultValue: 'Enabled Notifications' })}</dt>
                <dd>{enabledNotificationCount}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card className="table-card settings-editor-card">
          <CardHeader className="table-card__header">
            <div>
              <CardTitle>{t('General Preferences', { defaultValue: 'General Preferences' })}</CardTitle>
              <CardDescription>
                {t('Settings updates remain merchant-scoped and use only merchant portal preferences endpoints.', {
                  defaultValue: 'Settings updates remain merchant-scoped and use only merchant portal preferences endpoints.',
                })}
              </CardDescription>
            </div>
            <StatusBadge value={canEdit ? 'active' : 'read_only'}>
              {canEdit ? t('Editable', { defaultValue: 'Editable' }) : t('Read Only', { defaultValue: 'Read Only' })}
            </StatusBadge>
          </CardHeader>
          <CardContent>
            {!canEdit ? (
              <div className="table-meta">
                {t('You do not have permission to update settings.', {
                  defaultValue: 'You do not have permission to update settings.',
                })}
              </div>
            ) : null}
            {successMessage ? <div className="form-success">{successMessage}</div> : null}
            {mutation.error && Object.keys(errors).length === 0 ? (
              <div className="form-error">{getApiErrorMessage(mutation.error)}</div>
            ) : null}
            <form onSubmit={handleSubmit((values) => mutation.mutate(values))}>
              <div className="form-section form-section--panel">
                <div className="form-section__header">
                  <div className="form-section__header-copy">
                    <h3 className="form-section__title">{t('General Preferences', { defaultValue: 'General Preferences' })}</h3>
                    <p className="form-section__description">
                      {t('Set the default behavior used when merchants create and manage new work in the portal.', {
                        defaultValue: 'Set the default behavior used when merchants create and manage new work in the portal.',
                      })}
                    </p>
                  </div>
                </div>
                <div className="form-section__body settings-form-grid">
                  <label className="field">
                    <span>{t('Default Fulfillment Type', { defaultValue: 'Default Fulfillment Type' })}</span>
                    <Select disabled={!canEdit} {...register('default_fulfillment_type')}>
                      <option value="">{t('None', { defaultValue: 'None' })}</option>
                      <option value="delivery">{t('Delivery', { defaultValue: 'Delivery' })}</option>
                      <option value="pickup">{t('Pickup', { defaultValue: 'Pickup' })}</option>
                    </Select>
                    <FieldError error={errors.default_fulfillment_type?.message} />
                  </label>

                  <label className="field">
                    <span>{t('Default Payment Type', { defaultValue: 'Default Payment Type' })}</span>
                    <Select disabled={!canEdit} {...register('default_payment_type')}>
                      <option value="">{t('None', { defaultValue: 'None' })}</option>
                      <option value="cod">{t('Cash on Delivery (COD)', { defaultValue: 'Cash on Delivery (COD)' })}</option>
                      <option value="prepaid">{t('Prepaid', { defaultValue: 'Prepaid' })}</option>
                    </Select>
                    <FieldError error={errors.default_payment_type?.message} />
                  </label>

                  <label className="field">
                    <span>{t('Default Label Format', { defaultValue: 'Default Label Format' })}</span>
                    <Select disabled={!canEdit} {...register('default_label_format')}>
                      <option value="">{t('None', { defaultValue: 'None' })}</option>
                      <option value="pdf">PDF</option>
                      <option value="html">HTML</option>
                      <option value="zpl">ZPL</option>
                    </Select>
                    <FieldError error={errors.default_label_format?.message} />
                  </label>

                  <label className="field field--full">
                    <span>{t('Default Pickup Address', { defaultValue: 'Default Pickup Address' })}</span>
                    <textarea className="ui-input" disabled={!canEdit} rows={3} {...register('default_pickup_address')} />
                    <FieldError error={errors.default_pickup_address?.message} />
                  </label>
                </div>
              </div>

              <div className="form-section form-section--panel">
                <div className="form-section__header">
                  <div className="form-section__header-copy">
                    <h3 className="form-section__title">{t('Notification Channels', { defaultValue: 'Notification Channels' })}</h3>
                  </div>
                </div>
                <div className="form-section__body settings-form-grid">
                  <label className="field field--inline">
                    <input type="checkbox" disabled={!canEdit} {...register('notification_preferences.email_enabled')} />
                    <span>{t('Email Notifications', { defaultValue: 'Email Notifications' })}</span>
                  </label>
                  <label className="field field--inline">
                    <input type="checkbox" disabled={!canEdit} {...register('notification_preferences.sms_enabled')} />
                    <span>{t('SMS Notifications', { defaultValue: 'SMS Notifications' })}</span>
                  </label>
                  <label className="field field--inline">
                    <input type="checkbox" disabled={!canEdit} {...register('notification_preferences.whatsapp_enabled')} />
                    <span>{t('WhatsApp Notifications', { defaultValue: 'WhatsApp Notifications' })}</span>
                  </label>
                </div>
              </div>

              <div className="form-section form-section--panel">
                <div className="form-section__header">
                  <div className="form-section__header-copy">
                    <h3 className="form-section__title">{t('Notification Events', { defaultValue: 'Notification Events' })}</h3>
                  </div>
                </div>
                <div className="form-section__body settings-form-grid">
                  <label className="field field--inline">
                    <input type="checkbox" disabled={!canEdit} {...register('notification_preferences.order_status_changed')} />
                    <span>{t('Order Status Changed', { defaultValue: 'Order Status Changed' })}</span>
                  </label>
                  <label className="field field--inline">
                    <input type="checkbox" disabled={!canEdit} {...register('notification_preferences.shipment_status_changed')} />
                    <span>{t('Shipment Status Changed', { defaultValue: 'Shipment Status Changed' })}</span>
                  </label>
                  <label className="field field--inline">
                    <input type="checkbox" disabled={!canEdit} {...register('notification_preferences.low_stock')} />
                    <span>{t('Low Stock Alerts', { defaultValue: 'Low Stock Alerts' })}</span>
                  </label>
                  <label className="field field--inline">
                    <input type="checkbox" disabled={!canEdit} {...register('notification_preferences.inbound_request_status_changed')} />
                    <span>{t('Inbound Request Updates', { defaultValue: 'Inbound Request Updates' })}</span>
                  </label>
                  <label className="field field--inline">
                    <input type="checkbox" disabled={!canEdit} {...register('notification_preferences.invoice_issued')} />
                    <span>{t('New Invoice Issued', { defaultValue: 'New Invoice Issued' })}</span>
                  </label>
                  <label className="field field--inline">
                    <input type="checkbox" disabled={!canEdit} {...register('notification_preferences.payout_status_changed')} />
                    <span>{t('Payout Status Changed', { defaultValue: 'Payout Status Changed' })}</span>
                  </label>
                </div>
              </div>

              {canEdit ? (
                <FormActionsBar
                  isSubmitting={mutation.isPending}
                  submitLabel={t('Save Changes', { defaultValue: 'Save Changes' })}
                />
              ) : null}
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
