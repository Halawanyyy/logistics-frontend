import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { generateDriverCashClosure, getDriverCashExpected, listDrivers } from '../../drivers/api/drivers.api'
import { listMerchants } from '../../merchants/api/merchants.api'
import { getApiErrorMessage } from '../../../shared/api/api-error'
import { ErrorState } from '../../../shared/components/feedback/ErrorState'
import { LoadingState } from '../../../shared/components/feedback/LoadingState'
import { Button } from '../../../shared/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../shared/components/ui/Card'
import { PageHeader } from '../../../shared/components/ui/PageHeader'
import {
  createDriverCashClosure,
  createExpense,
  createMerchantInvoice,
  createMerchantPayout,
  getDriverCashClosure,
  getExpense,
  getMerchantInvoice,
  getMerchantPayout,
  updateDriverCashClosure,
  updateExpense,
  updateMerchantInvoice,
  updateMerchantPayout,
} from '../api/finance.api'
import {
  DriverCashClosureForm,
  ExpenseForm,
  GenerateDriverCashClosureForm,
  MerchantInvoiceForm,
  MerchantPayoutForm,
} from '../components/FinanceForms'
import { adminPath } from '../../../shared/routing/paths'

type FinanceKind = 'payouts' | 'cash-closures' | 'expenses' | 'invoices'

const config = {
  payouts: {
    title: 'Merchant Payout',
    back: adminPath('/finance/merchant-payouts'),
    queryKey: 'merchant-payouts',
    get: getMerchantPayout,
    create: createMerchantPayout,
    update: updateMerchantPayout,
  },
  'cash-closures': {
    title: 'Driver Cash Closure',
    back: adminPath('/finance/driver-cash-closures'),
    queryKey: 'driver-cash-closures',
    get: getDriverCashClosure,
    create: createDriverCashClosure,
    update: updateDriverCashClosure,
  },
  expenses: {
    title: 'Expense',
    back: adminPath('/finance/expenses'),
    queryKey: 'expenses',
    get: getExpense,
    create: createExpense,
    update: updateExpense,
  },
  invoices: {
    title: 'Merchant Invoice',
    back: adminPath('/finance/merchant-invoices'),
    queryKey: 'merchant-invoices',
    get: getMerchantInvoice,
    create: createMerchantInvoice,
    update: updateMerchantInvoice,
  },
} as const

export function FinanceRecordFormPage({ kind, mode }: { kind: FinanceKind; mode: 'create' | 'edit' }) {
  const { recordId } = useParams()
  const entry = config[kind]
  const isEdit = mode === 'edit'
  const [selectedDriverId, setSelectedDriverId] = useState<number>(0)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const recordQuery = useQuery<any>({
    queryKey: [entry.queryKey, recordId],
    queryFn: () => entry.get(recordId!) as Promise<any>,
    enabled: isEdit && Boolean(recordId),
  })
  const merchantsQuery = useQuery({ queryKey: ['merchants'], queryFn: listMerchants, enabled: kind === 'payouts' || kind === 'invoices' })
  const driversQuery = useQuery({ queryKey: ['drivers'], queryFn: listDrivers, enabled: kind === 'cash-closures' })
  const expectedQuery = useQuery({
    queryKey: ['drivers', selectedDriverId, 'cash-expected'],
    queryFn: () => getDriverCashExpected(selectedDriverId),
    enabled: kind === 'cash-closures' && !isEdit && selectedDriverId > 0,
  })
  const mutation = useMutation({
    mutationFn: (values: any) => isEdit ? entry.update(recordId!, values) as Promise<any> : entry.create(values) as Promise<any>,
    onSuccess: async (response: any) => {
      await queryClient.invalidateQueries({ queryKey: [entry.queryKey] })
      navigate(isEdit ? `${entry.back}/${recordId}` : `${entry.back}/${response.data.id}`)
    },
  })
  const generateMutation = useMutation({
    mutationFn: ({ driverId, values }: { driverId: number; values: any }) =>
      generateDriverCashClosure(driverId, values),
    onSuccess: async (response: any) => {
      await queryClient.invalidateQueries({ queryKey: [entry.queryKey] })
      navigate(`${entry.back}/${response.data.id}`)
    },
  })

  const loading = recordQuery.isLoading || merchantsQuery.isLoading || driversQuery.isLoading
  const error = recordQuery.error ?? merchantsQuery.error ?? driversQuery.error ?? expectedQuery.error

  if (loading) return <LoadingState title={`Loading ${entry.title.toLowerCase()}`} />
  if (error) return <ErrorState message={getApiErrorMessage(error)} />

  const common = {
    defaultValues: recordQuery.data?.data as any,
    error: mutation.error,
    isSubmitting: mutation.isPending,
    submitLabel: isEdit ? `Save ${entry.title}` : `Create ${entry.title}`,
    onSubmit: (values: any) => mutation.mutate(values),
  }

  return (
    <section className="page-section">
      <PageHeader
        title={isEdit ? `Edit ${entry.title}` : `Create ${entry.title}`}
        description="Submit data to the documented finance API."
        actions={<Link className="ui-link-reset" to={entry.back}><Button variant="secondary">Back</Button></Link>}
      />
      <Card>
        <CardHeader><CardTitle>{entry.title} Details</CardTitle></CardHeader>
        <CardContent>
          {kind === 'payouts' ? <MerchantPayoutForm {...common} merchants={merchantsQuery.data?.data ?? []} /> : null}
          {kind === 'cash-closures' && isEdit ? <DriverCashClosureForm {...common} drivers={driversQuery.data?.data ?? []} /> : null}
          {kind === 'cash-closures' && !isEdit ? (
            <GenerateDriverCashClosureForm
              drivers={driversQuery.data?.data ?? []}
              error={generateMutation.error}
              expectedAmount={Number(expectedQuery.data?.data.expected_amount ?? 0)}
              isSubmitting={generateMutation.isPending}
              onDriverChange={setSelectedDriverId}
              onSubmit={(driverId, values) => generateMutation.mutate({ driverId, values })}
              submitLabel="Generate Driver Cash Closure"
            />
          ) : null}
          {kind === 'expenses' ? <ExpenseForm {...common} /> : null}
          {kind === 'invoices' ? <MerchantInvoiceForm {...common} merchants={merchantsQuery.data?.data ?? []} /> : null}
        </CardContent>
      </Card>
    </section>
  )
}
