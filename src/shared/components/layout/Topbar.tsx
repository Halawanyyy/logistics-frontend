import { Menu, Moon, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useLocale } from '../../i18n/useLocale'
import { useTheme } from '../../theme/ThemeProvider'
import { BrandLogo } from '../branding/BrandLogo'
import type { AuthUser } from '../../../features/auth/types/auth.types'
import { adminPath, merchantPath } from '../../routing/paths'
import { TopbarGlobalSearch } from './TopbarGlobalSearch'

type TopbarProps = {
  companyLogo?: string | null
  companyName: string
  isSidebarVisible: boolean
  onToggleSidebar: () => void
  portalType?: 'admin' | 'merchant'
  user: AuthUser | null | undefined
  userName: string
  userRole: string
}

export function Topbar({
  companyLogo,
  companyName,
  isSidebarVisible,
  onToggleSidebar,
  portalType = 'admin',
  user,
}: TopbarProps) {
  const { t } = useTranslation()
  const { theme, toggleTheme } = useTheme()
  const { locale, toggleLocale } = useLocale()
  const dashboardPath = portalType === 'merchant'
    ? merchantPath('/dashboard')
    : adminPath('/dashboard')

  return (
    <header className="app-topbar">
      <button
        type="button"
        aria-label={t('Toggle navigation', { defaultValue: 'Toggle navigation' })}
        aria-expanded={isSidebarVisible}
        className="app-topbar__menu-button app-topbar__icon-button"
        onClick={onToggleSidebar}
      >
        <Menu aria-hidden="true" size={20} />
      </button>

      <div className="app-topbar__spacer" />

      <div className="app-topbar__actions">
        {portalType !== 'merchant' && <TopbarGlobalSearch user={user} />}
        <button
          type="button"
          aria-label={locale === 'en'
            ? t('Switch language to Arabic', { defaultValue: 'Switch language to Arabic' })
            : t('Switch language to English', { defaultValue: 'Switch language to English' })}
          className="app-topbar__language-button"
          onClick={toggleLocale}
        >
          {locale === 'en' ? 'AR' : 'EN'}
        </button>
        <button
          type="button"
          aria-label={theme === 'dark'
            ? t('Switch to light mode', { defaultValue: 'Switch to light mode' })
            : t('Switch to dark mode', { defaultValue: 'Switch to dark mode' })}
          className="app-topbar__icon-button"
          onClick={toggleTheme}
        >
          {theme === 'dark'
            ? <Sun aria-hidden="true" size={19} />
            : <Moon aria-hidden="true" size={19} />}
        </button>
        <Link
          aria-label={t('Go to dashboard', { defaultValue: 'Go to dashboard' })}
          className="app-topbar__logo"
          to={dashboardPath}
        >
          <BrandLogo logoUrl={companyLogo} name={companyName} size="sm" />
        </Link>
      </div>
    </header>
  )
}
