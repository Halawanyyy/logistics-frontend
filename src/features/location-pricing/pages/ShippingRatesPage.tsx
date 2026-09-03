import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { Undo2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { deleteShippingRate, listShippingRates, restoreShippingRate, forceDeleteShippingRate } from '../api/location-pricing.api'
import { PageHeader } from '../../../shared/components/ui/PageHeader'
import { LoadingState } from '../../../shared/components/feedback/LoadingState'
import { ErrorState } from '../../../shared/components/feedback/ErrorState'
import { EmptyState } from '../../../shared/components/feedback/EmptyState'
import { getApiErrorMessage } from '../../../shared/api/api-error'
import { formatDate, formatMoney } from '../../../shared/utils/formatters'
import { StatusBadge } from '../../../shared/components/ui/StatusBadge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/Card'
import { Table, TableCell, TableContainer, TableHead } from '../../../shared/components/ui/Table'
import { Button } from '../../../shared/components/ui/Button'
import { Dropdown, DropdownContent, DropdownItem, DropdownMenu, DropdownTrigger } from '../../../shared/components/ui/Dropdown'
import { Can } from '../../../shared/auth/Can'
import { PERMISSIONS } from '../../../shared/auth/permission-keys'
import { GovernorateAreaSelector } from '../../../shared/components/selectors/GovernorateAreaSelector'

export function ShippingRatesPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [governorateId, setGovernorateId] = useState('')
  const [areaId, setAreaId] = useState('')
  const [undoToast, setUndoToast] = useState<{ id: string | number; timeoutId: ReturnType<typeof setTimeout> } | null>(null)
  const [timeLeft, setTimeLeft] = useState(5)
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: ['shipping-rates'],
    queryFn: listShippingRates,
  })

  const forceDeleteMutation = useMutation({
    mutationFn: forceDeleteShippingRate,
    onSuccess: () => {
      setUndoToast(null)
    },
  })

  const restoreMutation = useMutation({
    mutationFn: restoreShippingRate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping-rates'] })
      setUndoToast(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteShippingRate,
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['shipping-rates'] })
      
      if (undoToast) {
        clearTimeout(undoToast.timeoutId)
        forceDeleteMutation.mutate(undoToast.id)
      }

      setTimeLeft(5)
      const timeoutId = setTimeout(() => {
        forceDeleteMutation.mutate(deletedId)
      }, 5000)

      setUndoToast({ id: deletedId, timeoutId })
    },
  })

  useEffect(() => {
    if (!undoToast) return
    const interval = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [undoToast])

  if (query.isLoading) {
    return <LoadingState />
  }

  if (query.isError) {
    return <ErrorState message={getApiErrorMessage(query.error)} onRetry={() => void query.refetch()} />
  }

  if (!query.data) {
    return (
      <ErrorState
        message={t('Shipping rates response is empty.', { defaultValue: 'Shipping rates response is empty.' })}
        onRetry={() => void query.refetch()}
      />
    )
  }

  if (!query.data.data.length) {
    return (
      <section className="page-section">
        <PageHeader title={t('Shipping Rates')} description={t('Location pricing returned by the API.', { defaultValue: 'Location pricing returned by the API.' })} actions={<div className="page-header__button-row"><Link className="ui-link-reset" to="/admin/shipping-rates/calculator"><Button variant="secondary">{t('Calculator', { defaultValue: 'Calculator' })}</Button></Link><Can permission={PERMISSIONS.SHIPPING_RATES_CREATE}><Link className="ui-link-reset" to="/admin/shipping-rates/create"><Button>{t('Create Rate', { defaultValue: 'Create Rate' })}</Button></Link></Can></div>} />
        <EmptyState title={t('No shipping rates found', { defaultValue: 'No shipping rates found' })} description={t('The API returned an empty shipping rates list.', { defaultValue: 'The API returned an empty shipping rates list.' })} />
      </section>
    )
  }

  const shippingRates = query.data.data.filter((rate) => {
    const matchesGovernorate = !governorateId || String(rate.governorate_id) === governorateId
    const matchesArea = !areaId || String(rate.area_id) === areaId
    return matchesGovernorate && matchesArea
  })

  return (
    <section className="page-section">
      <PageHeader
        title={t('Shipping Rates')}
        description={t('Governorate-level and area-level shipping fees from `/api/shipping-rates`.', { defaultValue: 'Governorate-level and area-level shipping fees from `/api/shipping-rates`.' })}
        actions={<div className="page-header__button-row"><Link className="ui-link-reset" to="/admin/shipping-rates/calculator"><Button variant="secondary">{t('Calculator', { defaultValue: 'Calculator' })}</Button></Link><Can permission={PERMISSIONS.SHIPPING_RATES_CREATE}><Link className="ui-link-reset" to="/admin/shipping-rates/create"><Button>{t('Create Rate', { defaultValue: 'Create Rate' })}</Button></Link></Can></div>}
      />
      <Card className="table-card">
        <CardHeader className="table-card__header">
          <CardTitle>{t('Shipping Rate Matrix', { defaultValue: 'Shipping Rate Matrix' })}</CardTitle>
          <CardDescription>{t('Real pricing rows for governorate-wide and area-specific fees.', { defaultValue: 'Real pricing rows for governorate-wide and area-specific fees.' })}</CardDescription>
        </CardHeader>
        <CardContent>
          {deleteMutation.error ? <div className="form-error">{getApiErrorMessage(deleteMutation.error)}</div> : null}
          <div className="filters-bar filters-bar--spaced">
            <GovernorateAreaSelector
              governorateId={governorateId}
              areaId={areaId}
              onChange={({ governorate_id, area_id }) => {
                setGovernorateId(governorate_id)
                setAreaId(area_id)
              }}
              includeAllOption
            />
          </div>
        <TableContainer>
        <Table variant="compact">
          <thead>
            <tr>
              <TableHead>{t('Governorate')}</TableHead>
              <TableHead>{t('Area')}</TableHead>
              <TableHead>{t('Delivery Fee')}</TableHead>
              <TableHead>{t('Swap Fee')}</TableHead>
              <TableHead>{t('Return Fee')}</TableHead>
              <TableHead>{t('Status')}</TableHead>
              <TableHead>{t('Created At')}</TableHead>
              <TableHead>{t('Actions')}</TableHead>
            </tr>
          </thead>
          <tbody>
            {shippingRates.map((rate) => (
              <tr key={rate.id}>
                <TableCell>
                  <Link className="table-link" to={`/admin/shipping-rates/${rate.id}`}>
                    {rate.governorate_name}
                  </Link>
                </TableCell>
                <TableCell>{rate.area_name ?? t('All governorate areas', { defaultValue: 'All governorate areas' })}</TableCell>
                <TableCell>{formatMoney(rate.delivery_fee)}</TableCell>
                <TableCell>{formatMoney(rate.swap_fee)}</TableCell>
                <TableCell>{formatMoney(rate.return_fee)}</TableCell>
                <TableCell>
                  <StatusBadge value={rate.is_active} />
                </TableCell>
                <TableCell>{formatDate(rate.created_at)}</TableCell>
                <TableCell>
                  <Dropdown>
                    <DropdownMenu>
                      <DropdownTrigger>...</DropdownTrigger>
                      <DropdownContent>
                        <DropdownItem onClick={() => navigate(`/admin/shipping-rates/${rate.id}`)}>{t('View')}</DropdownItem>
                        <Can permission={PERMISSIONS.SHIPPING_RATES_UPDATE}>
                          <DropdownItem onClick={() => navigate(`/admin/shipping-rates/${rate.id}/edit`)}>{t('Edit')}</DropdownItem>
                        </Can>
                        <Can permission={PERMISSIONS.SHIPPING_RATES_DELETE}>
                          <DropdownItem destructive onClick={() => {
                            if (window.confirm(t('Delete this shipping rate?', { defaultValue: 'Delete this shipping rate?' }))) {
                              deleteMutation.mutate(rate.id)
                            }
                          }}>{t('Delete')}</DropdownItem>
                        </Can>
                      </DropdownContent>
                    </DropdownMenu>
                  </Dropdown>
                </TableCell>
              </tr>
            ))}
          </tbody>
        </Table>
        </TableContainer>
        </CardContent>
      </Card>

      {undoToast && (
        <div style={{
          position: 'fixed',
          bottom: '1.5rem',
          right: '1.5rem',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--brand)',
          padding: '0.75rem 1.25rem',
          boxShadow: 'var(--shadow-modal)',
          color: '#ffffff',
          fontWeight: 600,
          letterSpacing: '0.025em'
        }}>
          <span>{t('Shipping rate deleted.', { defaultValue: 'Shipping rate deleted.' })}</span>
          <Button 
            variant="secondary" 
            style={{ border: 'none', backgroundColor: '#ffffff', color: 'var(--brand)', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
            onClick={() => {
              clearTimeout(undoToast.timeoutId)
              restoreMutation.mutate(undoToast.id)
            }}
            disabled={restoreMutation.isPending}
          >
            <Undo2 size={16} />
            {t('Undo')} ({timeLeft}s)
          </Button>
        </div>
      )}
    </section>
  )
}
