import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { getApiErrorMessage } from '../../../shared/api/api-error'
import { useBranding } from '../../../shared/branding/useBranding'
import { LoadingState } from '../../../shared/components/states/LoadingState'
import { ErrorState } from '../../../shared/components/states/ErrorState'
import { Button } from '../../../shared/components/ui/Button'
import { CardTitle } from '../../../shared/components/ui/Card'
import { Dialog } from '../../../shared/components/ui/Dialog'
import { useLocale } from '../../../shared/i18n/useLocale'
import { printHtmlDocument } from '../../../shared/utils/printHtml'
import { getDriverManifestPrint } from '../api/driver-manifests.api'
import type { DriverManifest } from '../types/driver-manifest.types'
import { buildDriverManifestPrintDocument, type DriverManifestPrintFiltersSummary } from '../utils/driverManifestPrint'

type DriverManifestPrintDialogProps = {
  filters?: DriverManifestPrintFiltersSummary
  manifest: DriverManifest | null
  onOpenChange: (open: boolean) => void
  open: boolean
}

export function DriverManifestPrintDialog({
  filters,
  manifest,
  onOpenChange,
  open,
}: DriverManifestPrintDialogProps) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const branding = useBranding()
  const [printError, setPrintError] = useState('')
  const [isPrinting, setIsPrinting] = useState(false)
  const printQuery = useQuery({
    queryKey: ['driver-manifests', manifest?.id, 'frontend-print'],
    queryFn: () => getDriverManifestPrint(manifest!.id),
    enabled: open && Boolean(manifest),
  })

  const documentResult = useMemo(() => {
    if (!manifest || !printQuery.data) {
      return null
    }

    return buildDriverManifestPrintDocument({
      branding: {
        companyLogo: branding.companyLogo,
        companyName: branding.companyName,
      },
      filters,
      locale,
      manifest,
      printableManifest: printQuery.data.data,
      t,
    })
  }, [branding.companyLogo, branding.companyName, filters, locale, manifest, printQuery.data, t])

  useEffect(() => {
    return () => {
      if (documentResult?.objectUrl) {
        URL.revokeObjectURL(documentResult.objectUrl)
      }
    }
  }, [documentResult])

  useEffect(() => {
    if (!open) {
      setPrintError('')
    }
  }, [open])

  async function handlePrint() {
    if (!documentResult?.text) {
      return
    }

    setIsPrinting(true)
    setPrintError('')

    try {
      await printHtmlDocument(documentResult.text)
    } catch (error) {
      setPrintError(
        error instanceof Error
          ? error.message
          : t('Unable to open print dialog.', { defaultValue: 'Unable to open print dialog.' }),
      )
    } finally {
      setIsPrinting(false)
    }
  }

  return (
    <Dialog
      closeOnBackdropClick={false}
      open={open}
      onClose={() => onOpenChange(false)}
      title={<CardTitle>{t('Driver Manifest Print View', { defaultValue: 'Driver Manifest Print View' })}</CardTitle>}
    >
      {printQuery.isLoading ? <LoadingState title={t('Loading manifest print view', { defaultValue: 'Loading manifest print view' })} /> : null}
      {printQuery.isError ? (
        <ErrorState
          title={t('Unable to load print view', { defaultValue: 'Unable to load print view' })}
          message={getApiErrorMessage(printQuery.error)}
          onRetry={() => void printQuery.refetch()}
        />
      ) : null}
      {documentResult ? (
        <div className="page-stack">
          <p className="table-meta">
            {t('Printable manifest data from the API.', {
              defaultValue: 'Printable manifest data from the API.',
            })}
          </p>
          <div className="page-header__button-row">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              {t('Close')}
            </Button>
            {documentResult.objectUrl ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => window.open(documentResult.objectUrl, '_blank', 'noopener,noreferrer')}
              >
                {t('Open')}
              </Button>
            ) : null}
            <Button type="button" loading={isPrinting} onClick={() => void handlePrint()}>
              {t('Print / Save PDF', { defaultValue: 'Print / Save PDF' })}
            </Button>
          </div>
          {printError ? <div className="form-error">{printError}</div> : null}
          <iframe
            className="w-full min-h-[40rem] rounded-xl border border-slate-200 bg-white"
            srcDoc={documentResult.text}
            title={t('Driver Manifest', { defaultValue: 'Driver Manifest' })}
          />
        </div>
      ) : null}
    </Dialog>
  )
}
