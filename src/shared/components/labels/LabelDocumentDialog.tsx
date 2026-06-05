import { useEffect, useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Copy } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getApiErrorMessage } from '../../api/api-error'
import type { LabelDocument, LabelFormat, LabelRequestOptions } from '../../types/labels.types'
import { Button } from '../ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card'
import { Dialog } from '../ui/Dialog'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'

type LabelDocumentDialogProps = {
  buttonVariant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'icon'
  className?: string
  defaultFormat?: LabelFormat
  description?: string
  fetchDocument: (options: LabelRequestOptions) => Promise<LabelDocument>
  formats?: LabelFormat[]
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

function printHtml(html: string) {
  const printWindow = window.open('', '_blank', 'noopener,noreferrer')
  if (!printWindow) {
    return
  }

  printWindow.document.open()
  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()
  printWindow.print()
}

export function LabelDocumentDialog({
  buttonVariant = 'secondary',
  className,
  defaultFormat = 'html',
  description,
  fetchDocument,
  formats = ['html', 'pdf', 'zpl', 'tspl', 'json'],
  title,
  triggerLabel,
}: LabelDocumentDialogProps) {
  const { t } = useTranslation()
  const availableFormats: LabelFormat[] = formats.length ? formats : ['html']
  const initialFormat: LabelFormat = availableFormats.includes(defaultFormat)
    ? defaultFormat
    : (availableFormats[0] ?? 'html')
  const [open, setOpen] = useState(false)
  const [format, setFormat] = useState<LabelFormat>(initialFormat)
  const [widthMm, setWidthMm] = useState('')
  const [heightMm, setHeightMm] = useState('')
  const [documentResult, setDocumentResult] = useState<LabelDocument | null>(null)
  const [copied, setCopied] = useState(false)
  const mutation = useMutation({
    mutationFn: fetchDocument,
    onSuccess: (result) => {
      setDocumentResult(result)
      setCopied(false)
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

  async function copyContent() {
    if (!renderText) {
      return
    }

    await navigator.clipboard.writeText(renderText)
    setCopied(true)
  }

  function handleClose() {
    setOpen(false)
    setCopied(false)
  }

  function handleLoad() {
    mutation.mutate({
      format,
      ...(widthMm ? { width_mm: Number(widthMm) } : {}),
      ...(heightMm ? { height_mm: Number(heightMm) } : {}),
    })
  }

  return (
    <>
      <Button className={className} type="button" variant={buttonVariant} onClick={() => setOpen(true)}>
        {t(triggerLabel, { defaultValue: triggerLabel })}
      </Button>
      <Dialog open={open} onClose={handleClose} title={<CardTitle>{t(title, { defaultValue: title })}</CardTitle>}>
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
            </CardContent>
          </Card>

          {documentResult ? (
            <Card>
              <CardHeader>
                <CardTitle>{t('Output')}</CardTitle>
                <CardDescription>
                  {t('Backend generated label content. Print from this device/printer.')}
                </CardDescription>
              </CardHeader>
              <CardContent className="page-stack">
                <div className="page-header__button-row">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => downloadBlob(documentResult.blob, documentResult.fileName)}
                  >
                    {t('Download')}
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
                  {documentResult.format === 'html' && documentResult.text ? (
                    <Button type="button" variant="secondary" onClick={() => printHtml(documentResult.text!)}>
                      {t('Print')}
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
                  <iframe
                    className="w-full min-h-[32rem] rounded-xl border border-slate-200 bg-white"
                    src={documentResult.objectUrl}
                    title={`${title} PDF`}
                  />
                ) : null}

                {documentResult.format === 'html' && documentResult.text ? (
                  <iframe
                    className="w-full min-h-[32rem] rounded-xl border border-slate-200 bg-white"
                    srcDoc={documentResult.text}
                    title={`${title} HTML`}
                  />
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
