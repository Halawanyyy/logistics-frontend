import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink, useLocation } from 'react-router-dom'
import { ChevronDown, Headset, LogOut } from 'lucide-react'
import { Button } from '../ui/Button'
import { cn } from '../../utils/cn'
import { BrandLogo } from '../branding/BrandLogo'
import type { NavGroup, SidebarItem } from './AppShell'

const SIDEBAR_GROUPS_STORAGE_KEY = 'sidebar-groups-state'

type SidebarProps = {
  companyLogo?: string | null
  companyName: string
  items: SidebarItem[]
  onLogout: () => void
  onNavigate?: () => void
  sidebarOpen: boolean
  supportEmail?: string
  supportPhone?: string
  userName: string
  userRole: string
  portalType?: 'admin' | 'merchant'
}

function readStoredGroupState() {
  if (typeof window === 'undefined') {
    return {}
  }

  try {
    const storedState = window.localStorage.getItem(SIDEBAR_GROUPS_STORAGE_KEY)
    return storedState ? JSON.parse(storedState) as Record<string, boolean> : {}
  } catch {
    return {}
  }
}

function routeMatches(pathname: string, path: string) {
  return pathname === path || pathname.startsWith(`${path}/`)
}

export function Sidebar({
  companyLogo,
  companyName,
  items,
  onLogout,
  onNavigate,
  sidebarOpen,
  supportEmail,
  supportPhone,
  userName,
  userRole,
  portalType = 'admin',
}: SidebarProps) {
  const { t } = useTranslation()
  const location = useLocation()
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(readStoredGroupState)

  function getGroupKey(group: NavGroup) {
    return `${portalType}:${group.label}`
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(SIDEBAR_GROUPS_STORAGE_KEY, JSON.stringify(openGroups))
    }
  }, [openGroups])

  useEffect(() => {
    const activeGroups = items.filter(
      (item): item is NavGroup => item.type === 'group'
        && item.children.some((child) => routeMatches(location.pathname, child.path)),
    )

    if (!activeGroups.length) {
      return
    }

    setOpenGroups((current) => {
      const next = { ...current }
      let changed = false

      activeGroups.forEach((group) => {
        const groupKey = getGroupKey(group)
        if (next[groupKey] !== true) {
          next[groupKey] = true
          changed = true
        }
      })

      return changed ? next : current
    })
  }, [items, location.pathname, portalType])

  function toggleGroup(group: NavGroup) {
    const groupKey = getGroupKey(group)
    setOpenGroups((current) => ({
      ...current,
      [groupKey]: !(current[groupKey] ?? group.defaultOpen ?? false),
    }))
  }

  return (
    <aside className={cn('app-sidebar', sidebarOpen && 'app-sidebar--open')}>
      <div className="app-sidebar__brand">
        <BrandLogo className="app-sidebar__logo" logoUrl={companyLogo} name={companyName} size="lg" />
        <div className="app-sidebar__brand-copy">
          <p className="eyebrow">{t('Logistics')}</p>
          <h2>{companyName}</h2>
          <p>{t('Operations Control Center', { defaultValue: 'Operations Control Center' })}</p>
        </div>
      </div>

      <nav className="app-sidebar__nav" aria-label={t('Main navigation')}>
        {items.map((item) => {
          if (item.type === 'link') {
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onNavigate}
                className={({ isActive }) => cn('app-sidebar__link', isActive && 'app-sidebar__link--active')}
              >
                <span className="app-sidebar__link-icon">{item.icon}</span>
                <span>{t(item.label, { defaultValue: item.label })}</span>
              </NavLink>
            )
          }

          const groupKey = getGroupKey(item)
          const isOpen = openGroups[groupKey] ?? item.defaultOpen ?? false
          const hasActiveChild = item.children.some((child) => routeMatches(location.pathname, child.path))

          return (
            <div className="app-sidebar__group" key={groupKey}>
              <button
                aria-expanded={isOpen}
                className={cn('app-sidebar__group-trigger', hasActiveChild && 'app-sidebar__group-trigger--active')}
                type="button"
                onClick={() => toggleGroup(item)}
              >
                <span className="app-sidebar__group-label">
                  <span className="app-sidebar__group-icon">{item.icon}</span>
                  <span>{t(item.label, { defaultValue: item.label })}</span>
                </span>
                <span className={cn('app-sidebar__group-chevron', isOpen && 'app-sidebar__group-chevron--open')}>
                  <ChevronDown size={15} />
                </span>
              </button>
              <div className={cn('app-sidebar__group-items', isOpen && 'app-sidebar__group-items--open')}>
                {item.children.map((child) => (
                  <NavLink
                    key={child.path}
                    to={child.path}
                    onClick={onNavigate}
                    className={({ isActive }) => cn(
                      'app-sidebar__link',
                      'app-sidebar__link--nested',
                      isActive && 'app-sidebar__link--active',
                    )}
                  >
                    <span className="app-sidebar__link-icon">{child.icon}</span>
                    <span>{t(child.label, { defaultValue: child.label })}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          )
        })}
      </nav>

      <div className="app-sidebar__support-card">
        <div className="app-sidebar__support-icon">
          <Headset size={18} />
        </div>
        <div className="app-sidebar__support-copy">
          <strong>{t('Need help?', { defaultValue: 'Need help?' })}</strong>
          <p>{t('Support stays available for settings, shipments, and operations.', { defaultValue: 'Support stays available for settings, shipments, and operations.' })}</p>
          {supportEmail ? <span>{supportEmail}</span> : null}
          {!supportEmail && supportPhone ? <span>{supportPhone}</span> : null}
        </div>
      </div>

      <div className="app-sidebar__footer">
        <div>
          <p className="app-sidebar__user-name">{userName}</p>
          <p className="app-sidebar__user-role">{userRole}</p>
        </div>
        <Button variant="secondary" onClick={onLogout}>
          <LogOut size={16} />
          {t('Logout')}
        </Button>
      </div>
    </aside>
  )
}
