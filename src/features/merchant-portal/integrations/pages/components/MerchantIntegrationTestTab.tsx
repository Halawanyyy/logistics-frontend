import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  Play,
  Copy,
  Check,
  RotateCcw,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import {
  listMerchantIntegrationTokens,
  testMerchantIntegration,
} from '../../api/merchantPortalIntegrations.api'
import type {
  MerchantIntegrationToken,
  TestMerchantIntegrationPayload,
} from '../../types/merchantPortalIntegrations.types'
import { Button } from '../../../../../shared/components/ui/Button'
import { Select } from '../../../../../shared/components/ui/Select'
import { CodeViewer } from './CodeViewer'

interface TestActionOption {
  id: string
  label: string
  endpoint: string
  defaultPayload: string
  abilities?: string[]
}

const ACTION_OPTIONS: TestActionOption[] = [
  {
    id: 'validate_abilities',
    label: 'POST /merchant-portal/integrations/test (Validate Abilities)',
    endpoint: '/merchant-portal/integrations/test',
    defaultPayload: JSON.stringify(
      {
        abilities: [
          'integrations.me',
          'orders.create',
          'orders.view',
          'shipments.view',
          'tracking.view',
        ],
      },
      null,
      2
    ),
    abilities: [
      'integrations.me',
      'orders.create',
      'orders.view',
      'shipments.view',
      'tracking.view',
    ],
  },
  {
    id: 'create_order_test',
    label: 'POST /api/integrations/orders (Create Order Test)',
    endpoint: '/api/integrations/orders',
    defaultPayload: JSON.stringify(
      {
        external_source: 'woocommerce',
        external_order_id: 'TEST-001',
        external_order_number: '1001',
        customer_name: 'Test Customer',
        customer_phone: '01000000000',
        delivery_governorate_id: 1,
        delivery_area_id: 1,
        delivery_address: 'Nasr City, Cairo',
        payment_type: 'cod',
        cod_amount: 250,
        items: [
          {
            product_name: 'Sample Item',
            sku: 'ITEM-001',
            quantity: 1,
            unit_price: 250,
          },
        ],
      },
      null,
      2
    ),
    abilities: ['orders.create'],
  },
  {
    id: 'check_connection',
    label: 'GET /api/integrations/me (Check Connection)',
    endpoint: '/api/integrations/me',
    defaultPayload: '{\n  "action": "check_connection"\n}',
    abilities: ['integrations.me'],
  },
]

interface TestExecutionResult {
  success: boolean
  status_code: number
  duration_ms: number
  data: any
  timestamp: string
}

