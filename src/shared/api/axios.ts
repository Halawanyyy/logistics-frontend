import axios, { type AxiosError } from 'axios'
import { appConfig, getTenantHeader } from '../../app/config'
import { useAuthStore } from '../../features/auth/store/auth.store'
import { getLocalePreference } from '../i18n/locale'
import { adminPath, merchantPath } from '../routing/paths'

let isHandlingUnauthorized = false
let isHandlingForbidden = false

console.log('API BASE URL:', appConfig.apiBaseUrl)

if (!appConfig.apiBaseUrl.includes('/api')) {
  console.warn('API base URL should include /api')
}

export const apiClient = axios.create({
  baseURL: appConfig.apiBaseUrl,
  headers: {
    Accept: 'application/json',
  },
})

apiClient.interceptors.request.use((requestConfig) => {
  const token = useAuthStore.getState().token
  const locale = getLocalePreference()

  if (token) {
    requestConfig.headers.Authorization = `Bearer ${token}`
  }

  requestConfig.headers['X-Locale'] = locale
  requestConfig.headers['Accept-Language'] = locale

  const tenantHeader = getTenantHeader()
  if (tenantHeader) {
    Object.assign(requestConfig.headers, tenantHeader)
  }

  return requestConfig
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const isMerchant = window.location.pathname.startsWith('/merchant')

    if (error.response?.status === 401 && !isHandlingUnauthorized) {
      isHandlingUnauthorized = true
      useAuthStore.getState().logout()

      const loginRedirect = isMerchant ? merchantPath('/login') : adminPath('/login')
      if (window.location.pathname !== loginRedirect) {
        window.location.replace(loginRedirect)
      }

      window.setTimeout(() => {
        isHandlingUnauthorized = false
      }, 0)
    }

    if (error.response?.status === 403 && !isHandlingForbidden) {
      isHandlingForbidden = true

      const forbiddenRedirect = isMerchant ? merchantPath('/403') : adminPath('/403')
      if (window.location.pathname !== forbiddenRedirect) {
        window.location.replace(forbiddenRedirect)
      }

      window.setTimeout(() => {
        isHandlingForbidden = false
      }, 0)
    }

    return Promise.reject(error)
  },
)
