import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Printer, AlertCircle } from 'lucide-react'
import { Button } from '../../../../shared/components/ui/Button'
import { createHtmlLabelDocument, printHtmlDocument } from '../../../../shared/utils/printHtml'
import type { AppLocale } from '../../../../shared/i18n/locale'
import { bulkPrintMerchantPortalWarehouseProductLabels } from '../api/merchantPortalWarehouse.api'
import type { MerchantPortalWarehouseProduct } from '../types/merchantPortalWarehouse.types'

type BulkBarcodeLabelsDialogProps = {
  products: MerchantPortalWarehouseProduct[]
  open: boolean
  onClose: () => void
}

export function BulkBarcodeLabelsDialog({ products, open, onClose }: BulkBarcodeLabelsDialogProps) {
  const { t } = useTranslation()
  const [items, setItems] = useState<Record<number, number>>({})
  const [format, setFormat] = useState<'html' | 'pdf' | 'zpl' | 'tspl'>('html')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  if (!open) return null

  const selectedItems = Object.entries(items)
    .filter(([_, qty]) => qty > 0)
    .map(([idStr, qty]) => ({ warehouse_product_id: Number(idStr), quantity: qty }))

  const totalQuantity = selectedItems.reduce((acc, item) => acc + item.quantity, 0)

  function handleQuantityChange(productId: number, qty: number) {
    const safeQty = Math.max(0, Math.min(100, qty))
    setItems((prev) => ({
      ...prev,
      [productId]: safeQty,
    }))
    setErrorMsg('')
  }

  async function handlePrint() {
    if (selectedItems.length === 0) {
      setErrorMsg(t('Please select at least one product with quantity > 0.'))
      return
    }

    if (selectedItems.length > 50) {
      setErrorMsg(t('You can select a maximum of 50 distinct products.'))
      return
    }

    if (totalQuantity > 200) {
      setErrorMsg(t('The total bulk label quantity cannot exceed 200.'))
      return
    }

    try {
      setIsSubmitting(true)
      const res = await bulkPrintMerchantPortalWarehouseProductLabels(selectedItems, format)
      
      const doc = createHtmlLabelDocument({
        html: typeof res === 'string' ? res : res.data?.html || res.html || '',
        fileName: `bulk-product-labels.html`,
        locale: (document.documentElement.lang || 'en') as AppLocale,
        title: t('Bulk Barcode Labels'),
      })
      await printHtmlDocument(doc.text || '')
      onClose()
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || t('Failed to generate bulk labels document.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Printer className="h-5 w-5 text-violet-400" />
            <h3 className="text-lg font-bold text-slate-100">{t('Print Bulk Barcode Labels')}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 text-sm font-semibold">
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">
              {t('Select products and specify label print quantities (Max 50 products, 200 total labels).')}
            </span>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as 'html' | 'pdf' | 'zpl' | 'tspl')}
              className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg px-2 py-1 focus:outline-none"
            >
              <option value="html">HTML</option>
              <option value="pdf">PDF</option>
              <option value="zpl">ZPL</option>
              <option value="tspl">TSPL</option>
            </select>
          </div>

          <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden">
            {products.map((product) => (
              <div key={product.id} className="p-3 bg-slate-800/40 flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-slate-200">{product.name}</div>
                  <div className="text-xs font-mono text-slate-400">SKU: {product.sku}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">{t('Qty')}:</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-100 font-bold text-center focus:outline-none focus:border-violet-500"
                    value={items[product.id] ?? 0}
                    onChange={(e) => handleQuantityChange(product.id, parseInt(e.target.value || '0', 10))}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-800 pt-4">
          <div className="text-xs font-semibold text-slate-400">
            {t('Selected')}: <span className="text-violet-400 font-bold">{selectedItems.length}</span> {t('items')} | {t('Total Labels')}: <span className="text-emerald-400 font-bold">{totalQuantity}</span> / 200
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
              {t('Cancel')}
            </Button>
            <Button variant="primary" onClick={handlePrint} disabled={isSubmitting || selectedItems.length === 0}>
              {isSubmitting ? t('Generating...') : t('Print Labels Stream')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
