import { useMemo, useState, type ReactNode } from 'react'
import { useQueries } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  getFinanceCompanyProfitSummary,
  getFinanceDailyCashReport,
  getFinanceDriverDiscrepanciesReport,
  getFinanceMerchantLedgerReport,
  getFinanceProfitLossReport,
  getFinanceReconciliationSummary,
  getFinanceWarehouseRevenueReport,
} from '../api/finance.api'
import type {
  FinanceDailyCashReport,
  FinanceDriverDiscrepanciesReport,
  FinanceMerchantLedgerReport,
  FinanceProfitLossReport,
  FinanceReportFilters,
  FinanceWarehouseRevenueReport,
} from '../types/finance.types'
import { getApiErrorMessage } from '../../../shared/api/api-error'
import { Can } from '../../../shared/auth/Can'
import { hasPermission } from '../../../shared/auth/permissions'
import { PERMISSIONS } from '../../../shared/auth/permission-keys'
import { MoneyDisplay } from '../../../shared/components/display/MoneyDisplay'
import { DateRangeFilter } from '../../../shared/components/filters/DateRangeFilter'
import { DriverSelector } from '../../../shared/components/selectors/DriverSelector'
import { MerchantSelector } from '../../../shared/components/selectors/MerchantSelector'
import { TreasuryAccountSelector } from '../../../shared/components/selectors/TreasuryAccountSelector'
import { EmptyState } from '../../../shared/components/states/EmptyState'
import { ErrorState } from '../../../shared/components/states/ErrorState'
import { LoadingState } from '../../../shared/components/states/LoadingState'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/Card'
import { PageHeader } from '../../../shared/components/ui/PageHeader'
import { StatusBadge } from '../../../shared/components/ui/StatusBadge'
import { Table, TableCell, TableContainer, TableHead } from '../../../shared/components/ui/Table'
import { pickDisplayLabel } from '../../../shared/i18n/locale'
import { formatDate } from '../../../shared/utils/formatters'
import { useAuthStore } from '../../auth/store/auth.store'

type FinanceReportsFiltersState = {
  date_from: string
  date_to: string
  merchant_id: string
  driver_id: string
  treasury_account_id: string
}

const initialFilters: FinanceReportsFiltersState = {
  date_from: '',
  date_to: '',
  merchant_id: '',
  driver_id: '',
  treasury_account_id: '',
}

