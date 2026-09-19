import { useState, useRef, useEffect, type ChangeEvent, type DragEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { UploadCloud, CheckCircle2, AlertCircle, X, RotateCcw, Image as ImageIcon } from 'lucide-react'
import { uploadBrandingLogo, resetBrandingLogo } from '../api/settings.api'
import { BrandLogo } from '../../../shared/components/branding/BrandLogo'
import { Button } from '../../../shared/components/ui/Button'
import { getApiErrorMessage } from '../../../shared/api/api-error'
import { useBranding } from '../../../shared/branding/useBranding'

const MAX_FILE_SIZE_BYTES = 4 * 1024 * 1024 // 4 MB
const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export function BrandLogoUploadControl() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const branding = useBranding()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null)
  const [clientError, setClientError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  // Revoke object URL on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl)
      }
    }
  }, [localPreviewUrl])

  // Clear success message after 5 seconds
  useEffect(() => {
    if (!successMessage) return
    const timer = setTimeout(() => setSuccessMessage(null), 5000)
    return () => clearTimeout(timer)
  }, [successMessage])

  const uploadMutation = useMutation({
    mutationFn: uploadBrandingLogo,
    onSuccess: (response) => {
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl)
      }
      setSelectedFile(null)
      setLocalPreviewUrl(null)
      setClientError(null)
      setSuccessMessage(t('Logo uploaded and updated globally.', { defaultValue: 'Logo uploaded and updated globally.' }))

      if (response?.data) {
        queryClient.setQueriesData(
          { queryKey: ['public-branding'] },
          (old: { data?: typeof response.data } | undefined) => ({
            ...old,
            data: {
              ...old?.data,
              ...response.data,
            },
          })
        )
      }

      // Invalidate queries so all visible logo instances update immediately without full-page reload
      void queryClient.invalidateQueries({ queryKey: ['public-branding'] })
      void queryClient.invalidateQueries({ queryKey: ['settings'] })
      branding.refetch()
    },
  })

  const resetMutation = useMutation({
    mutationFn: resetBrandingLogo,
    onSuccess: () => {
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl)
      }
      setSelectedFile(null)
      setLocalPreviewUrl(null)
      setClientError(null)
      setSuccessMessage(t('Logo reset to default.', { defaultValue: 'Logo reset to default.' }))

      queryClient.setQueriesData(
        { queryKey: ['public-branding'] },
        (old: { data?: unknown } | undefined) => {
          if (!old || typeof old !== 'object') return old
          return {
            ...old,
            data: {
              ...((old as { data?: Record<string, unknown> }).data ?? {}),
              logo_url: null,
              logo_path: null,
            },
          }
        }
      )

      void queryClient.invalidateQueries({ queryKey: ['public-branding'] })
      void queryClient.invalidateQueries({ queryKey: ['settings'] })
      branding.refetch()
    },
  })

  function validateFile(file: File): boolean {
    setClientError(null)

    if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
      setClientError(
        t('Invalid format. Please select a PNG, JPG, or WebP image.', {
          defaultValue: 'Invalid format. Please select a PNG, JPG, or WebP image.',
        })
      )
      return false
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setClientError(
        t('File is too large ({{size}}). Maximum allowed size is 4 MB.', {
          size: formatFileSize(file.size),
          defaultValue: `File is too large (${formatFileSize(file.size)}). Maximum allowed size is 4 MB.`,
        })
      )
      return false
    }

    return true
  }

  function handleFileSelection(file: File) {
    if (validateFile(file)) {
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl)
      }
      setSelectedFile(file)
      setLocalPreviewUrl(URL.createObjectURL(file))
      setSuccessMessage(null)
    } else {
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl)
      }
      setSelectedFile(null)
      setLocalPreviewUrl(null)
    }
  }

  function onInputChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (file) {
      handleFileSelection(file)
    }
  }

  function onDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragOver(true)
  }

  function onDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragOver(false)
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragOver(false)
    const file = event.dataTransfer.files?.[0]
    if (file) {
      handleFileSelection(file)
    }
  }

  function handleUpload() {
    if (!selectedFile) return
    uploadMutation.mutate(selectedFile)
  }

  function handleCancelSelection() {
    setSelectedFile(null)
    setClientError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  function handleReset() {
    if (window.confirm(t('Are you sure you want to remove the custom logo and revert to default?', {
      defaultValue: 'Are you sure you want to remove the custom logo and revert to default?',
    }))) {
      resetMutation.mutate()
    }
  }

  const activeError = clientError || (uploadMutation.error ? getApiErrorMessage(uploadMutation.error) : null) || (resetMutation.error ? getApiErrorMessage(resetMutation.error) : null)
  const isUploading = uploadMutation.isPending || resetMutation.isPending
  const hasCustomLogo = Boolean(branding.logoUrl)

  return (
    <div className="brand-logo-upload-control" data-testid="brand-logo-upload-control">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        style={{ display: 'none' }}
        onChange={onInputChange}
        disabled={isUploading}
      />

      <div className="brand-logo-upload-control__main">
        {/* Current / Stored Logo Preview */}
        <div className="brand-logo-upload-control__current">
          <div className="brand-logo-upload-control__preview-frame">
            {localPreviewUrl ? (
              <img
                src={localPreviewUrl}
                alt={t('New logo preview', { defaultValue: 'New logo preview' })}
                className="brand-logo-upload-control__preview-img"
              />
            ) : branding.logoUrl ? (
              <img
                src={branding.logoUrl}
                alt={t('Current active logo', { defaultValue: 'Current active logo' })}
                className="brand-logo-upload-control__preview-img"
              />
            ) : (
              <BrandLogo size="lg" />
            )}
          </div>
          <div className="brand-logo-upload-control__current-copy">
            <span className="brand-logo-upload-control__preview-label">
              {localPreviewUrl
                ? t('Pending Upload Preview', { defaultValue: 'Pending Upload Preview' })
                : hasCustomLogo
                ? t('Current Active Logo', { defaultValue: 'Current Active Logo' })
                : t('Default System Mark', { defaultValue: 'Default System Mark' })}
            </span>
            <p className="brand-logo-upload-control__preview-hint">
              {localPreviewUrl
                ? t('Click "Upload Logo" below to commit and publish globally.', { defaultValue: 'Click "Upload Logo" below to commit and publish globally.' })
                : hasCustomLogo
                ? t('Visible across login, sidebar, topbar, and printable forms.', { defaultValue: 'Visible across login, sidebar, topbar, and printable forms.' })
                : t('No custom logo uploaded yet. Company initials will be displayed.', { defaultValue: 'No custom logo uploaded yet. Company initials will be displayed.' })}
            </p>
          </div>
        </div>

        {/* Dropzone & Browse Area */}
        <div
          className={`brand-logo-upload-control__dropzone ${isDragOver ? 'brand-logo-upload-control__dropzone--active' : ''}`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              fileInputRef.current?.click()
            }
          }}
          aria-label={t('Click or drag and drop to upload logo', { defaultValue: 'Click or drag and drop to upload logo' })}
        >
          <div className="brand-logo-upload-control__dropzone-icon">
            <UploadCloud size={28} />
          </div>
          <div className="brand-logo-upload-control__dropzone-text">
            <strong>
              {selectedFile
                ? t('Select a different image', { defaultValue: 'Select a different image' })
                : t('Click to browse or drag and drop image', { defaultValue: 'Click to browse or drag and drop image' })}
            </strong>
            <span>{t('PNG, JPG or WebP — maximum 4 MB (min 64×64)', { defaultValue: 'PNG, JPG or WebP — maximum 4 MB (min 64×64)' })}</span>
          </div>
        </div>
      </div>

      {/* Selected File Details Bar & Actions */}
      {selectedFile ? (
        <div className="brand-logo-upload-control__staged">
          <div className="brand-logo-upload-control__staged-info">
            <ImageIcon size={18} />
            <span className="brand-logo-upload-control__staged-name">{selectedFile.name}</span>
            <span className="brand-logo-upload-control__staged-size">({formatFileSize(selectedFile.size)})</span>
          </div>

          <div className="brand-logo-upload-control__staged-actions">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleCancelSelection}
              disabled={isUploading}
            >
              <X size={15} />
              {t('Cancel', { defaultValue: 'Cancel' })}
            </Button>
            <Button
              type="button"
              size="sm"
              loading={uploadMutation.isPending}
              disabled={isUploading}
              onClick={handleUpload}
              className="brand-logo-upload-control__commit-button"
            >
              <CheckCircle2 size={16} />
              {hasCustomLogo
                ? t('Replace Logo', { defaultValue: 'Replace Logo' })
                : t('Upload Logo', { defaultValue: 'Upload Logo' })}
            </Button>
          </div>
        </div>
      ) : hasCustomLogo ? (
        <div className="brand-logo-upload-control__footer-actions">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleReset}
            disabled={isUploading}
            loading={resetMutation.isPending}
            className="brand-logo-upload-control__reset-button"
          >
            <RotateCcw size={14} />
            {t('Remove Custom Logo', { defaultValue: 'Remove Custom Logo' })}
          </Button>
        </div>
      ) : null}

      {/* Error & Success Feedback */}
      {activeError ? (
        <div className="brand-logo-upload-control__error" role="alert">
          <AlertCircle size={16} />
          <span>{activeError}</span>
        </div>
      ) : null}

      {successMessage ? (
        <div className="brand-logo-upload-control__success" role="status">
          <CheckCircle2 size={16} />
          <span>{successMessage}</span>
        </div>
      ) : null}
    </div>
  )
}
