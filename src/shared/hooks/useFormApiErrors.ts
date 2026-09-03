import { useMemo } from 'react'
import { normalizeApiError, type NormalizedApiError } from '../api/api-error'

export function useFormApiErrors(error?: unknown) {
  const normalizedError = useMemo<NormalizedApiError | null>(() => {
    if (!error) {
      return null
    }

    return normalizeApiError(error)
  }, [error])

  function getFieldErrors(name: string) {
    if (!normalizedError) {
      return []
    }

    const directErrors = normalizedError.fieldErrors[name] ?? []
    const nestedErrors = Object.entries(normalizedError.fieldErrors)
      .filter(([fieldName]) => fieldName.startsWith(`${name}.`))
      .flatMap(([, errors]) => errors)

    return Array.from(new Set([...directErrors, ...nestedErrors]))
  }

  function getFieldError(name: string) {
    return getFieldErrors(name)[0]
  }

  const hasErrors = Boolean(
    normalizedError && (
      normalizedError.message ||
      Object.keys(normalizedError.fieldErrors).length > 0
    ),
  )

  const hasFieldErrors = Boolean(normalizedError && Object.keys(normalizedError.fieldErrors).length > 0)
  const formError = normalizedError && (!normalizedError.isValidationError || !hasFieldErrors)
    ? normalizedError.message
    : null

  return {
    normalizedError,
    getFieldError,
    getFieldErrors,
    formError,
    hasErrors,
  }
}