export function FinanceReportsPage() {
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.user)
  const [filters, setFilters] = useState<FinanceReportsFiltersState>(initialFilters)
  const params: FinanceReportFilters = useMemo(
    () => ({
      ...(filters.date_from ? { date_from: filters.date_from } : {}),
      ...(filters.date_to ? { date_to: filters.date_to } : {}),
      ...(filters.merchant_id ? { merchant_id: filters.merchant_id } : {}),
      ...(filters.driver_id ? { driver_id: filters.driver_id } : {}),
      ...(filters.treasury_account_id ? { treasury_account_id: filters.treasury_account_id } : {}),
    }),
    [filters],
  )

  const [
    reconciliationQuery,
    companyProfitQuery,
    dailyCashQuery,
    merchantLedgerQuery,
    driverDiscrepanciesQuery,
    warehouseRevenueQuery,
    profitLossQuery,
  ] = useQueries({
    queries: [
      {
        queryKey: ['finance-reconciliation-summary', params],
        queryFn: () => getFinanceReconciliationSummary(params),
        enabled: hasPermission(user, PERMISSIONS.FINANCE_RECONCILIATION_VIEW),
      },
      {
        queryKey: ['finance-company-profit-summary', params],
        queryFn: () => getFinanceCompanyProfitSummary(params),
        enabled: hasPermission(user, PERMISSIONS.FINANCE_REPORTS_VIEW),
      },
      {
        queryKey: ['finance-reports', 'daily-cash', params],
        queryFn: () => getFinanceDailyCashReport(params),
        enabled: hasPermission(user, PERMISSIONS.FINANCE_REPORTS_DAILY_CASH),
      },
      {
        queryKey: ['finance-reports', 'merchant-ledger', params],
        queryFn: () => getFinanceMerchantLedgerReport(params),
        enabled: hasPermission(user, PERMISSIONS.FINANCE_REPORTS_MERCHANT_LEDGER),
      },
      {
        queryKey: ['finance-reports', 'driver-discrepancies', params],
        queryFn: () => getFinanceDriverDiscrepanciesReport(params),
        enabled: hasPermission(user, PERMISSIONS.FINANCE_REPORTS_DRIVER_DISCREPANCIES),
      },
      {
        queryKey: ['finance-reports', 'warehouse-revenue', params],
        queryFn: () => getFinanceWarehouseRevenueReport(params),
        enabled: hasPermission(user, PERMISSIONS.FINANCE_REPORTS_WAREHOUSE_REVENUE),
      },
      {
        queryKey: ['finance-reports', 'profit-loss', params],
        queryFn: () => getFinanceProfitLossReport(params),
        enabled: hasPermission(user, PERMISSIONS.FINANCE_REPORTS_PROFIT_LOSS),
      },
    ],
  })

  return (
    <section className="page-section">
      <PageHeader
        title={t('Finance Reports', { defaultValue: 'Finance Reports' })}
        description={t('Reconciliation, treasury, merchant ledger, warehouse revenue, and profit reports.', {
          defaultValue: 'Reconciliation, treasury, merchant ledger, warehouse revenue, and profit reports.',
        })}
      />

      <Card variant="flat" className="dashboard-filter-card">
        <CardContent className="dashboard-filters">
          <DateRangeFilter
            dateFrom={filters.date_from}
            dateTo={filters.date_to}
            onChange={({ date_from, date_to }) => setFilters((current) => ({ ...current, date_from, date_to }))}
          />
          <label className="field">
            <span>{t('Merchant')}</span>
            <MerchantSelector
              value={filters.merchant_id}
              includeAllOption
              onChange={(merchant_id) => setFilters((current) => ({ ...current, merchant_id }))}
            />
          </label>
          <label className="field">
            <span>{t('Driver', { defaultValue: 'Driver' })}</span>
            <DriverSelector
              value={filters.driver_id}
              includeAllOption
              onChange={(driver_id) => setFilters((current) => ({ ...current, driver_id }))}
            />
          </label>
          <label className="field">
            <span>{t('Treasury Account', { defaultValue: 'Treasury Account' })}</span>
            <TreasuryAccountSelector
              value={filters.treasury_account_id}
              includeAllOption
              onChange={(treasury_account_id) => setFilters((current) => ({ ...current, treasury_account_id }))}
            />
          </label>
        </CardContent>
      </Card>

      <Can permission={PERMISSIONS.FINANCE_RECONCILIATION_VIEW}>
        <Card>
          <CardHeader>
            <CardTitle>{t('Reconciliation')}</CardTitle>
            <CardDescription>{t('Backend-owned COD, manifest, wallet, payout, and treasury reconciliation values.', {
              defaultValue: 'Backend-owned COD, manifest, wallet, payout, and treasury reconciliation values.',
            })}</CardDescription>
          </CardHeader>
          <CardContent>
            {reconciliationQuery.isLoading ? <LoadingState title={t('Loading reconciliation summary', { defaultValue: 'Loading reconciliation summary' })} /> : null}
            {reconciliationQuery.isError ? (
              <ErrorState
                title={t('Unable to load reconciliation summary', { defaultValue: 'Unable to load reconciliation summary' })}
                message={getApiErrorMessage(reconciliationQuery.error)}
                onRetry={() => void reconciliationQuery.refetch()}
              />
            ) : null}
            {reconciliationQuery.data ? (
              <div className="stats-grid">
                <StatTile label={t('COD Expected', { defaultValue: 'COD Expected' })} value={<MoneyDisplay value={reconciliationQuery.data.data.total_cod_expected} />} />
                <StatTile label={t('Driver Cash Verified', { defaultValue: 'Driver Cash Verified' })} value={<MoneyDisplay value={reconciliationQuery.data.data.total_driver_cash_verified} />} />
                <StatTile label={t('COD Difference', { defaultValue: 'COD Difference' })} value={<MoneyDisplay value={reconciliationQuery.data.data.cod_difference} />} />
                <StatTile label={t('Closed Manifests', { defaultValue: 'Closed Manifests' })} value={reconciliationQuery.data.data.driver_manifests_closed} />
                <StatTile label={t('Manifest Expected COD', { defaultValue: 'Manifest Expected COD' })} value={<MoneyDisplay value={reconciliationQuery.data.data.driver_manifest_expected_cod} />} />
                <StatTile label={t('Manifest Actual Received', { defaultValue: 'Manifest Actual Received' })} value={<MoneyDisplay value={reconciliationQuery.data.data.driver_manifest_actual_received} />} />
                <StatTile label={t('Manifest Discrepancy', { defaultValue: 'Manifest Discrepancy' })} value={<MoneyDisplay value={reconciliationQuery.data.data.driver_manifest_discrepancy_total} />} />
                <StatTile label={t('Wallet Credits', { defaultValue: 'Wallet Credits' })} value={<MoneyDisplay value={reconciliationQuery.data.data.wallet_total_credits} />} />
                <StatTile label={t('Wallet Debits', { defaultValue: 'Wallet Debits' })} value={<MoneyDisplay value={reconciliationQuery.data.data.wallet_total_debits} />} />
                <StatTile label={t('Wallet Available Total', { defaultValue: 'Wallet Available Total' })} value={<MoneyDisplay value={reconciliationQuery.data.data.wallet_available_total} />} />
                <StatTile label={t('Payouts Pending', { defaultValue: 'Payouts Pending' })} value={<MoneyDisplay value={reconciliationQuery.data.data.payout_pending_total} />} />
                <StatTile label={t('Payouts Approved', { defaultValue: 'Payouts Approved' })} value={<MoneyDisplay value={reconciliationQuery.data.data.payout_approved_total} />} />
                <StatTile label={t('Payouts Completed', { defaultValue: 'Payouts Completed' })} value={<MoneyDisplay value={reconciliationQuery.data.data.payout_completed_total} />} />
                <StatTile label={t('Treasury Accounts', { defaultValue: 'Treasury Accounts' })} value={reconciliationQuery.data.data.treasury_accounts_total} />
                <StatTile label={t('Treasury Current Balance', { defaultValue: 'Treasury Current Balance' })} value={<MoneyDisplay value={reconciliationQuery.data.data.treasury_current_balance_total} />} />
                <StatTile label={t('Merchant Payable', { defaultValue: 'Merchant Payable' })} value={<MoneyDisplay value={reconciliationQuery.data.data.total_merchant_payable} />} />
                <StatTile label={t('Merchant Paid Out', { defaultValue: 'Merchant Paid Out' })} value={<MoneyDisplay value={reconciliationQuery.data.data.total_merchant_paid_out} />} />
                <StatTile label={t('Merchant Balance Remaining', { defaultValue: 'Merchant Balance Remaining' })} value={<MoneyDisplay value={reconciliationQuery.data.data.merchant_balance_remaining} />} />
              </div>
            ) : null}
          </CardContent>
        </Card>
      </Can>

      <Can permission={PERMISSIONS.FINANCE_REPORTS_VIEW}>
        <Card>
          <CardHeader>
            <CardTitle>{t('Company Profit', { defaultValue: 'Company Profit' })}</CardTitle>
            <CardDescription>{t('Shipping revenue, warehouse charges, paid expenses, and net company profit.', {
              defaultValue: 'Shipping revenue, warehouse charges, paid expenses, and net company profit.',
            })}</CardDescription>
          </CardHeader>
          <CardContent>
            {companyProfitQuery.isLoading ? <LoadingState title={t('Loading company profit summary', { defaultValue: 'Loading company profit summary' })} /> : null}
            {companyProfitQuery.isError ? (
              <ErrorState
                title={t('Unable to load company profit summary', { defaultValue: 'Unable to load company profit summary' })}
                message={getApiErrorMessage(companyProfitQuery.error)}
                onRetry={() => void companyProfitQuery.refetch()}
              />
            ) : null}
            {companyProfitQuery.data ? (
              <div className="stats-grid">
                <StatTile label={t('Shipping Fees', { defaultValue: 'Shipping Fees' })} value={<MoneyDisplay value={companyProfitQuery.data.data.total_shipping_fees} />} />
                <StatTile label={t('Warehouse Charges', { defaultValue: 'Warehouse Charges' })} value={<MoneyDisplay value={companyProfitQuery.data.data.total_warehouse_charges} />} />
                <StatTile label={t('Expenses', { defaultValue: 'Expenses' })} value={<MoneyDisplay value={companyProfitQuery.data.data.total_expenses} />} />
                <StatTile label={t('Net Company Profit', { defaultValue: 'Net Company Profit' })} value={<MoneyDisplay value={companyProfitQuery.data.data.net_company_profit} />} />
                <StatTile label={t('COD Collected', { defaultValue: 'COD Collected' })} value={<MoneyDisplay value={companyProfitQuery.data.data.total_cod_collected} />} />
                <StatTile label={t('Delivered Shipments', { defaultValue: 'Delivered Shipments' })} value={companyProfitQuery.data.data.delivered_shipments_count} />
              </div>
            ) : null}
          </CardContent>
        </Card>
      </Can>

      <Can permission={PERMISSIONS.FINANCE_REPORTS_DAILY_CASH}>
        <Card>
          <CardHeader>
            <CardTitle>{t('Daily Cash', { defaultValue: 'Daily Cash' })}</CardTitle>
            <CardDescription>{t('Treasury cash-in, cash-out, and current balances by treasury account.', {
              defaultValue: 'Treasury cash-in, cash-out, and current balances by treasury account.',
            })}</CardDescription>
          </CardHeader>
          <CardContent>
            {dailyCashQuery.isLoading ? <LoadingState title={t('Loading daily cash report', { defaultValue: 'Loading daily cash report' })} /> : null}
            {dailyCashQuery.isError ? (
              <ErrorState
                title={t('Unable to load daily cash report', { defaultValue: 'Unable to load daily cash report' })}
                message={getApiErrorMessage(dailyCashQuery.error)}
                onRetry={() => void dailyCashQuery.refetch()}
              />
            ) : null}
            {dailyCashQuery.data ? <DailyCashReportView report={dailyCashQuery.data.data} /> : null}
          </CardContent>
        </Card>
      </Can>

      <Can permission={PERMISSIONS.FINANCE_REPORTS_MERCHANT_LEDGER}>
        <Card>
          <CardHeader>
            <CardTitle>{t('Merchant Ledger', { defaultValue: 'Merchant Ledger' })}</CardTitle>
            <CardDescription>{t('Wallet ledger items and backend summary totals for the selected filters.', {
              defaultValue: 'Wallet ledger items and backend summary totals for the selected filters.',
            })}</CardDescription>
          </CardHeader>
          <CardContent>
            {merchantLedgerQuery.isLoading ? <LoadingState title={t('Loading merchant ledger report', { defaultValue: 'Loading merchant ledger report' })} /> : null}
            {merchantLedgerQuery.isError ? (
              <ErrorState
                title={t('Unable to load merchant ledger report', { defaultValue: 'Unable to load merchant ledger report' })}
                message={getApiErrorMessage(merchantLedgerQuery.error)}
                onRetry={() => void merchantLedgerQuery.refetch()}
              />
            ) : null}
            {merchantLedgerQuery.data ? <MerchantLedgerReportView report={merchantLedgerQuery.data.data} /> : null}
          </CardContent>
        </Card>
      </Can>

      <Can permission={PERMISSIONS.FINANCE_REPORTS_DRIVER_DISCREPANCIES}>
        <Card>
          <CardHeader>
            <CardTitle>{t('Driver Discrepancies', { defaultValue: 'Driver Discrepancies' })}</CardTitle>
            <CardDescription>{t('Closed driver manifests with expected, received, and difference totals.', {
              defaultValue: 'Closed driver manifests with expected, received, and difference totals.',
            })}</CardDescription>
          </CardHeader>
          <CardContent>
            {driverDiscrepanciesQuery.isLoading ? <LoadingState title={t('Loading driver discrepancies report', { defaultValue: 'Loading driver discrepancies report' })} /> : null}
            {driverDiscrepanciesQuery.isError ? (
              <ErrorState
                title={t('Unable to load driver discrepancies report', { defaultValue: 'Unable to load driver discrepancies report' })}
                message={getApiErrorMessage(driverDiscrepanciesQuery.error)}
                onRetry={() => void driverDiscrepanciesQuery.refetch()}
              />
            ) : null}
            {driverDiscrepanciesQuery.data ? <DriverDiscrepanciesReportView report={driverDiscrepanciesQuery.data.data} /> : null}
          </CardContent>
        </Card>
      </Can>

      <Can permission={PERMISSIONS.FINANCE_REPORTS_WAREHOUSE_REVENUE}>
        <Card>
          <CardHeader>
            <CardTitle>{t('Warehouse Revenue', { defaultValue: 'Warehouse Revenue' })}</CardTitle>
            <CardDescription>{t('Storage, packaging, and fulfillment revenue grouped by type and merchant.', {
              defaultValue: 'Storage, packaging, and fulfillment revenue grouped by type and merchant.',
            })}</CardDescription>
          </CardHeader>
          <CardContent>
            {warehouseRevenueQuery.isLoading ? <LoadingState title={t('Loading warehouse revenue report', { defaultValue: 'Loading warehouse revenue report' })} /> : null}
            {warehouseRevenueQuery.isError ? (
              <ErrorState
                title={t('Unable to load warehouse revenue report', { defaultValue: 'Unable to load warehouse revenue report' })}
                message={getApiErrorMessage(warehouseRevenueQuery.error)}
                onRetry={() => void warehouseRevenueQuery.refetch()}
              />
            ) : null}
            {warehouseRevenueQuery.data ? <WarehouseRevenueReportView report={warehouseRevenueQuery.data.data} /> : null}
          </CardContent>
        </Card>
      </Can>

      <Can permission={PERMISSIONS.FINANCE_REPORTS_PROFIT_LOSS}>
        <Card>
          <CardHeader>
            <CardTitle>{t('Profit & Loss', { defaultValue: 'Profit & Loss' })}</CardTitle>
            <CardDescription>{t('Backend-owned revenue, expense, and treasury net cash values.', {
              defaultValue: 'Backend-owned revenue, expense, and treasury net cash values.',
            })}</CardDescription>
          </CardHeader>
          <CardContent>
            {profitLossQuery.isLoading ? <LoadingState title={t('Loading profit and loss report', { defaultValue: 'Loading profit and loss report' })} /> : null}
            {profitLossQuery.isError ? (
              <ErrorState
                title={t('Unable to load profit and loss report', { defaultValue: 'Unable to load profit and loss report' })}
                message={getApiErrorMessage(profitLossQuery.error)}
                onRetry={() => void profitLossQuery.refetch()}
              />
            ) : null}
            {profitLossQuery.data ? <ProfitLossReportView report={profitLossQuery.data.data} /> : null}
          </CardContent>
        </Card>
      </Can>
    </section>
  )
}

