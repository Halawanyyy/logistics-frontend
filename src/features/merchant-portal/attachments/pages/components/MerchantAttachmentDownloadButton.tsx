import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../../../../../shared/components/ui/Button'
import { downloadMerchantPortalAttachment } from '../../api/merchantPortalAttachments.api'
import type { MerchantAttachment } from '../../types/merchantPortalAttachments.types'

export function MerchantAttachmentDownloadButton({ attachment }: { attachment: MerchantAttachment }) {
  const { t } = useTranslation()
  const [downloading, setDownloading] = useState(false)

  async function handleDownload() {
    try {
      setDownloading(true)
      const blob = await downloadMerchantPortalAttachment(attachment.id)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = attachment.original_name || attachment.file_name || `attachment-${attachment.id}`
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Download failed', err)
      alert(t('Download failed. Please try again.', { defaultValue: 'Download failed. Please try again.' }))
    } finally {
      setDownloading(false)
    }
  }

  return (
    <Button
      variant="primary"
      size="sm"
      onClick={() => void handleDownload()}
      disabled={downloading}
    >
      {downloading ? t('Downloading...', { defaultValue: 'Downloading...' }) : t('Download Attachment', { defaultValue: 'Download Attachment' })}
    </Button>
  )
}
