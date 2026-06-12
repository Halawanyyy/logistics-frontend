import { useEffect, useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Copy } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getApiErrorMessage } from '../../api/api-error'
import { useLocale } from '../../i18n/useLocale'
import type { LabelDocument, LabelFormat, LabelRequestOptions } from '../../types/labels.types'
import { printHtmlDocument, wrapPrintableHtml } from '../../utils/printHtml'
import { Button } from '../ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card'
import { Dialog } from '../ui/Dialog'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'

function logLabelDialog(message: string, details?: Record<string, unknown>) {
  if (!import.meta.env.DEV || typeof console === 'undefined') {
    return
  }

  console.info('[shipment-label]', message, details ?? {})
}

type LabelDocumentDialogProps = {
  buttonVariant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'icon'
  className?: string
  defaultFormat?: LabelFormat
  description?: string
  fetchDocument: (options: LabelRequestOptions) => Promise<LabelDocument>
  formats?: LabelFormat[]
  hideTrigger?: boolean
  onOpenChange?: (open: boolean) => void
  open?: boolean
  title: string
  triggerLabel: string
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

function normalizeDimensionValue(value: string) {
  const trimmed = value.trim()
  if (!trimmed) {
    return undefined
  }

  const numericValue = Number(trimmed)
  if (Number.isNaN(numericValue) || numericValue <= 0) {
    return undefined
  }

  return numericValue
}

export function LabelDocumentDialog({
  buttonVariant = 'secondary',
  className,
  defaultFormat = 'html',
  description,
  fetchDocument,
  formats = ['html', 'pdf'],
  hideTrigger = false,
  onOpenChange,
  open: controlledOpen,
  title,
  triggerLabel,
}: LabelDocumentDialogProps) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const availableFormats: LabelFormat[] = formats.length ? formats : ['html']
  const initialFormat: LabelFormat = availableFormats.includes(defaultFormat)
    ? defaultFormat
    : (availableFormats[0] ?? 'html')
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const [format, setFormat] = useState<LabelFormat>(initialFormat)
  const [widthMm, setWidthMm] = useState('')
  const [heightMm, setHeightMm] = useState('')
  const [documentResult, setDocumentResult] = useState<LabelDocument | null>(null)
  const [copied, setCopied] = useState(false)
  const [printError, setPrintError] = useState('')
  const [isPrinting, setIsPrinting] = useState(false)
  const [hasLoadedDocument, setHasLoadedDocument] = useState(false)
  const [loadedRequestKey, setLoadedRequestKey] = useState<string | null>(null)
  const open = controlledOpen ?? uncontrolledOpen
  const parsedWidthMm = useMemo(() => normalizeDimensionValue(widthMm), [widthMm])
  const parsedHeightMm = useMemo(() => normalizeDimensionValue(heightMm), [heightMm])
  const requestOptions = useMemo<LabelRequestOptions>(() => ({
    format,
    ...(parsedWidthMm ? { width_mm: parsedWidthMm } : {}),
    ...(parsedHeightMm ? { height_mm: parsedHeightMm } : {}),
  }), [format, parsedHeightMm, parsedWidthMm])
  const requestKey = useMemo(() => JSON.stringify(requestOptions), [requestOptions])
  const mutation = useMutation({
    mutationFn: fetchDocument,
    onSuccess: (result, variables) => {
      logLabelDialog('LabelDocumentDialog received document content', {
        format: result.format,
        hasText: Boolean(result.text),
        textContainsMarker: result.text?.includes('FRONTEND_LABEL_LAYOUT_V2') ?? false,
      })
      setDocumentResult(result)
      setCopied(false)
      setHasLoadedDocument(true)
      setLoadedRequestKey(JSON.stringify(variables ?? {}))
      setPrintError('')
    },
  })

  useEffect(() => {
    return () => {
      if (documentResult?.objectUrl) {
        URL.revokeObjectURL(documentResult.objectUrl)
      }
    }
  }, [documentResult])

  const renderText = useMemo(() => {
    if (!documentResult) {
      return ''
    }

    if (documentResult.format === 'json') {
      return JSON.stringify(documentResult.json ?? documentResult.text ?? {}, null, 2)
    }

    return documentResult.text ?? ''
  }, [documentResult])

  const resolvedTitle = useMemo(
    () => t(title, { defaultValue: title }),
    [t, title],
  )

  const htmlPreviewText = useMemo(() => {
    if (documentResult?.format !== 'html' || !documentResult.text) {
      return ''
    }

    const html = wrapPrintableHtml(documentResult.text, {
      locale,
      title: resolvedTitle,
    })
    logLabelDialog('iframe html contains marker', {
      containsMarker: html.includes('FRONTEND_LABEL_LAYOUT_V2'),
      containsSvg: html.includes('<svg'),
      containsTable: html.includes('<table'),
    })
    return html
  }, [documentResult, locale, resolvedTitle])

  const htmlPreviewUrl = useMemo(() => {
    if (!htmlPreviewText) {
      return undefined
    }

    return URL.createObjectURL(new Blob([htmlPreviewText], { type: 'text/html;charset=utf-8' }))
  }, [htmlPreviewText])

  useEffect(() => {
    return () => {
      if (htmlPreviewUrl) {
        URL.revokeObjectURL(htmlPreviewUrl)
      }
    }
  }, [htmlPreviewUrl])

  const isFrontendPdfFallback = format === 'pdf' && documentResult?.format === 'html' && Boolean(htmlPreviewText)
  const previewFrameStyle = useMemo(() => {
    const style: Record<string, string> = {}

    if (parsedWidthMm) {
      style.maxWidth = `${Math.max(parsedWidthMm * 3.78 + 32, 320)}px`
      style.marginInline = 'auto'
    }

    if (parsedHeightMm) {
      style.minHeight = `${Math.max(parsedHeightMm * 3.78 + 32, 320)}px`
    }

    return style
  }, [parsedHeightMm, parsedWidthMm])

  async function copyContent() {
    if (!renderText) {
      return
    }

    await navigator.clipboard.writeText(renderText)
    setCopied(true)
  }

  function handleClose() {
    onOpenChange?.(false)
    setUncontrolledOpen(false)
    setCopied(false)
    setPrintError('')
    logLabelDialog('dialog close requested', {
      title: resolvedTitle,
    })
  }

  function handleLoad() {
    logLabelDialog('label load requested', {
      format,
      heightMm: requestOptions.height_mm,
      title: resolvedTitle,
      widthMm: requestOptions.width_mm,
    })
    mutation.mutate(requestOptions)
  }

  useEffect(() => {
    if (!open || !hasLoadedDocument || loadedRequestKey === requestKey) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      handleLoad()
    }, 250)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [hasLoadedDocument, loadedRequestKey, open, requestKey])

  async function handlePrint() {
    if (!htmlPreviewText) {
      return
    }

    setIsPrinting(true)
    setPrintError('')

    try {
      await printHtmlDocument(htmlPreviewText)
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
    <>
      {!hideTrigger ? (
        <Button
          className={className}
          type="button"
          variant={buttonVariant}
          onClick={() => {
            logLabelDialog('shipment label button clicked', {
              title: resolvedTitle,
              triggerLabel,
            })
            onOpenChange?.(true)
            setUncontrolledOpen(true)
          }}
        >
          {t(triggerLabel, { defaultValue: triggerLabel })}
        </Button>
      ) : null}
      <Dialog closeOnBackdropClick={false} open={open} onClose={handleClose} title={<CardTitle>{resolvedTitle}</CardTitle>}>
        <div className="page-stack">
          <Card>
            <CardHeader>
              <CardTitle>{t('Label Options')}</CardTitle>
              <CardDescription>
                {t(description ?? 'Backend generated label content. Print from this device/printer.', {
                  defaultValue: description ?? 'Backend generated label content. Print from this device/printer.',
                })}
              </CardDescription>
            </CardHeader>
            <CardContent className="form-grid">
              <label className="field">
                <span>{t('Format')}</span>
                <Select value={format} onChange={(event) => setFormat(event.target.value as LabelFormat)}>
                  {availableFormats.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </Select>
              </label>
              <label className="field">
                <span>{t('Width (mm)')}</span>
                <Input type="number" value={widthMm} onChange={(event) => setWidthMm(event.target.value)} />
              </label>
              <label className="field">
                <span>{t('Height (mm)')}</span>
                <Input type="number" value={heightMm} onChange={(event) => setHeightMm(event.target.value)} />
              </label>
              <div className="form-actions">
                <Button type="button" variant="secondary" onClick={handleClose}>
                  {t('Close')}
                </Button>
                <Button type="button" loading={mutation.isPending} onClick={handleLoad}>
                  {t('Load')}
                </Button>
              </div>
              {mutation.error ? <div className="form-error">{getApiErrorMessage(mutation.error)}</div> : null}
              {printError ? <div className="form-error">{printError}</div> : null}
            </CardContent>
          </Card>

          {documentResult ? (
            <Card>
              <CardHeader>
                <CardTitle>{t('Output')}</CardTitle>
                <CardDescription>
                  {isFrontendPdfFallback
                    ? t('PDF uses browser print dialog. Choose Save as PDF from your browser.', {
                        defaultValue: 'PDF uses browser print dialog. Choose Save as PDF from your browser.',
                      })
                    : t('Backend generated label content. Print from this device/printer.')}
                </CardDescription>
              </CardHeader>
              <CardContent className="page-stack">
                <div className="page-header__button-row">
                  {!isFrontendPdfFallback ? (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => downloadBlob(documentResult.blob, documentResult.fileName)}
                    >
                      {t('Download')}
                    </Button>
                  ) : null}
                  {(documentResult.format === 'html' ? htmlPreviewUrl : documentResult.objectUrl) ? (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => window.open(
                        documentResult.format === 'html' ? htmlPreviewUrl : documentResult.objectUrl,
                        '_blank',
                        'noopener,noreferrer',
                      )}
                    >
                      {t('Open')}
                    </Button>
                  ) : null}
                  {documentResult.format === 'html' && htmlPreviewText ? (
                    <Button type="button" variant="secondary" loading={isPrinting} onClick={() => void handlePrint()}>
                      {isFrontendPdfFallback
                        ? t('Print / Save PDF', { defaultValue: 'Print / Save PDF' })
                        : t('Print')}
                    </Button>
                  ) : null}
                  {(documentResult.format === 'zpl' || documentResult.format === 'tspl' || documentResult.format === 'json') && renderText ? (
                    <Button type="button" variant="secondary" onClick={() => void copyContent()}>
                      <Copy size={14} />
                      {copied ? t('Copied') : t('Copy')}
                    </Button>
                  ) : null}
                </div>

                {documentResult.format === 'pdf' && documentResult.objectUrl ? (
                  <div style={previewFrameStyle}>
                    <iframe
                      className="w-full min-h-[32rem] rounded-xl border border-slate-200 bg-white"
                      src={documentResult.objectUrl}
                      style={previewFrameStyle}
                      title={`${title} PDF`}
                    />
                  </div>
                ) : null}

                {documentResult.format === 'html' && htmlPreviewText ? (
                  <div style={previewFrameStyle}>
                    <iframe
                      className="w-full min-h-[32rem] rounded-xl border border-slate-200 bg-white"
                      srcDoc={htmlPreviewText}
                      style={previewFrameStyle}
                      title={`${title} HTML`}
                    />
                  </div>
                ) : null}

                {(documentResult.format === 'zpl' || documentResult.format === 'tspl' || documentResult.format === 'json') ? (
                  <pre className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-950 p-4 text-xs text-slate-100">
                    {renderText}
                  </pre>
                ) : null}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </Dialog>
    </>
  )
}