function DailyCashReportView({ report }: { report: FinanceDailyCashReport }) {
  const { t } = useTranslation()
  return (
    <div className="page-stack">
      <div className="stats-grid">
        <StatTile label={t('Total Cash In', { defaultValue: 'Total Cash In' })} value={<MoneyDisplay value={report.total_cash_in} />} />
        <StatTile label={t('Total Cash Out', { defaultValue: 'Total Cash Out' })} value={<MoneyDisplay value={report.total_cash_out} />} />
        <StatTile label={t('Net Cash', { defaultValue: 'Net Cash' })} value={<MoneyDisplay value={report.net_cash} />} />
        <StatTile label={t('Driver Cash Received', { defaultValue: 'Driver Cash Received' })} value={<MoneyDisplay value={report.driver_cash_received} />} />
        <StatTile label={t('Merchant Payouts Paid', { defaultValue: 'Merchant Payouts Paid' })} value={<MoneyDisplay value={report.merchant_payouts_paid} />} />
        <StatTile label={t('Expenses Paid', { defaultValue: 'Expenses Paid' })} value={<MoneyDisplay value={report.expenses_paid} />} />
      </div>

      {report.treasury_accounts.length ? (
        <TableContainer>
          <Table variant="compact">
            <thead>
              <tr>
                <TableHead>{t('Account', { defaultValue: 'Account' })}</TableHead>
                <TableHead>{t('Code', { defaultValue: 'Code' })}</TableHead>
                <TableHead>{t('Type', { defaultValue: 'Type' })}</TableHead>
                <TableHead>{t('Current Balance', { defaultValue: 'Current Balance' })}</TableHead>
              </tr>
            </thead>
            <tbody>
              {report.treasury_accounts.map((account) => (
                <tr key={account.id}>
                  <TableCell>{account.name}</TableCell>
                  <TableCell>{account.code}</TableCell>
                  <TableCell>{pickDisplayLabel(account.type, account.type_label)}</TableCell>
                  <TableCell><MoneyDisplay value={account.current_balance} /></TableCell>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableContainer>
      ) : (
        <EmptyState
          title={t('No treasury accounts returned', { defaultValue: 'No treasury accounts returned' })}
          description={t('The report did not include treasury account balances for the selected filters.', {
            defaultValue: 'The report did not include treasury account balances for the selected filters.',
          })}
        />
      )}
    </div>
  )
}

function MerchantLedgerReportView({ report }: { report: FinanceMerchantLedgerReport }) {
  const { t } = useTranslation()
  return (
    <div className="page-stack">
      <div className="stats-grid">
        <StatTile label={t('Total Credits', { defaultValue: 'Total Credits' })} value={<MoneyDisplay value={report.summary.total_credits} />} />
        <StatTile label={t('Total Debits', { defaultValue: 'Total Debits' })} value={<MoneyDisplay value={report.summary.total_debits} />} />
        <StatTile label={t('Pending Transactions', { defaultValue: 'Pending Transactions' })} value={report.summary.pending_transactions} />
      </div>

      {report.items.length ? (
        <TableContainer>
          <Table variant="compact">
            <thead>
              <tr>
                <TableHead>{t('Merchant')}</TableHead>
                <TableHead>{t('Transaction #', { defaultValue: 'Transaction #' })}</TableHead>
                <TableHead>{t('Type', { defaultValue: 'Type' })}</TableHead>
                <TableHead>{t('Direction', { defaultValue: 'Direction' })}</TableHead>
                <TableHead>{t('Amount', { defaultValue: 'Amount' })}</TableHead>
                <TableHead>{t('Balance After', { defaultValue: 'Balance After' })}</TableHead>
                <TableHead>{t('Status')}</TableHead>
                <TableHead>{t('Source', { defaultValue: 'Source' })}</TableHead>
                <TableHead>{t('Reference', { defaultValue: 'Reference' })}</TableHead>
                <TableHead>{t('Created', { defaultValue: 'Created' })}</TableHead>
              </tr>
            </thead>
            <tbody>
              {report.items.map((item) => (
                <tr key={item.id}>
                  <TableCell>{item.merchant_name}</TableCell>
                  <TableCell>{item.transaction_number}</TableCell>
                  <TableCell>{pickDisplayLabel(item.transaction_type, item.transaction_type_label)}</TableCell>
                  <TableCell>{pickDisplayLabel(item.direction, item.direction_label)}</TableCell>
                  <TableCell><MoneyDisplay value={item.amount} /></TableCell>
                  <TableCell><MoneyDisplay value={item.balance_after} /></TableCell>
                  <TableCell>
                    <StatusBadge value={item.status}>
                      {pickDisplayLabel(item.status, item.status_label)}
                    </StatusBadge>
                  </TableCell>
                  <TableCell>{pickDisplayLabel(item.source_type ?? '-', item.source_type_label)}</TableCell>
                  <TableCell>{item.reference_number ?? '-'}</TableCell>
                  <TableCell>{formatDate(item.created_at)}</TableCell>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableContainer>
      ) : (
        <EmptyState
          title={t('No merchant ledger entries', { defaultValue: 'No merchant ledger entries' })}
          description={t('The backend returned no merchant ledger entries for the selected filters.', {
            defaultValue: 'The backend returned no merchant ledger entries for the selected filters.',
          })}
        />
      )}
    </div>
  )
}

function DriverDiscrepanciesReportView({ report }: { report: FinanceDriverDiscrepanciesReport }) {
  const { t } = useTranslation()
  return (
    <div className="page-stack">
      <div className="stats-grid">
        <StatTile label={t('Closed Manifests', { defaultValue: 'Closed Manifests' })} value={report.summary.closed_manifests} />
        <StatTile label={t('Expected COD', { defaultValue: 'Expected COD' })} value={<MoneyDisplay value={report.summary.expected_cod_amount} />} />
        <StatTile label={t('Actual Received', { defaultValue: 'Actual Received' })} value={<MoneyDisplay value={report.summary.actual_received_amount} />} />
        <StatTile label={t('Difference', { defaultValue: 'Difference' })} value={<MoneyDisplay value={report.summary.difference_amount} />} />
      </div>

      {report.items.length ? (
        <TableContainer>
          <Table variant="compact">
            <thead>
              <tr>
                <TableHead>{t('Manifest', { defaultValue: 'Manifest' })}</TableHead>
                <TableHead>{t('Date', { defaultValue: 'Date' })}</TableHead>
                <TableHead>{t('Driver', { defaultValue: 'Driver' })}</TableHead>
                <TableHead>{t('Total Shipments', { defaultValue: 'Total Shipments' })}</TableHead>
                <TableHead>{t('Expected COD', { defaultValue: 'Expected COD' })}</TableHead>
                <TableHead>{t('Actual Received', { defaultValue: 'Actual Received' })}</TableHead>
                <TableHead>{t('Difference', { defaultValue: 'Difference' })}</TableHead>
              </tr>
            </thead>
            <tbody>
              {report.items.map((item) => (
                <tr key={item.manifest_id}>
                  <TableCell>{item.manifest_number}</TableCell>
                  <TableCell>{formatDate(item.manifest_date)}</TableCell>
                  <TableCell>{item.driver_name}</TableCell>
                  <TableCell>{item.total_shipments}</TableCell>
                  <TableCell><MoneyDisplay value={item.expected_cod_amount} /></TableCell>
                  <TableCell><MoneyDisplay value={item.actual_received_amount} /></TableCell>
                  <TableCell><MoneyDisplay value={item.difference_amount} /></TableCell>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableContainer>
      ) : (
        <EmptyState
          title={t('No driver discrepancies', { defaultValue: 'No driver discrepancies' })}
          description={t('No closed manifest discrepancies matched the selected filters.', {
            defaultValue: 'No closed manifest discrepancies matched the selected filters.',
          })}
        />
      )}
    </div>
  )
}

function WarehouseRevenueReportView({ report }: { report: FinanceWarehouseRevenueReport }) {
  const { t } = useTranslation()
  return (
    <div className="page-stack">
      <div className="stats-grid">
        <StatTile label={t('Total Revenue', { defaultValue: 'Total Revenue' })} value={<MoneyDisplay value={report.total_revenue} />} />
      </div>

      <div className="details-grid">
        <Card className="detail-card">
          <CardHeader>
            <CardTitle>{t('Revenue By Type', { defaultValue: 'Revenue By Type' })}</CardTitle>
          </CardHeader>
          <CardContent>
            {report.by_type.length ? (
              <TableContainer>
                <Table variant="compact">
                  <thead>
                    <tr>
                      <TableHead>{t('Transaction Type', { defaultValue: 'Transaction Type' })}</TableHead>
                      <TableHead>{t('Amount', { defaultValue: 'Amount' })}</TableHead>
                    </tr>
                  </thead>
                  <tbody>
                    {report.by_type.map((item) => (
                      <tr key={item.transaction_type}>
                        <TableCell>{pickDisplayLabel(item.transaction_type, item.transaction_type_label)}</TableCell>
                        <TableCell><MoneyDisplay value={item.amount} /></TableCell>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </TableContainer>
            ) : (
              <EmptyState
                title={t('No revenue by type', { defaultValue: 'No revenue by type' })}
                description={t('The report did not include warehouse revenue grouped by transaction type.', {
                  defaultValue: 'The report did not include warehouse revenue grouped by transaction type.',
                })}
              />
            )}
          </CardContent>
        </Card>

        <Card className="detail-card">
          <CardHeader>
            <CardTitle>{t('Revenue By Merchant', { defaultValue: 'Revenue By Merchant' })}</CardTitle>
          </CardHeader>
          <CardContent>
            {report.by_merchant.length ? (
              <TableContainer>
                <Table variant="compact">
                  <thead>
                    <tr>
                      <TableHead>{t('Merchant')}</TableHead>
                      <TableHead>{t('Amount', { defaultValue: 'Amount' })}</TableHead>
                    </tr>
                  </thead>
                  <tbody>
                    {report.by_merchant.map((item) => (
                      <tr key={item.merchant_id}>
                        <TableCell>{item.merchant_name}</TableCell>
                        <TableCell><MoneyDisplay value={item.amount} /></TableCell>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </TableContainer>
            ) : (
              <EmptyState
                title={t('No revenue by merchant', { defaultValue: 'No revenue by merchant' })}
                description={t('The report did not include warehouse revenue grouped by merchant.', {
                  defaultValue: 'The report did not include warehouse revenue grouped by merchant.',
                })}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ProfitLossReportView({ report }: { report: FinanceProfitLossReport }) {
  const { t } = useTranslation()
  return (
    <div className="stats-grid">
      <StatTile label={t('Shipping Revenue', { defaultValue: 'Shipping Revenue' })} value={<MoneyDisplay value={report.shipping_revenue} />} />
      <StatTile label={t('Warehouse Revenue', { defaultValue: 'Warehouse Revenue' })} value={<MoneyDisplay value={report.warehouse_revenue} />} />
      <StatTile label={t('Total Revenue', { defaultValue: 'Total Revenue' })} value={<MoneyDisplay value={report.total_revenue} />} />
      <StatTile label={t('Paid Expenses', { defaultValue: 'Paid Expenses' })} value={<MoneyDisplay value={report.paid_expenses} />} />
      <StatTile label={t('Net Profit', { defaultValue: 'Net Profit' })} value={<MoneyDisplay value={report.net_profit} />} />
      <StatTile label={t('Treasury Cash In', { defaultValue: 'Treasury Cash In' })} value={<MoneyDisplay value={report.treasury_cash_in} />} />
      <StatTile label={t('Treasury Cash Out', { defaultValue: 'Treasury Cash Out' })} value={<MoneyDisplay value={report.treasury_cash_out} />} />
      <StatTile label={t('Treasury Net Cash', { defaultValue: 'Treasury Net Cash' })} value={<MoneyDisplay value={report.treasury_net_cash} />} />
    </div>
  )
}

function StatTile({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Card variant="stat" className="stat-card stat-card--neutral">
      <CardHeader className="stat-card__header">
        <span className="eyebrow">{label}</span>
      </CardHeader>
      <CardContent className="stat-card__content">
        <CardTitle className="stat-card__value">{value}</CardTitle>
      </CardContent>
    </Card>
  )
}
