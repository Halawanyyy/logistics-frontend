import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { listMerchantPortalAttachments, deleteMerchantPortalAttachment } from '../api/merchantPortalAttachments.api'
import { CanMerchant } from '../../components/CanMerchant'
import { merchantPath } from '../../../../shared/routing/paths'
import { Button } from '../../../../shared/components/ui/Button'
import { PageHeader } from '../../../../shared/components/ui/PageHeader'
import { Card } from '../../../../shared/components/ui/Card'
import { Table, TableCell, TableContainer, TableHead } from '../../../../shared/components/ui/Table'
import { StatusBadge } from '../../../../shared/components/ui/StatusBadge'
import { LoadingState } from '../../../../shared/components/states/LoadingState'
import { ErrorState } from '../../../../shared/components/states/ErrorState'
import { EmptyState } from '../../../../shared/components/states/EmptyState'
import { Input } from '../../../../shared/components/ui/Input'
import { Select } from '../../../../shared/components/ui/Select'
import { ConfirmActionModal } from '../../../../shared/components/modals/ConfirmActionModal'
import { getApiErrorMessage } from '../../../../shared/api/api-error'
import { formatDate } from '../../../../shared/utils/formatters'
import type { MerchantAttachmentFilters, MerchantAttachment } from '../types/merchantPortalAttachments.types'
import { MerchantAttachmentDownloadButton } from './components/MerchantAttachmentDownloadButton'

export function MerchantAttachmentsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState<MerchantAttachmentFilters>({
    page: 1,
    per_page: 50,
  })
  const [attachmentPendingDelete, setAttachmentPendingDelete] = useState<MerchantAttachment | null>(null)

  const attachmentsQuery = useQuery({
    queryKey: ['merchant-portal', 'attachments', filters],
    queryFn: () => listMerchantPortalAttachments(filters),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteMerchantPortalAttachment(id),
    onSuccess: async () => {
      setAttachmentPendingDelete(null)
      await queryClient.invalidateQueries({ queryKey: ['merchant-portal', 'attachments'] })
    },
  })

  const handleReset = () => {
    setFilters({ page: 1, per_page: 50 })
  }

  const attachments = attachmentsQuery.data?.data ?? []

  const formatFileSize = (bytes?: number) => {
    if (bytes == null) return '-'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="page-stack">
      <PageHeader
        title={t('Attachments', { defaultValue: 'Attachments' })}
        description={t('Manage files attached to your merchant account.', { defaultValue: 'Manage files attached to your merchant account.' })}
        actions={
          <CanMerchant capability="attachments.upload">
            <Link className="ui-link-reset" to={merchantPath('/attachments/upload')}>
              <Button variant="primary">
                {t('Upload Attachment', { defaultValue: 'Upload Attachment' })}
              </Button>
            </Link>
          </CanMerchant>
        }
      />

      <Card className="p-4 mb-4">
        <div className="filters-grid">
          <Input
            placeholder={t('Search by name...', { defaultValue: 'Search by name...' })}
            value={filters.search || ''}
            onChange={(e) => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))}
          />
          <Select
            value={filters.category || ''}
            onChange={(e) => setFilters(f => ({ ...f, category: e.target.value, page: 1 }))}
          >
            <option value="">{t('All Categories', { defaultValue: 'All Categories' })}</option>
            <option value="contract">{t('Contract', { defaultValue: 'Contract' })}</option>
            <option value="identity">{t('Identity', { defaultValue: 'Identity' })}</option>
            <option value="receipt">{t('Receipt', { defaultValue: 'Receipt' })}</option>
            <option value="other">{t('Other', { defaultValue: 'Other' })}</option>
          </Select>
          <Button variant="secondary" onClick={handleReset}>
            {t('Reset', { defaultValue: 'Reset' })}
          </Button>
        </div>
      </Card>

      <Card>
        {attachmentsQuery.isLoading ? (
          <LoadingState title={t('Loading attachments...', { defaultValue: 'Loading attachments...' })} />
        ) : attachmentsQuery.isError ? (
          <ErrorState
            title={t('Failed to load attachments.', { defaultValue: 'Failed to load attachments.' })}
            message={getApiErrorMessage(attachmentsQuery.error)}
            onRetry={() => void attachmentsQuery.refetch()}
          />
        ) : attachments.length === 0 ? (
          <EmptyState
            title={t('No attachments found.', { defaultValue: 'No attachments found.' })}
            description={t('Upload your first attachment to get started.', { defaultValue: 'Upload your first attachment to get started.' })}
          />
        ) : (
          <TableContainer>
            <Table>
              <thead>
                <tr>
                  <TableHead>{t('File Name', { defaultValue: 'File Name' })}</TableHead>
                  <TableHead>{t('File Type', { defaultValue: 'File Type' })}</TableHead>
                  <TableHead>{t('File Size', { defaultValue: 'File Size' })}</TableHead>
                  <TableHead>{t('Related To', { defaultValue: 'Related To' })}</TableHead>
                  <TableHead>{t('Uploaded Date', { defaultValue: 'Uploaded Date' })}</TableHead>
                  <TableHead className="text-right">{t('Actions', { defaultValue: 'Actions' })}</TableHead>
                </tr>
              </thead>
              <tbody>
                {attachments.map((attachment) => (
                  <tr key={attachment.id}>
                    <TableCell className="font-medium max-w-[200px] truncate" title={attachment.original_name || attachment.file_name}>
                      {attachment.original_name || attachment.file_name || '-'}
                    </TableCell>
                    <TableCell>
                      <StatusBadge value={attachment.category || attachment.mime_type?.split('/')[1] || 'Unknown'} />
                    </TableCell>
                    <TableCell>
                      {formatFileSize(attachment.file_size)}
                    </TableCell>
                    <TableCell>
                      {attachment.attachable_type ? (
                         <span className="text-xs bg-muted px-2 py-1 rounded">
                           {attachment.attachable_type} {attachment.attachable_id ? `#${attachment.attachable_id}` : ''}
                         </span>
                      ) : '-'}
                    </TableCell>
                    <TableCell>{formatDate(attachment.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link className="ui-link-reset" to={merchantPath(`/attachments/${attachment.id}`)}>
                          <Button
                            variant="secondary"
                            size="sm"
                          >
                            {t('View', { defaultValue: 'View' })}
                          </Button>
                        </Link>
                        <CanMerchant capability="attachments.download">
                          <MerchantAttachmentDownloadButton attachment={attachment} />
                        </CanMerchant>
                        <CanMerchant capability="attachments.delete">
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => setAttachmentPendingDelete(attachment)}
                          >
                            {t('Delete')}
                          </Button>
                        </CanMerchant>
                      </div>
                    </TableCell>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableContainer>
        )}
      </Card>

      <ConfirmActionModal
        open={Boolean(attachmentPendingDelete)}
        title={t('Delete Attachment', { defaultValue: 'Delete Attachment' })}
        description={attachmentPendingDelete ? t('Delete {{fileName}}?', { fileName: attachmentPendingDelete.original_name || attachmentPendingDelete.file_name, defaultValue: `Delete ${attachmentPendingDelete.original_name || attachmentPendingDelete.file_name}?` }) : ''}
        confirmLabel={t('Delete', { defaultValue: 'Delete' })}
        variant="danger"
        loading={deleteMutation.isPending}
        onCancel={() => setAttachmentPendingDelete(null)}
        onConfirm={() => {
          if (attachmentPendingDelete) deleteMutation.mutate(attachmentPendingDelete.id)
        }}
      />
    </div>
  )
}