export function MerchantIntegrationTestTab() {
  const { t } = useTranslation()

  // Form State
  const [selectedTokenId, setSelectedTokenId] = useState<number | ''>('')
  const [selectedActionId, setSelectedActionId] = useState<string>(ACTION_OPTIONS[0].id)
  const [payloadText, setPayloadText] = useState<string>(ACTION_OPTIONS[0].defaultPayload)
  const [jsonError, setJsonError] = useState<string | null>(null)

  // Execution Result State
  const [executionResult, setExecutionResult] = useState<TestExecutionResult | null>(null)
  const [copiedResult, setCopiedResult] = useState(false)

  // Fetch Tokens
  const tokensQuery = useQuery({
    queryKey: ['merchant-portal', 'integration-tokens'],
    queryFn: listMerchantIntegrationTokens,
  })

  const tokens = tokensQuery.data?.data ?? []
  const activeTokens = useMemo(
    () => tokens.filter((t: MerchantIntegrationToken) => t.status === 'active'),
    [tokens]
  )

  const selectedAction = useMemo(
    () => ACTION_OPTIONS.find((a) => a.id === selectedActionId) || ACTION_OPTIONS[0],
    [selectedActionId]
  )

  // Test Mutation
  const testMutation = useMutation({
    mutationFn: async (payload: TestMerchantIntegrationPayload) => {
      const startTime = performance.now()
      try {
        const res = await testMerchantIntegration(payload)
        const duration = Math.round(performance.now() - startTime)
        return {
          res,
          duration,
        }
      } catch (err: any) {
        const duration = Math.round(performance.now() - startTime)
        const statusCode = err.response?.status || 500
        const errorData = err.response?.data || {
          message: err.message || 'Request failed',
        }
        return {
          err: errorData,
          statusCode,
          duration,
        }
      }
    },
    onSuccess: (data) => {
      if ('err' in data) {
        setExecutionResult({
          success: false,
          status_code: data.statusCode,
          duration_ms: data.duration,
          data: data.err,
          timestamp: new Date().toLocaleTimeString(),
        })
      } else {
        setExecutionResult({
          success: true,
          status_code: 200,
          duration_ms: data.duration,
          data: data.res.data,
          timestamp: new Date().toLocaleTimeString(),
        })
      }
    },
  })

  // Handle Payload Changes with instant JSON validation
  function handlePayloadChange(value: string) {
    setPayloadText(value)
    if (!value.trim()) {
      setJsonError(null)
      return
    }
    try {
      JSON.parse(value)
      setJsonError(null)
    } catch (e: any) {
      setJsonError(e.message || t('Invalid JSON syntax', { defaultValue: 'Invalid JSON syntax' }))
    }
  }

  // Handle Action Change
  function handleActionChange(actionId: string) {
    setSelectedActionId(actionId)
    const action = ACTION_OPTIONS.find((a) => a.id === actionId)
    if (action) {
      setPayloadText(action.defaultPayload)
      setJsonError(null)
    }
  }

  // Submit Run Test
  function handleRunTest(e?: React.FormEvent) {
    if (e) e.preventDefault()
    if (jsonError) return

    let parsedPayload: any = undefined
    if (payloadText.trim()) {
      try {
        parsedPayload = JSON.parse(payloadText)
      } catch {
        setJsonError(t('Invalid JSON syntax', { defaultValue: 'Invalid JSON syntax' }))
        return
      }
    }

    // Extract abilities if present in payload or action
    const abilities =
      parsedPayload && Array.isArray(parsedPayload.abilities)
        ? parsedPayload.abilities
        : selectedAction.abilities

    testMutation.mutate({
      token_id: selectedTokenId === '' ? undefined : Number(selectedTokenId),
      endpoint: selectedAction.endpoint,
      payload: parsedPayload,
      action: selectedAction.id,
      abilities,
    })
  }

  async function handleCopyResult() {
    if (!executionResult) return
    await navigator.clipboard.writeText(JSON.stringify(executionResult.data, null, 2))
    setCopiedResult(true)
    setTimeout(() => setCopiedResult(false), 2000)
  }

  return (
    <div className="merchant-test-workspace">
      {/* Left Column: Test Request Form */}
      <div className="merchant-test-panel">
        <div>
          <h3 className="merchant-test-panel__title">
            {t('Test Request', { defaultValue: 'Test Request' })}
          </h3>
          <p className="merchant-test-panel__desc">
            {t(
              'Select an integration token and action to test connectivity and payload validation.',
              {
                defaultValue:
                  'Select an integration token and action to test connectivity and payload validation.',
              }
            )}
          </p>
        </div>

        <form onSubmit={handleRunTest} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Select Token */}
          <div className="form-group">
            <label htmlFor="test_token_select" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
              {t('Select Token', { defaultValue: 'Select Token' })}
            </label>
            <Select
              id="test_token_select"
              value={selectedTokenId}
              onChange={(e) =>
                setSelectedTokenId(e.target.value === '' ? '' : Number(e.target.value))
              }
            >
              <option value="">{t('None (Anonymous test)', { defaultValue: 'None (Anonymous test)' })}</option>
              {activeTokens.map((token: MerchantIntegrationToken) => (
                <option key={token.id} value={token.id}>
                  {token.name} ({token.token_prefix})
                </option>
              ))}
            </Select>
          </div>

          {/* Action / Endpoint */}
          <div className="form-group">
            <label htmlFor="test_action_select" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
              {t('Endpoint / Action', { defaultValue: 'Endpoint / Action' })}
            </label>
            <Select
              id="test_action_select"
              value={selectedActionId}
              onChange={(e) => handleActionChange(e.target.value)}
            >
              {ACTION_OPTIONS.map((action) => (
                <option key={action.id} value={action.id}>
                  {action.label}
                </option>
              ))}
            </Select>
          </div>

          {/* Payload JSON Editor */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <label htmlFor="test_payload_editor" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                {t('Payload (JSON)', { defaultValue: 'Payload (JSON)' })}
              </label>
              {jsonError ? (
                <span style={{ fontSize: '0.75rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <AlertCircle size={12} /> {jsonError}
                </span>
              ) : (
                <span style={{ fontSize: '0.75rem', color: '#10b981' }}>
                  {t('Valid JSON', { defaultValue: 'Valid JSON' })}
                </span>
              )}
            </div>

            <textarea
              id="test_payload_editor"
              className="merchant-test-editor"
              value={payloadText}
              onChange={(e) => handlePayloadChange(e.target.value)}
              placeholder='{\n  "key": "value"\n}'
              spellCheck={false}
            />
          </div>

          {/* Submit Action */}
          <div>
            <Button
              type="submit"
              variant="secondary"
              disabled={testMutation.isPending || Boolean(jsonError)}
              className="merchant-integrations-btn--create"
              style={{
                width: '100%',
                justifyContent: 'center',
                opacity: testMutation.isPending || Boolean(jsonError) ? 0.6 : 1,
              }}
            >
              <Play size={15} />
              <span>
                {testMutation.isPending
                  ? t('Running Test...', { defaultValue: 'Running Test...' })
                  : t('Run Test', { defaultValue: 'Run Test' })}
              </span>
            </Button>
          </div>
        </form>
      </div>

      {/* Right Column: Test Result Panel */}
      <div className="merchant-test-panel">
        <div>
          <h3 className="merchant-test-panel__title">
            {t('Test Result', { defaultValue: 'Test Result' })}
          </h3>
          <p className="merchant-test-panel__desc">
            {t('Inspect response payload, status codes, and latency.', {
              defaultValue: 'Inspect response payload, status codes, and latency.',
            })}
          </p>
        </div>

        {/* Result Container */}
        <div className="merchant-test-result-box">
          {testMutation.isPending ? (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem',
                gap: '0.75rem',
                color: 'var(--text-muted)',
              }}
            >
              <div className="animate-spin" style={{ width: '28px', height: '28px', border: '2px solid rgba(59, 130, 246, 0.3)', borderTopColor: '#3b82f6', borderRadius: '50%' }} />
              <span style={{ fontSize: '0.85rem' }}>
                {t('Sending request...', { defaultValue: 'Sending request...' })}
              </span>
            </div>
          ) : executionResult ? (
            <>
              {/* Header Bar */}
              <div className="merchant-test-result-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  {executionResult.success ? (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.6rem',
                        borderRadius: '9999px',
                        background: 'rgba(16, 185, 129, 0.15)',
                        border: '1px solid #10b981',
                        color: '#10b981',
                      }}
                    >
                      <CheckCircle2 size={13} /> {t('Success', { defaultValue: 'Success' })}
                    </span>
                  ) : (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.6rem',
                        borderRadius: '9999px',
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid #ef4444',
                        color: '#ef4444',
                      }}
                    >
                      <XCircle size={13} /> {t('Failed', { defaultValue: 'Failed' })}
                    </span>
                  )}

                  <span
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: executionResult.success ? '#10b981' : '#ef4444',
                    }}
                  >
                    HTTP {executionResult.status_code}
                  </span>

                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                      border: '1px solid var(--border)',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '0.35rem',
                    }}
                  >
                    <Clock size={11} /> {executionResult.duration_ms}ms
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => void handleCopyResult()}
                    aria-label={t('Copy Response', { defaultValue: 'Copy Response' })}
                  >
                    {copiedResult ? (
                      <Check size={13} className="mr-1 text-emerald-400" />
                    ) : (
                      <Copy size={13} className="mr-1" />
                    )}
                    <span>
                      {copiedResult
                        ? t('Copied', { defaultValue: 'Copied' })
                        : t('Copy', { defaultValue: 'Copy' })}
                    </span>
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRunTest()}
                    disabled={testMutation.isPending}
                    aria-label={t('Retry', { defaultValue: 'Retry' })}
                  >
                    <RotateCcw size={13} className="mr-1" />
                    <span>{t('Retry', { defaultValue: 'Retry' })}</span>
                  </Button>
                </div>
              </div>

              {/* Formatted JSON Body */}
              <CodeViewer
                code={JSON.stringify(executionResult.data, null, 2)}
                language="json"
                maxHeight="320px"
              />
            </>
          ) : (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2.5rem 1.5rem',
                textAlign: 'center',
                color: 'var(--text-muted)',
                gap: '0.5rem',
              }}
            >
              <Play size={28} style={{ opacity: 0.4 }} />
              <div style={{ fontWeight: 600, color: 'var(--text)' }}>
                {t('No test result yet', { defaultValue: 'No test result yet' })}
              </div>
              <div style={{ fontSize: '0.85rem' }}>
                {t('Run a test request to inspect the response.', {
                  defaultValue: 'Run a test request to inspect the response.',
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
