import { zodResolver } from '@hookform/resolvers/zod'
import type { ReactNode } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { getApiErrorMessage } from '../../../shared/api/api-error'
import { SearchableSelect } from '../../../shared/components/ui/SearchableSelect'
import { Button } from '../../../shared/components/ui/Button'
import { Input } from '../../../shared/components/ui/Input'
import { Select } from '../../../shared/components/ui/Select'
import type { Driver } from '../../drivers/types/driver.types'
import type { Merchant } from '../../merchants/types/merchant.types'
import type {
  DriverCashClosure,
  Expense,
  GenerateDriverCashClosureRequest,
  MerchantInvoice,
  MerchantPayout,
} from '../types/finance.types'

export const payoutSchema = z.object({
  merchant_id: z.number().min(1, 'Merchant is required.'),
  amount: z.number().min(0, 'Amount must be zero or more.'),
  status: z.string().min(1),
  payment_method: z.string().min(1),
  reference_number: z.string().optional(),
  notes: z.string().optional(),
})

export const cashClosureSchema = z.object({
  driver_id: z.number().min(1, 'Driver is required.'),
  expected_amount: z.number().min(0),
  received_amount: z.number().min(0),
  status: z.string().min(1),
  notes: z.string().optional(),
})

export const generateCashClosureSchema = z.object({
  driver_id: z.number().min(1, 'Driver is required.'),
  date: z.string().min(1, 'Date is required.'),
  received_amount: z.number().min(0),
  status: z.string().min(1),
  notes: z.string().optional(),
})

export const expenseSchema = z.object({
  category: z.string().min(1),
  amount: z.number().min(0),
  expense_date: z.string().min(1),
  payment_method: z.string().min(1),
  reference_number: z.string().optional(),
  notes: z.string().optional(),
})

export const invoiceSchema = z.object({
  merchant_id: z.number().min(1, 'Merchant is required.'),
  period_start: z.string().min(1),
  period_end: z.string().min(1),
  status: z.string().min(1),
  notes: z.string().optional(),
})

export type PayoutFormValues = z.infer<typeof payoutSchema>
export type CashClosureFormValues = z.infer<typeof cashClosureSchema>
export type GenerateCashClosureFormValues = z.infer<typeof generateCashClosureSchema>
export type ExpenseFormValues = z.infer<typeof expenseSchema>
export type InvoiceFormValues = z.infer<typeof invoiceSchema>

type CommonProps<T> = {
  defaultValues?: T
  error?: unknown
  isSubmitting?: boolean
  submitLabel: string
  onSubmit: (values: any) => void
}

export function MerchantPayoutForm({
  defaultValues,
  error,
  isSubmitting,
  merchants,
  onSubmit,
  submitLabel,
}: CommonProps<MerchantPayout> & { merchants: Merchant[] }) {
  const form = useForm<PayoutFormValues>({
    resolver: zodResolver(payoutSchema),
    defaultValues: {
      merchant_id: defaultValues?.merchant_id ?? 0,
      amount: Number(defaultValues?.amount ?? 0),
      status: defaultValues?.status ?? 'pending',
      payment_method: defaultValues?.payment_method ?? 'cash',
      reference_number: defaultValues?.reference_number ?? '',
      notes: defaultValues?.notes ?? '',
    },
  })

  return (
    <form className="form-grid" onSubmit={form.handleSubmit((values) => onSubmit(clean(values)))}>
      <Controller
        name="merchant_id"
        control={form.control}
        render={({ field }) => (
          <SearchField
            label="Merchant"
            value={field.value}
            placeholder="Select merchant"
            searchPlaceholder="Search merchants..."
            options={[
              { label: 'Select merchant', value: '' },
              ...merchants.map((merchant) => ({
                label: merchant.name,
                value: String(merchant.id),
                keywords: [merchant.company_name ?? '', merchant.email ?? '', String(merchant.id)],
              })),
            ]}
            onChange={(value) => field.onChange(value ? Number(value) : 0)}
          />
        )}
      />
      <Field label="Amount">
        <Input type="number" step="0.01" {...form.register('amount', { valueAsNumber: true })} />
      </Field>
      <Field label="Status">
        <Select {...form.register('status')}>
          <option value="pending">pending</option>
          <option value="completed">completed</option>
          <option value="cancelled">cancelled</option>
        </Select>
      </Field>
      <Field label="Payment Method">
        <Select {...form.register('payment_method')}>
          <option value="cash">cash</option>
          <option value="bank_transfer">bank_transfer</option>
          <option value="wallet">wallet</option>
        </Select>
      </Field>
      <Field label="Reference">
        <Input {...form.register('reference_number')} />
      </Field>
      <Field label="Notes">
        <Input {...form.register('notes')} />
      </Field>
      <Submit error={error} isSubmitting={isSubmitting} label={submitLabel} />
    </form>
  )
}

