import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { AppProvider } from './app/providers'
import { router } from './app/router'
import './shared/i18n/i18n'
import { LocaleProvider } from './shared/i18n/LocaleProvider'
import { BrandProvider } from './shared/branding/BrandProvider'
import { ThemeProvider } from './shared/theme/ThemeProvider'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LocaleProvider>
      <ThemeProvider>
        <AppProvider>
          <BrandProvider>
            <RouterProvider router={router} />
          </BrandProvider>
        </AppProvider>
      </ThemeProvider>
    </LocaleProvider>
  </StrictMode>,
)
