export const ADMIN_PREFIX = '/admin'

export function adminPath(path = '') {
  if (!path || path === '/') {
    return ADMIN_PREFIX
  }

  return `${ADMIN_PREFIX}${path.startsWith('/') ? path : `/${path}`}`
}

export function legacyPathFromAdmin(path: string) {
  if (!path.startsWith(ADMIN_PREFIX)) {
    return path
  }

  const legacyPath = path.slice(ADMIN_PREFIX.length)
  return legacyPath || '/'
}

export const MERCHANT_PREFIX = '/merchant'

export function merchantPath(path = '') {
  if (!path || path === '/') {
    return MERCHANT_PREFIX
  }

  return `${MERCHANT_PREFIX}${path.startsWith('/') ? path : `/${path}`}`
}
