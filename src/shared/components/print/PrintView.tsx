import type { PropsWithChildren } from 'react'
import { Printer } from 'lucide-react'
import { Button } from '../ui/Button'

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
  return (
    <section className={className}>
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
          }
        `}
      </style>
      {showPrintButton ? (
        <div className="form-actions no-print">
          <Button type="button" variant="secondary" onClick={() => window.print()}>
            <Printer size={16} />
            Print {title}
          </Button>
        </div>
      ) : null}
      {children}
    </section>
  )
}
