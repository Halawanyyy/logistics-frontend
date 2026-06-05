import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { AppProvider } from './app/providers'
import { router } from './app/router'
import './shared/i18n/i18n'
import { LocaleProvider } from './shared/i18n/LocaleProvider'
import { ThemeProvider } from './shared/theme/ThemeProvider'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LocaleProvider>
      <ThemeProvider>
        <AppProvider>
          <RouterProvider router={router} />
        </AppProvider>
      </ThemeProvider>
    </LocaleProvider>
  </StrictMode>,
)
