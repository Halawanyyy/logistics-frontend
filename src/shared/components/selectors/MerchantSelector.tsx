import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { listMerchants } from '../../../features/merchants/api/merchants.api'
import { SearchableSelect } from '../ui/SearchableSelect'

type MerchantSelectorProps = {
  value?: string | number
  onChange: (merchantId: string) => void
  disabled?: boolean
  placeholder?: string
  includeAllOption?: boolean
}

export function MerchantSelector({
  value = '',
  onChange,
  disabled = false,
  placeholder = 'Select merchant',
  includeAllOption = false,
}: MerchantSelectorProps) {
  const { t } = useTranslation()
  const merchantsQuery = useQuery({
    queryKey: ['merchants', 'selector'],
    queryFn: listMerchants,
  })

  return (
    <SearchableSelect
      value={String(value)}
      disabled={disabled || merchantsQuery.isLoading}
      placeholder={includeAllOption ? t('All merchants') : t(placeholder, { defaultValue: placeholder })}
      searchPlaceholder={t('Search merchants...', { defaultValue: 'Search merchants...' })}
      onChange={onChange}
      options={[
        { label: includeAllOption ? t('All merchants') : t(placeholder, { defaultValue: placeholder }), value: '' },
        ...((merchantsQuery.data?.data ?? []).map((merchant) => ({
          label: merchant.name,
          value: String(merchant.id),
          keywords: [merchant.company_name ?? '', merchant.phone ?? ''],
        }))),
      ]}
    />
  )
}
