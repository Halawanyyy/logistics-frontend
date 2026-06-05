import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { uploadAttachment, listAttachments, deleteAttachment, downloadAttachment } from '../../api/attachments.api'
import { getApiErrorMessage } from '../../api/api-error'
import { PERMISSIONS } from '../../auth/permission-keys'
import { Can } from '../../auth/Can'
import { FieldError } from '../forms/FieldError'
import { useFormApiErrors } from '../../hooks/useFormApiErrors'
import { EmptyState } from '../states/EmptyState'
import { ErrorState } from '../states/ErrorState'
import { LoadingState } from '../states/LoadingState'
import { Button } from '../ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { Dialog } from '../ui/Dialog'
import { Input } from '../ui/Input'
import { Table, TableCell, TableContainer, TableHead } from '../ui/Table'
import { ConfirmActionModal } from '../modals/ConfirmActionModal'
import { formatDate } from '../../utils/formatters'

type AttachmentsProps = {
  attachableType: string
  attachableId: string | number
}

type UploadAttachmentFormValues = {
  category: string
  notes: string
  file: FileList
}

function formatFileSize(fileSize: number) {
  if (fileSize < 1024) {
    return `${fileSize} B`
  }

  if (fileSize < 1024 * 1024) {
    return `${(fileSize / 1024).toFixed(1)} KB`
  }

  return `${(fileSize / (1024 * 1024)).toFixed(1)} MB`
}

function triggerBlobDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

