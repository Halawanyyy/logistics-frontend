import axios from 'axios'

export type ApiValidationErrors = Record<string, string[]>

export type ApiErrorResponse = {
  message: string
  errors?: ApiValidationErrors
}

export type NormalizedApiError = {
  status?: number
  message: string
  fieldErrors: Record<string, string[]>
  isValidationError: boolean
  isUnauthorized: boolean
  isForbidden: boolean
  isNotFound: boolean
}

const DEFAULT_ERROR_MESSAGE = 'Something went wrong.'
const NETWORK_ERROR_MESSAGE = 'Unable to reach the server. Please check your connection and try again.'

export function normalizeApiError(error: unknown): NormalizedApiError {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const status = error.response?.status
    const message =
      error.response?.data?.message ??
      (error.code === 'ERR_NETWORK' || !error.response ? NETWORK_ERROR_MESSAGE : error.message) ??
      DEFAULT_ERROR_MESSAGE
    const fieldErrors = error.response?.data?.errors ?? {}

    return {
      status,
      message,
      fieldErrors,
      isValidationError: status === 422,
      isUnauthorized: status === 401,
      isForbidden: status === 403,
      isNotFound: status === 404,
    }
  }

  if (error instanceof Error) {
    return {
      message: error.message || DEFAULT_ERROR_MESSAGE,
      fieldErrors: {},
      isValidationError: false,
      isUnauthorized: false,
      isForbidden: false,
      isNotFound: false,
    }
  }

  return {
    message: DEFAULT_ERROR_MESSAGE,
    fieldErrors: {},
    isValidationError: false,
    isUnauthorized: false,
    isForbidden: false,
    isNotFound: false,
  }
}

export function getApiErrorMessage(error: unknown) {
  return normalizeApiError(error).message
}

export function getApiValidationErrors(error: unknown) {
  return normalizeApiError(error).fieldErrors
}

export function getApiStatus(error: unknown) {
  return normalizeApiError(error).status
}

export function isApiNotFound(error: unknown) {
  return normalizeApiError(error).isNotFound
}

export function isApiValidationError(error: unknown) {
  return normalizeApiError(error).isValidationError
}