export function DriverCashClosureForm({
  defaultValues,
  drivers,
  error,
  isSubmitting,
  onSubmit,
  submitLabel,
}: CommonProps<DriverCashClosure> & { drivers: Driver[] }) {
  const form = useForm<CashClosureFormValues>({
    resolver: zodResolver(cashClosureSchema),
    defaultValues: {
      driver_id: defaultValues?.driver_id ?? 0,
      expected_amount: Number(defaultValues?.expected_amount ?? 0),
      received_amount: Number(defaultValues?.received_amount ?? 0),
      status: defaultValues?.status ?? 'pending',
      notes: defaultValues?.notes ?? '',
    },
  })

  return (
    <form className="form-grid" onSubmit={form.handleSubmit((values) => onSubmit(clean(values)))}>
      <Controller
        name="driver_id"
        control={form.control}
        render={({ field }) => (
          <SearchField
            label="Driver"
            value={field.value}
            placeholder="Select driver"
            searchPlaceholder="Search drivers..."
            options={[
              { label: 'Select driver', value: '' },
              ...drivers.map((driver) => ({
                label: driver.name,
                value: String(driver.id),
                keywords: [driver.phone ?? '', driver.vehicle_plate ?? '', String(driver.id)],
              })),
            ]}
            onChange={(value) => field.onChange(value ? Number(value) : 0)}
          />
        )}
      />
      <Field label="Expected Amount">
        <Input type="number" step="0.01" {...form.register('expected_amount', { valueAsNumber: true })} readOnly />
      </Field>
      <Field label="Received Amount">
        <Input type="number" step="0.01" {...form.register('received_amount', { valueAsNumber: true })} />
      </Field>
      <Field label="Status">
        <Select {...form.register('status')}>
          <option value="pending">pending</option>
          <option value="verified">verified</option>
          <option value="disputed">disputed</option>
        </Select>
      </Field>
      <Field label="Notes">
        <Input {...form.register('notes')} />
      </Field>
      <Submit error={error} isSubmitting={isSubmitting} label={submitLabel} />
    </form>
  )
}

export function GenerateDriverCashClosureForm({
  drivers,
  error,
  expectedAmount,
  isSubmitting,
  onDriverChange,
  onSubmit,
  submitLabel,
}: {
  drivers: Driver[]
  error?: unknown
  expectedAmount?: number
  isSubmitting?: boolean
  submitLabel: string
  onSubmit: (driverId: number, values: GenerateDriverCashClosureRequest) => void
  onDriverChange?: (driverId: number) => void
}) {
  const form = useForm<GenerateCashClosureFormValues>({
    resolver: zodResolver(generateCashClosureSchema),
    defaultValues: {
      driver_id: 0,
      date: '',
      received_amount: 0,
      status: 'pending',
      notes: '',
    },
  })
  const receivedAmount = useWatch({ control: form.control, name: 'received_amount' }) ?? 0
  const expected = Number(expectedAmount ?? 0)
  const difference = Number(receivedAmount) - expected

  return (
    <form
      className="form-grid"
      onSubmit={form.handleSubmit((values) => {
        const cleaned = clean(values)
        onSubmit(values.driver_id, {
          date: cleaned.date,
          received_amount: cleaned.received_amount,
          status: cleaned.status,
          notes: cleaned.notes,
        })
      })}
    >
      <Controller
        name="driver_id"
        control={form.control}
        render={({ field }) => (
          <SearchField
            label="Driver"
            value={field.value}
            placeholder="Select driver"
            searchPlaceholder="Search drivers..."
            options={[
              { label: 'Select driver', value: '' },
              ...drivers.map((driver) => ({
                label: driver.name,
                value: String(driver.id),
                keywords: [driver.phone ?? '', driver.vehicle_plate ?? '', String(driver.id)],
              })),
            ]}
            onChange={(value) => {
              const driverId = value ? Number(value) : 0
              field.onChange(driverId)
              onDriverChange?.(driverId)
            }}
          />
        )}
      />
      <Field label="Closure Date">
        <Input type="date" {...form.register('date')} />
      </Field>
      <Field label="Expected Amount">
        <Input value={expected.toFixed(2)} readOnly />
      </Field>
      <Field label="Received Amount">
        <Input type="number" step="0.01" {...form.register('received_amount', { valueAsNumber: true })} />
      </Field>
      <Field label="Difference">
        <Input value={difference.toFixed(2)} readOnly />
      </Field>
      <Field label="Status">
        <Select {...form.register('status')}>
          <option value="pending">pending</option>
          <option value="verified">verified</option>
          <option value="disputed">disputed</option>
        </Select>
      </Field>
      <Field label="Notes">
        <Input {...form.register('notes')} />
      </Field>
      <Submit error={error} isSubmitting={isSubmitting} label={submitLabel} />
    </form>
  )
}

