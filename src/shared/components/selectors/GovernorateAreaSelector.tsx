import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { listAreas, listGovernorates } from '../../../features/location-pricing/api/location-pricing.api'
import { SearchableSelect } from '../ui/SearchableSelect'

type GovernorateAreaSelectorProps = {
  governorateId?: string
  areaId?: string
  onChange: (value: { governorate_id: string; area_id: string }) => void
  disabled?: boolean
  governorateLabel?: string
  areaLabel?: string
  includeAllOption?: boolean
}

export function GovernorateAreaSelector({
  governorateId = '',
  areaId = '',
  onChange,
  disabled = false,
  governorateLabel = 'Delivery Governorate',
  areaLabel = 'Delivery Area',
  includeAllOption = false,
}: GovernorateAreaSelectorProps) {
  const { t } = useTranslation()
  const governoratesQuery = useQuery({
    queryKey: ['governorates', 'selector'],
    queryFn: listGovernorates,
  })
  const areasQuery = useQuery({
    queryKey: ['areas', 'selector', governorateId],
    queryFn: () => listAreas(governorateId ? { governorate_id: governorateId } : undefined),
    enabled: true,
  })

  useEffect(() => {
    if (!governorateId && areaId) {
      onChange({ governorate_id: '', area_id: '' })
    }
  }, [areaId, governorateId, onChange])

  return (
    <>
      <label className="field">
        <span>{t(governorateLabel, { defaultValue: governorateLabel })}</span>
        <SearchableSelect
          value={governorateId}
          disabled={disabled || governoratesQuery.isLoading}
          placeholder={includeAllOption ? t('All governorates') : t('Select governorate')}
          searchPlaceholder={t('Search governorates...', { defaultValue: 'Search governorates...' })}
          onChange={(value) => onChange({ governorate_id: value, area_id: '' })}
          options={[
            {
              label: includeAllOption ? t('All governorates') : t('Select governorate'),
              value: '',
            },
            ...((governoratesQuery.data?.data ?? []).map((governorate) => ({
              label: governorate.name,
              value: String(governorate.id),
            }))),
          ]}
        />
      </label>
      <label className="field">
        <span>{t(areaLabel, { defaultValue: areaLabel })}</span>
        <SearchableSelect
          value={areaId}
          disabled={disabled || !governorateId || areasQuery.isLoading}
          placeholder={includeAllOption ? t('All areas') : t('Select area')}
          searchPlaceholder={t('Search areas...', { defaultValue: 'Search areas...' })}
          onChange={(value) => onChange({ governorate_id: governorateId, area_id: value })}
          options={[
            {
              label: includeAllOption ? t('All areas') : t('Select area'),
              value: '',
            },
            ...((areasQuery.data?.data ?? []).map((area) => ({
              label: area.name,
              value: String(area.id),
            }))),
          ]}
        />
      </label>
    </>
  )
}
