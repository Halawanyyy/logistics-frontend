import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { listDrivers } from '../../../features/drivers/api/drivers.api'
import { SearchableSelect } from '../ui/SearchableSelect'

type DriverSelectorProps = {
  value?: string | number
  onChange: (driverId: string) => void
  disabled?: boolean
  placeholder?: string
  includeAllOption?: boolean
}

export function DriverSelector({
  value = '',
  onChange,
  disabled = false,
  placeholder = 'Select driver',
  includeAllOption = false,
}: DriverSelectorProps) {
  const { t } = useTranslation()
  const driversQuery = useQuery({
    queryKey: ['drivers', 'selector'],
    queryFn: listDrivers,
  })

  return (
    <SearchableSelect
      value={String(value)}
      disabled={disabled || driversQuery.isLoading}
      placeholder={includeAllOption ? t('All drivers') : t(placeholder, { defaultValue: placeholder })}
      searchPlaceholder={t('Search drivers...', { defaultValue: 'Search drivers...' })}
      onChange={onChange}
      options={[
        { label: includeAllOption ? t('All drivers') : t(placeholder, { defaultValue: placeholder }), value: '' },
        ...((driversQuery.data?.data ?? []).map((driver) => ({
          label: driver.name,
          value: String(driver.id),
          keywords: [driver.phone ?? '', driver.vehicle_type ?? ''],
        }))),
      ]}
    />
  )
}