export function Attachments({ attachableType, attachableId }: AttachmentsProps) {
  const { t } = useTranslation()
  const [uploadOpen, setUploadOpen] = useState(false)
  const [attachmentPendingDelete, setAttachmentPendingDelete] = useState<{
    id: number
    originalName: string
  } | null>(null)
  const queryClient = useQueryClient()
  const attachmentsQuery = useQuery({
    queryKey: ['attachments', attachableType, attachableId],
    queryFn: () => listAttachments({
      attachable_type: attachableType,
      attachable_id: attachableId,
    }),
  })
  const uploadMutation = useMutation({
    mutationFn: uploadAttachment,
    onSuccess: async () => {
      setUploadOpen(false)
      await queryClient.invalidateQueries({
        queryKey: ['attachments', attachableType, attachableId],
      })
    },
  })
  const downloadMutation = useMutation({
    mutationFn: ({ id, fileName }: { id: number; fileName: string }) =>
      downloadAttachment(id).then((blob) => ({ blob, fileName })),
    onSuccess: ({ blob, fileName }) => {
      triggerBlobDownload(blob, fileName)
    },
  })
  const deleteMutation = useMutation({
    mutationFn: deleteAttachment,
    onSuccess: async () => {
      setAttachmentPendingDelete(null)
      await queryClient.invalidateQueries({
        queryKey: ['attachments', attachableType, attachableId],
      })
    },
  })
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UploadAttachmentFormValues>({
    defaultValues: {
      category: '',
      notes: '',
    },
  })
  const { formError, getFieldError } = useFormApiErrors(uploadMutation.error)

  function onSubmit(values: UploadAttachmentFormValues) {
    const file = values.file?.[0]
    if (!file) {
      return
    }

    uploadMutation.mutate({
      attachable_type: attachableType,
      attachable_id: attachableId,
      category: values.category,
      notes: values.notes || undefined,
      file,
    })
  }

  function closeUploadDialog() {
    if (uploadMutation.isPending) {
      return
    }

    reset()
    setUploadOpen(false)
  }

  const attachments = attachmentsQuery.data?.data ?? []

  return (
      <Card>
      <CardHeader>
        <div className="section-title-row">
          <CardTitle>{t('Attachments')}</CardTitle>
          <Can permission={PERMISSIONS.ATTACHMENTS_UPLOAD}>
            <Button type="button" variant="secondary" onClick={() => setUploadOpen(true)}>
              {t('Upload Attachment')}
            </Button>
          </Can>
        </div>
      </CardHeader>
      <CardContent>
        <p className="table-meta">{t('Allowed file types: pdf, jpg, jpeg, png, webp, csv, xlsx. Maximum size: 10 MB.')}</p>
        {attachmentsQuery.isLoading ? <LoadingState title="Loading attachments" /> : null}
        {attachmentsQuery.isError ? (
          <ErrorState
            title={t('Unable to load attachments')}
            message={getApiErrorMessage(attachmentsQuery.error)}
            onRetry={() => void attachmentsQuery.refetch()}
          />
        ) : null}
        {!attachmentsQuery.isLoading && !attachmentsQuery.isError && !attachments.length ? (
          <EmptyState
            title={t('No attachments')}
            description={t('No attachments have been uploaded for this record yet.')}
          />
        ) : null}
        {attachments.length ? (
          <TableContainer>
            <Table variant="compact">
              <thead>
                <tr>
                  <TableHead>{t('File')}</TableHead>
                  <TableHead>{t('Category')}</TableHead>
                  <TableHead>{t('Size')}</TableHead>
                  <TableHead>{t('Uploaded By')}</TableHead>
                  <TableHead>{t('Created')}</TableHead>
                  <TableHead>{t('Actions')}</TableHead>
                </tr>
              </thead>
              <tbody>
                {attachments.map((attachment) => (
                  <tr key={attachment.id}>
                    <TableCell>
                      {attachment.original_name}
                      {attachment.notes ? <p className="table-meta">{attachment.notes}</p> : null}
                    </TableCell>
                    <TableCell>{attachment.category}</TableCell>
                    <TableCell>{formatFileSize(attachment.file_size)}</TableCell>
                    <TableCell>{attachment.uploaded_by_name}</TableCell>
                    <TableCell>{formatDate(attachment.created_at)}</TableCell>
                    <TableCell>
                      <div className="page-header__button-row">
                        <Can permission={PERMISSIONS.ATTACHMENTS_DOWNLOAD}>
                          <Button
                            type="button"
                            variant="secondary"
                            loading={downloadMutation.isPending}
                            onClick={() => downloadMutation.mutate({
                              id: attachment.id,
                              fileName: attachment.original_name,
                            })}
                          >
                            {t('Download')}
                          </Button>
                        </Can>
                        <Can permission={PERMISSIONS.ATTACHMENTS_DELETE}>
                          <Button
                            type="button"
                            variant="danger"
                            onClick={() => setAttachmentPendingDelete({
                              id: attachment.id,
                              originalName: attachment.original_name,
                            })}
                          >
                            {t('Delete')}
                          </Button>
                        </Can>
                      </div>
                    </TableCell>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableContainer>
        ) : null}
        <Dialog open={uploadOpen} onClose={closeUploadDialog} title={<CardTitle>{t('Upload Attachment')}</CardTitle>} variant="small">
          <form className="form-grid" onSubmit={handleSubmit(onSubmit)}>
            <label className="field">
              <span>{t('Category')}</span>
              <Input {...register('category', { required: t('Category is required.') })} />
              <FieldError error={errors.category?.message ?? getFieldError('category')} />
            </label>
            <label className="field">
              <span>{t('Notes')}</span>
              <Input {...register('notes')} />
            </label>
            <label className="field">
              <span>{t('File')}</span>
              <Input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.csv,.xlsx"
                {...register('file', { required: t('File is required.') })}
              />
              <FieldError error={errors.file?.message ?? getFieldError('file')} />
            </label>
            {formError ? <div className="form-error">{formError}</div> : null}
            <div className="form-actions">
              <Button type="button" variant="secondary" onClick={closeUploadDialog}>
                {t('Cancel')}
              </Button>
              <Button type="submit" loading={uploadMutation.isPending}>
                {t('Upload')}
              </Button>
            </div>
          </form>
        </Dialog>
        <ConfirmActionModal
          open={Boolean(attachmentPendingDelete)}
          title={t('Delete attachment')}
          description={attachmentPendingDelete ? `Delete ${attachmentPendingDelete.originalName}?` : ''}
          confirmLabel={t('Delete attachment')}
          variant="danger"
          loading={deleteMutation.isPending}
          onCancel={() => setAttachmentPendingDelete(null)}
          onConfirm={() => {
            if (attachmentPendingDelete) {
              deleteMutation.mutate(attachmentPendingDelete.id)
            }
          }}
        />
      </CardContent>
    </Card>
  )
}
