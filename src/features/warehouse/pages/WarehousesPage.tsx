import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { deleteWarehouse, listWarehouses } from '../api/warehouse.api'
import type { Warehouse } from '../types/warehouse.types'
import { ResourceListPage } from '../../../shared/components/data/ResourceListPage'
import { ConfirmActionModal } from '../../../shared/components/modals/ConfirmActionModal'
import { StatusBadge } from '../../../shared/components/ui/StatusBadge'
import { formatDate } from '../../../shared/utils/formatters'
import { Button } from '../../../shared/components/ui/Button'
import { Can } from '../../../shared/auth/Can'
import { PERMISSIONS } from '../../../shared/auth/permission-keys'
import { adminPath } from '../../../shared/routing/paths'
import { getApiErrorMessage } from '../../../shared/api/api-error'

export function WarehousesPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [warehousePendingDelete, setWarehousePendingDelete] = useState<Warehouse | null>(null)
  const [successMessage, setSuccessMessage] = useState('')
  const deleteMutation = useMutation({
    mutationFn: (warehouseId: number) => deleteWarehouse(warehouseId),
    onSuccess: async () => {
      setSuccessMessage(t('Warehouse deleted successfully.', { defaultValue: 'Warehouse deleted successfully.' }))
      setWarehousePendingDelete(null)
      await queryClient.invalidateQueries({ queryKey: ['warehouses'] })
    },
  })

  return (
    <>
      <ResourceListPage<Warehouse>
        title={t('Warehouses', { defaultValue: 'Warehouses' })}
        description={t('Warehouse locations configured for inventory operations.', { defaultValue: 'Warehouse locations configured for inventory operations.' })}
        actions={(
          <Can permission={PERMISSIONS.WAREHOUSE_CREATE}>
            <Link className="ui-link-reset" to={adminPath('/warehouses/create')}>
              <Button>{t('Create Warehouse', { defaultValue: 'Create Warehouse' })}</Button>
            </Link>
          </Can>
        )}
        queryKey={['warehouses']}
        queryFn={listWarehouses}
        getSearchText={(warehouse) =>
          [warehouse.name, warehouse.code, warehouse.address, warehouse.status].join(' ')
        }
        columns={[
          {
            header: 'Warehouse',
            render: (warehouse) => (
              <Link className="table-link" to={adminPath(`/warehouses/${warehouse.id}`)}>
                {warehouse.name}
              </Link>
            ),
          },
          { header: 'Code', render: (warehouse) => warehouse.code },
          { header: 'Location', render: (warehouse) => `${warehouse.governorate_name} / ${warehouse.area_name ?? '-'}` },
          { header: 'Status', render: (warehouse) => <StatusBadge value={warehouse.status} /> },
          { header: 'Created', render: (warehouse) => formatDate(warehouse.created_at) },
          {
            header: 'Actions',
            render: (warehouse) => (
              <div className="page-header__button-row">
                <Can permission={PERMISSIONS.WAREHOUSE_VIEW}>
                  <Link className="table-link" to={adminPath(`/warehouses/${warehouse.id}`)}>
                    {t('View')}
                  </Link>
                </Can>
                <Can permission={PERMISSIONS.WAREHOUSE_UPDATE}>
                  <Link className="table-link" to={adminPath(`/warehouses/${warehouse.id}/edit`)}>
                    {t('Edit')}
                  </Link>
                </Can>
                <Can permission={PERMISSIONS.WAREHOUSE_DELETE}>
                  <Button type="button" variant="danger" onClick={() => setWarehousePendingDelete(warehouse)}>
                    {t('Delete')}
                  </Button>
                </Can>
              </div>
            ),
          },
        ]}
      />
      {successMessage ? <div className="form-success">{successMessage}</div> : null}
      {deleteMutation.error ? <div className="form-error">{getApiErrorMessage(deleteMutation.error)}</div> : null}
      <ConfirmActionModal
        open={Boolean(warehousePendingDelete)}
        title={t('Delete warehouse', { defaultValue: 'Delete warehouse' })}
        description={warehousePendingDelete ? t('Delete warehouse {{name}}?', {
          name: warehousePendingDelete.name,
          defaultValue: `Delete warehouse ${warehousePendingDelete.name}?`,
        }) : ''}
        confirmLabel={t('Delete warehouse', { defaultValue: 'Delete warehouse' })}
        variant="danger"
        loading={deleteMutation.isPending}
        onCancel={() => setWarehousePendingDelete(null)}
        onConfirm={() => {
          if (warehousePendingDelete) {
            deleteMutation.mutate(warehousePendingDelete.id)
          }
        }}
      />
    </>
  )
}
