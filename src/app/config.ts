export const appConfig = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000/api',
  appName: 'Logistics System',
  tenantMode: 'single',
  defaultTenantId: 'main',
  tenantHeaderName: 'X-Tenant-ID',
} as const

export function getTenantHeader() {
  if (appConfig.tenantMode !== 'single') {
    return undefined
  }

  return {
    [appConfig.tenantHeaderName]: appConfig.defaultTenantId,
  }
}
