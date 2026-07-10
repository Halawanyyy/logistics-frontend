import { Outlet, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { appConfig } from '../app/config'
import { logout as logoutRequest } from '../features/auth/api/auth.api'
import { useAuthStore } from '../features/auth/store/auth.store'
import { AppShell } from '../shared/components/layout/AppShell'
import { merchantPath } from '../shared/routing/paths'
import { useMerchantPortalContext } from '../features/merchant-portal/context/merchantPortal.context'

export function MerchantLayout() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const clearSession = useAuthStore((state) => state.logout)
  const { hasMerchantCapability, merchant, portalRole } = useMerchantPortalContext()

  const allItems = [
    { to: merchantPath('/dashboard'), label: 'Dashboard', capability: 'dashboard.view' },
    { to: merchantPath('/orders'), label: 'Orders', capability: 'orders.view' },
    { to: merchantPath('/shipments'), label: 'Shipments', capability: 'shipments.view' },
    { to: merchantPath('/warehouse/products'), label: 'Products', capability: 'warehouse.view' },
    { to: merchantPath('/warehouse/inventory'), label: 'Inventory Stocks', capability: 'warehouse.view' },
    { to: merchantPath('/warehouse/inventory/low-stock'), label: 'Low Stock', capability: 'warehouse.view' },
    { to: merchantPath('/warehouse/movements'), label: 'Stock Movements', capability: 'warehouse.view' },
    { to: merchantPath('/warehouse/charges'), label: 'Warehouse Charges', capability: 'warehouse.view' },
    { to: merchantPath('/warehouse/inbound-requests'), label: 'Inbound Requests', capability: 'warehouse.inbound_requests.view' },
    { to: merchantPath('/finance'), label: 'Overview', capability: 'finance.view' },
    { to: merchantPath('/finance/wallet'), label: 'Wallet Summary', capability: 'wallet.view' },
    { to: merchantPath('/finance/wallet/transactions'), label: 'Wallet Transactions', capability: 'wallet.view' },
    { to: merchantPath('/finance/invoices'), label: 'Invoices', capability: 'invoices.view' },
    { to: merchantPath('/finance/payouts'), label: 'Payouts', capability: 'payouts.view' },
    { to: merchantPath('/profile'), label: 'Profile', capability: 'profile.view' },
    { to: merchantPath('/settings'), label: 'Settings', capability: 'settings.view' },
    { to: merchantPath('/integrations'), label: 'Integrations', capability: 'integrations.view' },
    { to: merchantPath('/store'), label: 'Store', capability: 'store.view' },
    { to: merchantPath('/exports'), label: 'Exports', capability: 'exports.view' },
    { to: merchantPath('/attachments'), label: 'Attachments', capability: 'attachments.view' },
    { to: merchantPath('/notifications'), label: 'Notifications', capability: 'notifications.view' },
  ]

  const items = allItems.filter(item => hasMerchantCapability(item.capability))

  async function handleLogout() {
    try {
      await logoutRequest()
    } catch {
      // The local session still needs to be cleared if the token is already invalid.
    } finally {
      clearSession()
      navigate(merchantPath('/login'), { replace: true })
    }
  }

  return (
    <AppShell
      fallbackAppName={merchant?.company_name || merchant?.name || `${appConfig.appName} - Merchant Portal`}
      items={items}
      onLogout={handleLogout}
      portalType="merchant"
      user={user}
      userName={user?.name ?? t('Merchant', { defaultValue: 'Merchant' })}
      userRole={portalRole ?? 'Merchant'}
    >
      <Outlet />
    </AppShell>
  )
}
