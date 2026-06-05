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
    return normalizedError?.fieldErrors[name] ?? []
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

  const formError = normalizedError && !normalizedError.isValidationError
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
