import axios, { type AxiosError } from 'axios'
import { appConfig, getTenantHeader } from '../../app/config'
import { useAuthStore } from '../../features/auth/store/auth.store'
import { getLocalePreference } from '../i18n/locale'
import { adminPath } from '../routing/paths'

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
    if (error.response?.status === 401 && !isHandlingUnauthorized) {
      isHandlingUnauthorized = true
      useAuthStore.getState().logout()

      if (window.location.pathname !== adminPath('/login')) {
        window.location.replace(adminPath('/login'))
      }

      window.setTimeout(() => {
        isHandlingUnauthorized = false
      }, 0)
    }

    if (error.response?.status === 403 && !isHandlingForbidden) {
      isHandlingForbidden = true

      if (window.location.pathname !== adminPath('/403')) {
        window.location.replace(adminPath('/403'))
      }

      window.setTimeout(() => {
        isHandlingForbidden = false
      }, 0)
    }

    return Promise.reject(error)
  },
)
