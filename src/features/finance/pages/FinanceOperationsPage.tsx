import { PERMISSIONS } from '../../../shared/auth/permission-keys'
import { FinanceTabbedPage } from '../components/FinanceTabbedPage'
import { DriverCashClosuresPanel } from './DriverCashClosuresPage'
import { ExpensesPanel } from './ExpensesPage'
import { MerchantInvoicesPanel } from './MerchantInvoicesPage'
import { MerchantPayoutsPanel } from './MerchantPayoutsPage'
import { listDriverCashClosures, listExpenses, listMerchantInvoices, listMerchantPayouts } from '../api/finance.api'

export function FinanceOperationsPage() {
  return (
    <FinanceTabbedPage
      title="Finance Operations"
      description="Manage payouts, invoices, expenses, and driver cash closures from one workspace."
      tabs={[
        {
          id: 'payouts',
          label: 'Merchant Payouts',
          permission: PERMISSIONS.PAYOUTS_VIEW,
          countSources: [{ queryKey: ['module-tab-count', 'finance-operations', 'payouts'], queryFn: async () => (await listMerchantPayouts()).data.length }],
          content: (onCountChange) => <MerchantPayoutsPanel embedded onCountChange={onCountChange} />,
        },
        {
          id: 'invoices',
          label: 'Merchant Invoices',
          permission: PERMISSIONS.FINANCE_INVOICES_VIEW,
          countSources: [{ queryKey: ['module-tab-count', 'finance-operations', 'invoices'], queryFn: async () => (await listMerchantInvoices()).data.length }],
          content: (onCountChange) => <MerchantInvoicesPanel embedded onCountChange={onCountChange} />,
        },
        {
          id: 'expenses',
          label: 'Expenses',
          permission: PERMISSIONS.EXPENSES_VIEW,
          countSources: [{ queryKey: ['module-tab-count', 'finance-operations', 'expenses'], queryFn: async () => (await listExpenses()).data.length }],
          content: (onCountChange) => <ExpensesPanel embedded onCountChange={onCountChange} />,
        },
        {
          id: 'cash-closures',
          label: 'Driver Cash Closures',
          permission: PERMISSIONS.CASH_CLOSURES_VIEW,
          countSources: [{ queryKey: ['module-tab-count', 'finance-operations', 'cash-closures'], queryFn: async () => (await listDriverCashClosures()).data.length }],
          content: (onCountChange) => <DriverCashClosuresPanel embedded onCountChange={onCountChange} />,
        },
      ]}
    />
  )
}
