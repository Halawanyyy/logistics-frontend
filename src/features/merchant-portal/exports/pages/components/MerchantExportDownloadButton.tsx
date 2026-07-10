import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../../../../../shared/components/ui/Button'
import { downloadMerchantPortalExport } from '../../api/merchantPortalExports.api'
import type { MerchantExportLog } from '../../types/merchantPortalExports.types'

export function MerchantExportDownloadButton({ exportItem }: { exportItem: MerchantExportLog }) {
  const { t } = useTranslation()
  const [downloading, setDownloading] = useState(false)
  const isReady = exportItem.status === 'completed' || exportItem.status === 'ready'

  async function handleDownload() {
    try {
      setDownloading(true)
      const blob = await downloadMerchantPortalExport(exportItem.id)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = exportItem.file_name || `export-${exportItem.id}.csv`
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Download failed', err)
      alert(t('Download failed. Please try again.', { defaultValue: 'Download failed. Please try again.' }))
    } finally {
      setDownloading(false)
    }
  }

  if (!isReady) {
    return (
      <Button variant="secondary" size="sm" disabled>
        {t('Download Export', { defaultValue: 'Download Export' })}
      </Button>
    )
  }

  return (
    <Button
      variant="primary"
      size="sm"
      onClick={() => void handleDownload()}
      disabled={downloading}
    >
      {downloading ? t('Downloading...', { defaultValue: 'Downloading...' }) : t('Download Export', { defaultValue: 'Download Export' })}
    </Button>
  )
}
