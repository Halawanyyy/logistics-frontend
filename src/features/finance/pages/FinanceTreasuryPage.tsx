import { PERMISSIONS } from '../../../shared/auth/permission-keys'
import { FinanceTabbedPage } from '../components/FinanceTabbedPage'
import { TreasuryAccountsPanel } from './TreasuryAccountsPage'
import { TreasuryTransactionsPanel } from './TreasuryTransactionsPage'
import { listTreasuryAccounts, listTreasuryTransactions } from '../api/finance.api'

export function FinanceTreasuryPage() {
  return (
    <FinanceTabbedPage
      title="Finance Treasury"
      description="Review treasury balances and their transaction history from one workspace."
      tabs={[
        {
          id: 'accounts',
          label: 'Accounts',
          permission: PERMISSIONS.FINANCE_TREASURY_VIEW,
          countSources: [{ queryKey: ['module-tab-count', 'finance-treasury', 'accounts'], queryFn: async () => (await listTreasuryAccounts()).data.length }],
          content: (onCountChange) => <TreasuryAccountsPanel embedded onCountChange={onCountChange} />,
        },
        {
          id: 'transactions',
          label: 'Transactions',
          permission: PERMISSIONS.FINANCE_TREASURY_VIEW,
          countSources: [{ queryKey: ['module-tab-count', 'finance-treasury', 'transactions'], queryFn: async () => (await listTreasuryTransactions()).data.length }],
          content: (onCountChange) => <TreasuryTransactionsPanel embedded onCountChange={onCountChange} />,
        },
      ]}
    />
  )
}
