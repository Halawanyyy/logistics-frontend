import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { getMerchantPortalAttachment, deleteMerchantPortalAttachment } from '../api/merchantPortalAttachments.api'
import { merchantPath } from '../../../../shared/routing/paths'
import { PageHeader } from '../../../../shared/components/ui/PageHeader'
import { Card, CardContent } from '../../../../shared/components/ui/Card'
import { StatusBadge } from '../../../../shared/components/ui/StatusBadge'
import { LoadingState } from '../../../../shared/components/states/LoadingState'
import { ErrorState } from '../../../../shared/components/states/ErrorState'
import { getApiErrorMessage } from '../../../../shared/api/api-error'
import { formatDate } from '../../../../shared/utils/formatters'
import { MerchantAttachmentDownloadButton } from './components/MerchantAttachmentDownloadButton'
import { CanMerchant } from '../../components/CanMerchant'
import { ConfirmActionModal } from '../../../../shared/components/modals/ConfirmActionModal'
import { Button } from '../../../../shared/components/ui/Button'

export function MerchantAttachmentDetailsPage() {
  const { attachmentId } = useParams<{ attachmentId: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const attachmentQuery = useQuery({
    queryKey: ['merchant-portal', 'attachment', attachmentId],
    queryFn: () => getMerchantPortalAttachment(attachmentId as string),
    enabled: Boolean(attachmentId),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteMerchantPortalAttachment(attachmentId as string),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['merchant-portal', 'attachments'] })
      navigate(merchantPath('/attachments'))
    },
  })

  if (attachmentQuery.isLoading) {
    return (
      <div className="page-stack">
        <PageHeader title={t('Attachment Details', { defaultValue: 'Attachment Details' })} />
        <Card>
          <LoadingState title={t('Loading attachment...', { defaultValue: 'Loading attachment...' })} />
        </Card>
      </div>
    )
  }

  if (attachmentQuery.isError) {
    return (
      <div className="page-stack">
        <PageHeader title={t('Attachment Details', { defaultValue: 'Attachment Details' })} />
        <Card>
          <ErrorState
            title={t('Failed to load attachment.', { defaultValue: 'Failed to load attachment.' })}
            message={getApiErrorMessage(attachmentQuery.error)}
            onRetry={() => void attachmentQuery.refetch()}
          />
        </Card>
      </div>
    )
  }

  const attachmentData = attachmentQuery.data?.data
  if (!attachmentData) return null

  const formatFileSize = (bytes?: number) => {
    if (bytes == null) return '-'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="page-stack">
      <PageHeader
        title={t('Attachment Details', { defaultValue: 'Attachment Details' })}
        actions={
          <div className="flex gap-2">
            <CanMerchant capability="attachments.delete">
              <Button variant="danger" onClick={() => setShowDeleteConfirm(true)}>
                {t('Delete', { defaultValue: 'Delete' })}
              </Button>
            </CanMerchant>
            <CanMerchant capability="attachments.download">
              <MerchantAttachmentDownloadButton attachment={attachmentData} />
            </CanMerchant>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-muted">{t('Original File Name', { defaultValue: 'Original File Name' })}</dt>
                <dd className="mt-1 text-sm font-mono break-all">{attachmentData.original_name || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted">{t('Stored File Name', { defaultValue: 'Stored File Name' })}</dt>
                <dd className="mt-1 text-sm font-mono break-all">{attachmentData.file_name || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted">{t('Category', { defaultValue: 'Category' })}</dt>
                <dd className="mt-1">
                  <StatusBadge value={attachmentData.category || 'Unknown'} />
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted">{t('MIME Type', { defaultValue: 'MIME Type' })}</dt>
                <dd className="mt-1 text-sm">{attachmentData.mime_type || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted">{t('File Size', { defaultValue: 'File Size' })}</dt>
                <dd className="mt-1 text-sm">{formatFileSize(attachmentData.file_size)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-muted">{t('Related Entity', { defaultValue: 'Related Entity' })}</dt>
                <dd className="mt-1 text-sm">
                  {attachmentData.attachable_type ? (
                    <span className="bg-muted px-2 py-1 rounded">
                      {attachmentData.attachable_type} {attachmentData.attachable_id ? `#${attachmentData.attachable_id}` : ''}
                    </span>
                  ) : '-'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted">{t('Uploaded By', { defaultValue: 'Uploaded By' })}</dt>
                <dd className="mt-1 text-sm">{attachmentData.uploaded_by_name || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted">{t('Uploaded Date', { defaultValue: 'Uploaded Date' })}</dt>
                <dd className="mt-1 text-sm">{formatDate(attachmentData.created_at)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted">{t('Notes', { defaultValue: 'Notes' })}</dt>
                <dd className="mt-1 text-sm whitespace-pre-wrap">{attachmentData.notes || '-'}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      <ConfirmActionModal
        open={showDeleteConfirm}
        title={t('Delete Attachment', { defaultValue: 'Delete Attachment' })}
        description={t('Are you sure you want to delete this attachment? This action cannot be undone.', { defaultValue: 'Are you sure you want to delete this attachment? This action cannot be undone.' })}
        confirmLabel={t('Delete', { defaultValue: 'Delete' })}
        variant="danger"
        loading={deleteMutation.isPending}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={() => deleteMutation.mutate()}
      />
    </div>
  )
}
