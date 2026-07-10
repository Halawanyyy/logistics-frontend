import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery } from '@tanstack/react-query'
import { listMerchantIntegrationTokens, testMerchantIntegration } from '../api/merchantPortalIntegrations.api'
import type { TestMerchantIntegrationPayload } from '../types/merchantPortalIntegrations.types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../shared/components/ui/Card'
import { Button } from '../../../../shared/components/ui/Button'
import { Input } from '../../../../shared/components/ui/Input'
import { Select } from '../../../../shared/components/ui/Select'
import { ErrorState } from '../../../../shared/components/states/ErrorState'
import { getApiErrorMessage } from '../../../../shared/api/api-error'
import { StatusBadge } from '../../../../shared/components/ui/StatusBadge'
import { LoadingState } from '../../../../shared/components/states/LoadingState'

export function MerchantIntegrationTestTab() {
  const { t } = useTranslation()
  const [tokenId, setTokenId] = useState<number | ''>('')
  const [endpoint, setEndpoint] = useState('')
  const [payloadText, setPayloadText] = useState('')

  const tokensQuery = useQuery({
    queryKey: ['merchant-portal', 'integration-tokens'],
    queryFn: listMerchantIntegrationTokens,
  })

  const testMutation = useMutation({
    mutationFn: (payload: TestMerchantIntegrationPayload) => testMerchantIntegration(payload),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    let parsedPayload = undefined
    if (payloadText) {
      try {
        parsedPayload = JSON.parse(payloadText)
      } catch (err) {
        // Fallback to sending it as a string if it's not valid JSON
        parsedPayload = payloadText
      }
    }
    
    testMutation.mutate({
      token_id: tokenId === '' ? undefined : Number(tokenId),
      endpoint: endpoint || undefined,
      payload: parsedPayload,
    })
  }

  const tokens = tokensQuery.data?.data ?? []

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('Test Integration', { defaultValue: 'Test Integration' })}</CardTitle>
        <CardDescription>
          {t('Send a test request to verify your integration is working properly.', { defaultValue: 'Send a test request to verify your integration is working properly.' })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {tokensQuery.isLoading ? <LoadingState title={t('Loading tokens...', { defaultValue: 'Loading tokens...' })} /> : null}
        
        <form onSubmit={handleSubmit} className="form-grid max-w-2xl">
          <div className="form-group">
            <label htmlFor="test_token_id">{t('Select Token (Optional)', { defaultValue: 'Select Token (Optional)' })}</label>
            <Select
              id="test_token_id"
              value={tokenId}
              onChange={(e) => setTokenId(e.target.value === '' ? '' : Number(e.target.value))}
            >
              <option value="">{t('None', { defaultValue: 'None' })}</option>
              {tokens.map((token) => (
                <option key={token.id} value={token.id}>{token.name} ({token.token_prefix})</option>
              ))}
            </Select>
          </div>
          <div className="form-group">
            <label htmlFor="test_endpoint">{t('Endpoint / Action (Optional)', { defaultValue: 'Endpoint / Action (Optional)' })}</label>
            <Input
              id="test_endpoint"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder={t('e.g., /orders or verify')}
            />
          </div>
          <div className="form-group">
            <label htmlFor="test_payload">{t('Payload (JSON Optional)', { defaultValue: 'Payload (JSON Optional)' })}</label>
            <textarea
              id="test_payload"
              className="ui-input min-h-[100px]"
              value={payloadText}
              onChange={(e) => setPayloadText(e.target.value)}
              placeholder='{"key": "value"}'
            />
          </div>
          <div className="form-actions">
            <Button type="submit" disabled={testMutation.isPending}>
              {testMutation.isPending ? t('Running...') : t('Run Test', { defaultValue: 'Run Test' })}
            </Button>
          </div>
        </form>

        <div className="mt-8 border-t border-border pt-6">
          <h3 className="font-semibold text-lg mb-4">{t('Test Result', { defaultValue: 'Test Result' })}</h3>
          {testMutation.isError ? (
            <ErrorState
              title={t('Failed to run integration test.', { defaultValue: 'Failed to run integration test.' })}
              message={getApiErrorMessage(testMutation.error)}
            />
          ) : null}
          {testMutation.isSuccess && testMutation.data ? (
            <div className="bg-muted p-4 rounded-md">
              <div className="mb-4 flex items-center gap-2">
                <span className="font-medium">{t('Status')}:</span>
                <StatusBadge value={testMutation.data.data.success ? 'success' : 'danger'}>
                  {testMutation.data.data.success 
                    ? t('Test passed', { defaultValue: 'Test passed' }) 
                    : t('Test failed', { defaultValue: 'Test failed' })}
                </StatusBadge>
              </div>
              {testMutation.data.data.status_code && (
                <div className="mb-2">
                  <span className="font-medium mr-2">{t('Status Code', { defaultValue: 'Status Code' })}:</span>
                  <span className="font-mono text-sm">{testMutation.data.data.status_code}</span>
                </div>
              )}
              {testMutation.data.data.message && (
                <div className="mb-2">
                  <span className="font-medium mr-2">{t('Message')}:</span>
                  <span>{testMutation.data.data.message}</span>
                </div>
              )}
              {testMutation.data.data.response && (
                <div className="mt-4">
                  <span className="font-medium block mb-2">{t('Response', { defaultValue: 'Response' })}:</span>
                  <pre className="bg-background p-4 border border-border rounded text-sm font-mono whitespace-pre-wrap">
                    {JSON.stringify(testMutation.data.data.response, null, 2)}
                  </pre>
                </div>
              )}
              {testMutation.data.data.errors && (
                <div className="mt-4">
                  <span className="font-medium block mb-2 text-red-500">{t('Errors')}:</span>
                  <pre className="bg-background p-4 border border-red-200 rounded text-sm font-mono whitespace-pre-wrap text-red-600">
                    {JSON.stringify(testMutation.data.data.errors, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ) : null}
          {!testMutation.isPending && !testMutation.isError && !testMutation.isSuccess && (
            <p className="text-muted text-sm italic">{t('Run a test to see the results here.', { defaultValue: 'Run a test to see the results here.' })}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
