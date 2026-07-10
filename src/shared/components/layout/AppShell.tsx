import { useEffect, useState, type PropsWithChildren } from 'react'
import { Sidebar, type SidebarItem } from './Sidebar'
import { Topbar } from './Topbar'
import { useBranding } from '../../branding/useBranding'
import type { AuthUser } from '../../../features/auth/types/auth.types'

type AppShellProps = PropsWithChildren<{
  fallbackAppName: string
  items: SidebarItem[]
  onLogout: () => void
  portalType?: 'admin' | 'merchant'
  user: AuthUser | null | undefined
  userName: string
  userRole: string
}>

export function AppShell({
  fallbackAppName,
  children,
  items,
  onLogout,
  portalType = 'admin',
  user,
  userName,
  userRole,
}: AppShellProps) {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window === 'undefined' ? true : window.innerWidth > 920,
  )
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(() =>
    typeof window === 'undefined' ? true : window.innerWidth > 920,
  )
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const branding = useBranding()
  const companyName = branding.companyName || fallbackAppName
  const sidebarVisible = isDesktop ? desktopSidebarOpen : mobileSidebarOpen

  useEffect(() => {
    function handleResize() {
      const nextIsDesktop = window.innerWidth > 920
      setIsDesktop(nextIsDesktop)

      if (nextIsDesktop) {
        setMobileSidebarOpen(false)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  function handleToggleSidebar() {
    if (isDesktop) {
      setDesktopSidebarOpen((current) => !current)
      return
    }

    setMobileSidebarOpen((current) => !current)
  }

  function closeMobileSidebar() {
    if (!isDesktop) {
      setMobileSidebarOpen(false)
    }
  }

  return (
    <div
      className={[
        'app-shell',
        isDesktop ? 'app-shell--desktop' : 'app-shell--mobile',
        desktopSidebarOpen ? 'app-shell--desktop-sidebar-open' : 'app-shell--desktop-sidebar-hidden',
        mobileSidebarOpen ? 'app-shell--mobile-sidebar-open' : '',
      ].filter(Boolean).join(' ')}
    >
      <button
        aria-label="Close navigation"
        aria-hidden={!mobileSidebarOpen}
        className="app-shell__overlay"
        tabIndex={mobileSidebarOpen ? 0 : -1}
        type="button"
        onClick={closeMobileSidebar}
      />
      <Sidebar
        companyLogo={branding.companyLogo}
        companyName={companyName}
        items={items}
        onLogout={onLogout}
        onNavigate={() => {
          closeMobileSidebar()
        }}
        portalType={portalType}
        sidebarOpen={sidebarVisible}
        supportEmail={branding.supportEmail}
        supportPhone={branding.supportPhone}
        userName={userName}
        userRole={userRole}
      />
      <div className="app-shell__main">
        <Topbar
          companyLogo={branding.companyLogo}
          companyName={companyName}
          isSidebarVisible={sidebarVisible}
          onToggleSidebar={handleToggleSidebar}
          portalType={portalType}
          user={user}
          userName={userName}
          userRole={userRole}
        />
        <main className="app-shell__content">{children}</main>
      </div>
    </div>
  )
}
