export interface MerchantIntegrationToken {
  id: number
  merchant_id?: number
  merchant_name?: string
  name: string
  provider: string
  token_prefix: string
  permissions: string[]
  status: string
  last_used_at: string | null
  expires_at: string | null
  revoked_at: string | null
  revoked_by_name: string | null
  created_by_name: string
  notes: string | null
  created_at: string
  plain_token?: string // only present once at creation
}

export interface CreateMerchantIntegrationTokenPayload {
  name: string
  provider?: string
  abilities?: string[]
  permissions?: string[]
  expires_at?: string | null
  notes?: string | null
}

export interface RevokeMerchantIntegrationTokenPayload {
  notes?: string | null
}

export interface MerchantIntegrationDocs {
  base_path?: string
  base_url?: string
  auth_header?: string
  abilities?: string[]
  headers?: Record<string, string>
  endpoints?: any[]
  examples?: Record<string, any>
  create_order_example?: Record<string, any>
  notes?: string[]
  markdown?: string
  html?: string
  sections?: any[]
  [key: string]: any
}

export interface TestMerchantIntegrationPayload {
  token_id?: number
  endpoint?: string
  payload?: any
  action?: string
  abilities?: string[]
}

export interface MerchantIntegrationTestResult {
  success: boolean
  status?: string
  status_code?: number
  message?: string
  response?: any
  errors?: any
}
