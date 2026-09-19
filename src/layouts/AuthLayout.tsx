import { Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Package, CheckCircle, MapPin, Moon, Sun } from 'lucide-react'
import { BrandLogo } from '../shared/components/branding/BrandLogo'
import { useBranding } from '../shared/branding/useBranding'
import { useTheme } from '../shared/theme/ThemeProvider'

export function AuthLayout() {
  const { t } = useTranslation()
  const branding = useBranding()
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="auth-shell">
      <section className="auth-shell__hero">
        <div className="auth-shell__decorations"></div>
        <div className="auth-shell__content">
          <div className="auth-brand">
            <BrandLogo className="auth-brand__icon" size="md" />
            <span className="auth-brand__text">{branding.companyName || branding.appName}</span>
          </div>
          
          <div style={{ marginTop: '5rem' }}>
            <p className="eyebrow">{t('LOGISTICS, UNDER CONTROL')}</p>
            <h1>{t('Move every shipment with confidence.')}</h1>
            <p className="hero-desc">
              {t('Track orders, manage warehouses, coordinate drivers, and keep every delivery moving from one connected workspace.')}
            </p>
          </div>
        </div>

        <div className="auth-highlights">
          <div className="auth-kpi-card">
            <div className="auth-kpi-card__icon">
              <Package size={24} />
            </div>
            <div>
              <div className="auth-kpi-card__value">1,248</div>
              <div className="auth-kpi-card__label">{t('Active shipments')}</div>
            </div>
          </div>
          <div className="auth-kpi-card">
            <div className="auth-kpi-card__icon">
              <CheckCircle size={24} />
            </div>
            <div>
              <div className="auth-kpi-card__value">98.6%</div>
              <div className="auth-kpi-card__label">{t('On-time delivery')}</div>
            </div>
          </div>
          <div className="auth-kpi-card">
            <div className="auth-kpi-card__icon">
              <MapPin size={24} />
            </div>
            <div>
              <div className="auth-kpi-card__value">24/7</div>
              <div className="auth-kpi-card__label">{t('Live tracking')}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="auth-shell__panel">
        <div className="auth-theme-toggle">
          <button
            type="button"
            className="app-topbar__icon-button"
            onClick={toggleTheme}
            aria-label={t('Toggle theme')}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
        <Outlet />
      </section>
    </div>
  )
}
