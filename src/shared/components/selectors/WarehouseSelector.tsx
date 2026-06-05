import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { listWarehouses } from '../../../features/warehouse/api/warehouse.api'
import { SearchableSelect } from '../ui/SearchableSelect'

type WarehouseSelectorProps = {
  value?: string | number
  onChange: (warehouseId: string) => void
  disabled?: boolean
  placeholder?: string
  includeAllOption?: boolean
}

export function WarehouseSelector({
  value = '',
  onChange,
  disabled = false,
  placeholder = 'Select warehouse',
  includeAllOption = false,
}: WarehouseSelectorProps) {
  const { t } = useTranslation()
  const warehousesQuery = useQuery({
    queryKey: ['warehouses', 'selector'],
    queryFn: listWarehouses,
  })

  return (
    <SearchableSelect
      value={String(value)}
      disabled={disabled || warehousesQuery.isLoading}
      placeholder={includeAllOption ? t('All warehouses') : t(placeholder, { defaultValue: placeholder })}
      searchPlaceholder={t('Search warehouses...', { defaultValue: 'Search warehouses...' })}
      onChange={onChange}
      options={[
        { label: includeAllOption ? t('All warehouses') : t(placeholder, { defaultValue: placeholder }), value: '' },
        ...((warehousesQuery.data?.data ?? []).map((warehouse) => ({
          label: warehouse.name,
          value: String(warehouse.id),
          keywords: [warehouse.code ?? '', warehouse.address ?? ''],
        }))),
      ]}
    />
  )
}