export function ExpenseForm({ defaultValues, error, isSubmitting, onSubmit, submitLabel }: CommonProps<Expense>) {
  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      category: defaultValues?.category ?? 'fuel',
      amount: Number(defaultValues?.amount ?? 0),
      expense_date: defaultValues?.expense_date ?? '',
      payment_method: defaultValues?.payment_method ?? 'cash',
      reference_number: defaultValues?.reference_number ?? '',
      notes: defaultValues?.notes ?? '',
    },
  })

  return (
    <form className="form-grid" onSubmit={form.handleSubmit((values) => onSubmit(clean(values)))}>
      <Field label="Category">
        <Input {...form.register('category')} />
      </Field>
      <Field label="Amount">
        <Input type="number" step="0.01" {...form.register('amount', { valueAsNumber: true })} />
      </Field>
      <Field label="Expense Date">
        <Input type="date" {...form.register('expense_date')} />
      </Field>
      <Field label="Payment Method">
        <Select {...form.register('payment_method')}>
          <option value="cash">cash</option>
          <option value="bank_transfer">bank_transfer</option>
          <option value="wallet">wallet</option>
        </Select>
      </Field>
      <Field label="Reference">
        <Input {...form.register('reference_number')} />
      </Field>
      <Field label="Notes">
        <Input {...form.register('notes')} />
      </Field>
      <Submit error={error} isSubmitting={isSubmitting} label={submitLabel} />
    </form>
  )
}

export function MerchantInvoiceForm({
  defaultValues,
  error,
  isSubmitting,
  merchants,
  onSubmit,
  submitLabel,
}: CommonProps<MerchantInvoice> & { merchants: Merchant[] }) {
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      merchant_id: defaultValues?.merchant_id ?? 0,
      period_start: defaultValues?.period_start ?? '',
      period_end: defaultValues?.period_end ?? '',
      status: defaultValues?.status ?? 'draft',
      notes: defaultValues?.notes ?? '',
    },
  })

  return (
    <form className="form-grid" onSubmit={form.handleSubmit((values) => onSubmit(clean(values)))}>
      <Controller
        name="merchant_id"
        control={form.control}
        render={({ field }) => (
          <SearchField
            label="Merchant"
            value={field.value}
            placeholder="Select merchant"
            searchPlaceholder="Search merchants..."
            options={[
              { label: 'Select merchant', value: '' },
              ...merchants.map((merchant) => ({
                label: merchant.name,
                value: String(merchant.id),
                keywords: [merchant.company_name ?? '', merchant.email ?? '', String(merchant.id)],
              })),
            ]}
            onChange={(value) => field.onChange(value ? Number(value) : 0)}
          />
        )}
      />
      <Field label="Period Start">
        <Input type="date" {...form.register('period_start')} />
      </Field>
      <Field label="Period End">
        <Input type="date" {...form.register('period_end')} />
      </Field>
      <Field label="Status">
        <Select {...form.register('status')}>
          <option value="draft">draft</option>
          <option value="issued">issued</option>
          <option value="paid">paid</option>
          <option value="cancelled">cancelled</option>
        </Select>
      </Field>
      <Field label="Notes">
        <Input {...form.register('notes')} />
      </Field>
      <Submit error={error} isSubmitting={isSubmitting} label={submitLabel} />
    </form>
  )
}

function SearchField({
  label,
  onChange,
  options,
  placeholder,
  searchPlaceholder,
  value,
}: {
  label: string
  onChange: (value: string) => void
  options: Array<{ label: string; value: string; keywords?: string[] }>
  placeholder: string
  searchPlaceholder: string
  value?: number | string | null
}) {
  return (
    <Field label={label}>
      <SearchableSelect
        value={typeof value === 'number' && value > 0 ? String(value) : String(value ?? '')}
        placeholder={placeholder}
        searchPlaceholder={searchPlaceholder}
        options={options}
        onChange={onChange}
      />
    </Field>
  )
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  )
}

function Submit({ error, isSubmitting, label }: { error?: unknown; isSubmitting?: boolean; label: string }) {
  return (
    <>
      {error ? <div className="form-error">{getApiErrorMessage(error)}</div> : null}
      <div className="form-actions">
        <Button type="submit" loading={isSubmitting}>
          {label}
        </Button>
      </div>
    </>
  )
}

function clean<T extends Record<string, unknown>>(values: T) {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key, value === '' ? undefined : value]),
  ) as T
}
