import { Bell, Menu, Moon, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '../ui/Button'
import { useLocale } from '../../i18n/useLocale'
import { useTheme } from '../../theme/ThemeProvider'
import { BrandMark } from '../branding/BrandMark'
import type { AuthUser } from '../../../features/auth/types/auth.types'
import { TopbarGlobalSearch } from './TopbarGlobalSearch'

type TopbarProps = {
  companyLogo?: string | null
  companyName: string
  isSidebarVisible: boolean
  onToggleSidebar: () => void
  user: AuthUser | null | undefined
  userName: string
  userRole: string
}

export function Topbar({
  companyLogo,
  companyName,
  isSidebarVisible,
  onToggleSidebar,
  user,
  userName,
  userRole,
}: TopbarProps) {
  const { t } = useTranslation()
  const { theme, toggleTheme } = useTheme()
  const { locale, toggleLocale } = useLocale()

  return (
    <header className="app-topbar">
      <div className="app-topbar__intro">
        <Button
          aria-label={t('Toggle navigation', { defaultValue: 'Toggle navigation' })}
          aria-expanded={isSidebarVisible}
          className="app-topbar__menu-button"
          size="sm"
          variant="secondary"
          onClick={onToggleSidebar}
        >
          <Menu size={18} />
        </Button>
        <div>
          <p className="eyebrow">{t('Dashboard')}</p>
          <h2 className="app-topbar__title">{t('Logistics & Warehouse Admin')}</h2>
        </div>
      </div>

      <div className="app-topbar__actions">
        <TopbarGlobalSearch user={user} />
        <Button
          className="app-topbar__button"
          variant="secondary"
          size="sm"
          onClick={toggleLocale}
        >
          {locale === 'en' ? 'AR' : 'EN'}
        </Button>
        <Button aria-label={t('Notifications')} className="app-topbar__icon-button" variant="icon">
          <Bell size={18} />
        </Button>
        <Button
          aria-label={t('Toggle dark mode')}
          className="app-topbar__icon-button"
          variant="icon"
          onClick={toggleTheme}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </Button>
        <div className="app-topbar__brand-chip">
          <BrandMark logoUrl={companyLogo} name={companyName} size="sm" />
          <div>
            <p className="app-topbar__brand-chip-label">{t('Company', { defaultValue: 'Company' })}</p>
            <p className="app-topbar__brand-chip-name">{companyName}</p>
          </div>
        </div>
        <div className="app-topbar__profile">
          <div className="app-topbar__avatar">{userName[0] ?? 'A'}</div>
          <div>
            <p className="app-topbar__profile-name">{userName}</p>
            <p className="app-topbar__profile-role">{userRole || companyName}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
