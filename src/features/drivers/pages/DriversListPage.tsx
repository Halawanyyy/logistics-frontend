import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Edit2, Trash2 } from 'lucide-react'
import { deleteDriver, listDrivers } from '../api/drivers.api'
import type { Driver } from '../types/driver.types'
import { ResourceListPage } from '../../../shared/components/data/ResourceListPage'
import { StatusBadge } from '../../../shared/components/ui/StatusBadge'
import { pickDisplayLabel } from '../../../shared/i18n/locale'
import { formatDate } from '../../../shared/utils/formatters'
import { Button } from '../../../shared/components/ui/Button'
import { Can } from '../../../shared/auth/Can'
import { PERMISSIONS } from '../../../shared/auth/permission-keys'
import { adminPath } from '../../../shared/routing/paths'

export function DriversListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const deleteMutation = useMutation({
    mutationFn: deleteDriver,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['drivers'] }),
  })

  function handleDelete(driver: Driver) {
    if (window.confirm(t('Delete {{name}}?', { name: driver.name, defaultValue: `Delete ${driver.name}?` }))) {
      deleteMutation.mutate(driver.id)
    }
  }

  return (
    <ResourceListPage<Driver>
      title={t('Drivers', { defaultValue: 'Drivers' })}
      description={t('Operational drivers available for shipment assignment.', { defaultValue: 'Operational drivers available for shipment assignment.' })}
      actions={
        <Can permission={PERMISSIONS.DRIVERS_CREATE}>
          <Link className="ui-link-reset" to="/drivers/create">
            <Button>{t('Create Driver', { defaultValue: 'Create Driver' })}</Button>
          </Link>
        </Can>
      }
      queryKey={['drivers']}
      queryFn={listDrivers}
      searchValue={searchParams.get('search') ?? ''}
      getSearchText={(driver) =>
        [driver.name, driver.phone, driver.vehicle_type, driver.vehicle_plate].join(' ')
      }
      columns={[
        {
          header: t('Driver', { defaultValue: 'Driver' }),
          render: (driver) => (
            <Link className="table-link" to={`/drivers/${driver.id}`}>
              {driver.name}
            </Link>
          ),
        },
        { header: t('Phone'), render: (driver) => driver.phone },
        { header: t('Vehicle', { defaultValue: 'Vehicle' }), render: (driver) => `${driver.vehicle_type} ${driver.vehicle_plate}` },
        {
          header: t('Status'),
          render: (driver) => (
            <StatusBadge value={driver.status}>
              {pickDisplayLabel(driver.status, driver.status_label)}
            </StatusBadge>
          ),
        },
        { header: t('Created'), render: (driver) => formatDate(driver.created_at) },
        {
          header: t('Actions'),
          render: (driver) => (
            <div className="table-actions">
              <Can permission={PERMISSIONS.DRIVERS_UPDATE}>
                <Button
                  aria-label={t('Edit')}
                  title={t('Edit')}
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(adminPath(`/drivers/${driver.id}/edit`))}
                >
                  <Edit2 size={14} />
                </Button>
              </Can>
              <Can permission={PERMISSIONS.DRIVERS_DELETE}>
                <Button
                  aria-label={t('Delete')}
                  className="table-action-button--danger"
                  title={t('Delete')}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(driver)}
                >
                  <Trash2 size={14} />
                </Button>
              </Can>
            </div>
          ),
        },
      ]}
    />
  )
}
