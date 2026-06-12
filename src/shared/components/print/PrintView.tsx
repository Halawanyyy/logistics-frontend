import type { PropsWithChildren } from 'react'
import { Printer } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '../ui/Button'
import { cn } from '../../utils/cn'

type PrintViewProps = PropsWithChildren<{
  title: string
  className?: string
  showPrintButton?: boolean
}>

export function PrintView({
  title,
  children,
  className,
  showPrintButton = true,
}: PrintViewProps) {
  const { t } = useTranslation()

  return (
    <section className={cn('print-view', className)} dir="auto">
      <style>
        {`
          @media print {
            .app-sidebar,
            .app-topbar,
            .no-print,
            .ui-dialog__backdrop {
              display: none !important;
            }

            .app-shell__main,
            .app-shell__content,
            .page-section {
              padding: 0 !important;
              margin: 0 !important;
              background: #fff !important;
              color: #000 !important;
            }

            .print-view,
            .print-view * {
              font-family: Cairo, Tajawal, "Noto Kufi Arabic", Arial, system-ui, sans-serif !important;
            }
          }
        `}
      </style>
      {showPrintButton ? (
        <div className="form-actions no-print">
          <Button type="button" variant="secondary" onClick={() => window.print()}>
            <Printer size={16} />
            {t('Print {{title}}', {
              title,
              defaultValue: `Print ${title}`,
            })}
          </Button>
        </div>
      ) : null}
      {children}
    </section>
  )
}
