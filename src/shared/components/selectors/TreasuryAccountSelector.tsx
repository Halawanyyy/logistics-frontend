import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { listTreasuryAccounts } from '../../../features/finance/api/finance.api'
import { SearchableSelect } from '../ui/SearchableSelect'

type TreasuryAccountSelectorProps = {
  value?: string | number
  onChange: (treasuryAccountId: string) => void
  disabled?: boolean
  placeholder?: string
  includeAllOption?: boolean
}

export function TreasuryAccountSelector({
  value = '',
  onChange,
  disabled = false,
  placeholder = 'Select treasury account',
  includeAllOption = false,
}: TreasuryAccountSelectorProps) {
  const { t } = useTranslation()
  const treasuryAccountsQuery = useQuery({
    queryKey: ['treasury-accounts', 'selector'],
    queryFn: listTreasuryAccounts,
  })

  return (
    <SearchableSelect
      value={String(value)}
      disabled={disabled || treasuryAccountsQuery.isLoading}
      placeholder={includeAllOption ? t('All treasury accounts') : t(placeholder, { defaultValue: placeholder })}
      searchPlaceholder={t('Search treasury accounts...', { defaultValue: 'Search treasury accounts...' })}
      onChange={onChange}
      options={[
        { label: includeAllOption ? t('All treasury accounts') : t(placeholder, { defaultValue: placeholder }), value: '' },
        ...((treasuryAccountsQuery.data?.data ?? []).map((account) => ({
          label: account.name,
          value: String(account.id),
          keywords: [account.code ?? '', account.type ?? ''],
        }))),
      ]}
    />
  )
}
