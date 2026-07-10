import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { uploadMerchantPortalAttachment } from '../api/merchantPortalAttachments.api'
import type { MerchantAttachmentUploadPayload } from '../types/merchantPortalAttachments.types'
import { merchantPath } from '../../../../shared/routing/paths'
import { Button } from '../../../../shared/components/ui/Button'
import { PageHeader } from '../../../../shared/components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../shared/components/ui/Card'
import { Input } from '../../../../shared/components/ui/Input'
import { Select } from '../../../../shared/components/ui/Select'
import { FieldError } from '../../../../shared/components/forms/FieldError'
import { getApiErrorMessage } from '../../../../shared/api/api-error'

export function MerchantAttachmentUploadPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [file, setFile] = useState<File | null>(null)
  const [category, setCategory] = useState('')
  const [notes, setNotes] = useState('')
  const [attachableType, setAttachableType] = useState('')
  const [attachableId, setAttachableId] = useState('')

  const uploadMutation = useMutation({
    mutationFn: (payload: MerchantAttachmentUploadPayload) => uploadMerchantPortalAttachment(payload),
    onSuccess: (data) => {
      navigate(merchantPath(`/attachments/${data.data.id}`))
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    uploadMutation.mutate({
      file,
      category: category || undefined,
      notes: notes || undefined,
      attachable_type: attachableType || undefined,
      attachable_id: attachableId || undefined,
    })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
    }
  }

  return (
    <div className="page-stack">
      <PageHeader
        title={t('Upload Attachment', { defaultValue: 'Upload Attachment' })}
        description={t('Upload a new file to your merchant account.', { defaultValue: 'Upload a new file to your merchant account.' })}
        backTo={merchantPath('/attachments')}
      />

      <Card>
        <CardHeader>
          <CardTitle>{t('Attachment Details', { defaultValue: 'Attachment Details' })}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="form-grid max-w-2xl">
            {uploadMutation.isError ? (
              <FieldError error={getApiErrorMessage(uploadMutation.error)} />
            ) : null}

            <div className="form-group">
              <label htmlFor="file">{t('File', { defaultValue: 'File' })} *</label>
              <Input
                id="file"
                type="file"
                onChange={handleFileChange}
                required
                accept=".pdf,.jpg,.jpeg,.png,.webp,.csv,.xlsx"
              />
              <p className="text-xs text-muted mt-1">
                {t('Supported formats: PDF, JPG, PNG, WEBP, CSV, XLSX. Max 10MB.', { defaultValue: 'Supported formats: PDF, JPG, PNG, WEBP, CSV, XLSX. Max 10MB.' })}
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="category">{t('Category (Optional)', { defaultValue: 'Category (Optional)' })}</label>
              <Select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">{t('Select a category', { defaultValue: 'Select a category' })}</option>
                <option value="contract">{t('Contract', { defaultValue: 'Contract' })}</option>
                <option value="identity">{t('Identity', { defaultValue: 'Identity' })}</option>
                <option value="receipt">{t('Receipt', { defaultValue: 'Receipt' })}</option>
                <option value="other">{t('Other', { defaultValue: 'Other' })}</option>
              </Select>
            </div>

            <div className="form-group">
              <label htmlFor="attachable_type">{t('Related Entity (Optional)', { defaultValue: 'Related Entity (Optional)' })}</label>
              <Select
                id="attachable_type"
                value={attachableType}
                onChange={(e) => setAttachableType(e.target.value)}
              >
                <option value="">{t('None', { defaultValue: 'None' })}</option>
                <option value="merchant_profile">{t('Merchant Profile', { defaultValue: 'Merchant Profile' })}</option>
                <option value="order">{t('Order', { defaultValue: 'Order' })}</option>
                <option value="shipment">{t('Shipment', { defaultValue: 'Shipment' })}</option>
                <option value="invoice">{t('Invoice', { defaultValue: 'Invoice' })}</option>
                <option value="payout">{t('Payout', { defaultValue: 'Payout' })}</option>
                <option value="inbound_stock_request">{t('Inbound Stock Request', { defaultValue: 'Inbound Stock Request' })}</option>
              </Select>
            </div>

            {attachableType && (
              <div className="form-group">
                <label htmlFor="attachable_id">{t('Related Entity ID', { defaultValue: 'Related Entity ID' })} *</label>
                <Input
                  id="attachable_id"
                  value={attachableId}
                  onChange={(e) => setAttachableId(e.target.value)}
                  placeholder="e.g. 123"
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="notes">{t('Notes (Optional)', { defaultValue: 'Notes (Optional)' })}</label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('Any additional notes', { defaultValue: 'Any additional notes' })}
              />
            </div>

            <div className="form-actions">
              <Button type="submit" variant="primary" disabled={uploadMutation.isPending || !file}>
                {uploadMutation.isPending ? t('Uploading...', { defaultValue: 'Uploading...' }) : t('Upload', { defaultValue: 'Upload' })}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
