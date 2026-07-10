import { useEffect } from 'react'
import { Bell } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { getMerchantPortalUnreadNotificationCount } from '../api/merchantPortalNotifications.api'
import { merchantPath } from '../../../../shared/routing/paths'
import { Button } from '../../../../shared/components/ui/Button'
import { useMerchantPortalContext } from '../../context/merchantPortal.context'

export function MerchantNotificationBell() {
  const { t } = useTranslation()
  const location = useLocation()
  const queryClient = useQueryClient()
  const { hasMerchantCapability } = useMerchantPortalContext()
  
  const hasAccess = hasMerchantCapability('notifications.view')

  const unreadQuery = useQuery({
    queryKey: ['merchant-portal', 'notifications', 'unread-count'],
    queryFn: getMerchantPortalUnreadNotificationCount,
    enabled: hasAccess,
    staleTime: 60000, // 1 minute stale time
    refetchInterval: 60000, // Poll every minute
  })

  // Refetch when navigating to the notifications page to ensure the count is up-to-date
  useEffect(() => {
    if (hasAccess && location.pathname === merchantPath('/notifications')) {
      void queryClient.invalidateQueries({ queryKey: ['merchant-portal', 'notifications', 'unread-count'] })
    }
  }, [location.pathname, hasAccess, queryClient])

  if (!hasAccess) {
    return (
      <Button aria-label={t('Notifications')} className="app-topbar__icon-button" variant="icon" disabled>
        <Bell size={18} />
      </Button>
    )
  }

  const unreadCount = unreadQuery.data?.data?.count || 0

  return (
    <Button
      as={Link}
      to={merchantPath('/notifications')}
      aria-label={t('Notifications')}
      className="app-topbar__icon-button relative"
      variant="icon"
    >
      <Bell size={18} />
      {unreadCount > 0 && (
        <span className="absolute top-0 right-0 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full border-2 border-white translate-x-1/4 -translate-y-1/4">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Button>
  )
}
