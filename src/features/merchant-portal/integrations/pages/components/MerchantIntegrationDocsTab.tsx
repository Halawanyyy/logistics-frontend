import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { getMerchantIntegrationDocs } from '../../api/merchantPortalIntegrations.api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../../shared/components/ui/Card'
import { LoadingState } from '../../../../../shared/components/states/LoadingState'
import { ErrorState } from '../../../../../shared/components/states/ErrorState'
import { getApiErrorMessage } from '../../../../../shared/api/api-error'
import { useState } from 'react'
import { Button } from '../../../../../shared/components/ui/Button'
import { Copy, Check } from 'lucide-react'

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const { t } = useTranslation()

  async function handleCopy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button type="button" variant="ghost" size="sm" onClick={() => void handleCopy()} className="text-xs">
      {copied ? <Check size={14} className="mr-1" /> : <Copy size={14} className="mr-1" />}
      {copied ? t('Copied', { defaultValue: 'Copied' }) : t('Copy', { defaultValue: 'Copy' })}
    </Button>
  )
}

export function MerchantIntegrationDocsTab() {
  const { t } = useTranslation()
  const docsQuery = useQuery({
    queryKey: ['merchant-portal', 'integration-docs'],
    queryFn: getMerchantIntegrationDocs,
  })

  const docs = docsQuery.data?.data

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('API Documentation', { defaultValue: 'API Documentation' })}</CardTitle>
        <CardDescription>
          {t('Reference for connecting to our systems.', { defaultValue: 'Reference for connecting to our systems.' })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {docsQuery.isLoading ? <LoadingState title={t('Loading documentation...', { defaultValue: 'Loading documentation...' })} /> : null}
        {docsQuery.isError ? (
          <ErrorState
            title={t('Unable to load documentation', { defaultValue: 'Unable to load documentation' })}
            message={getApiErrorMessage(docsQuery.error)}
            onRetry={() => void docsQuery.refetch()}
          />
        ) : null}
        {docs ? (
          <div className="flex flex-col gap-6">
            {docs.base_url && (
              <div>
                <h3 className="font-semibold text-lg mb-2">{t('Base URL', { defaultValue: 'Base URL' })}</h3>
                <div className="bg-muted p-4 rounded-md font-mono text-sm flex items-center justify-between">
                  {docs.base_url}
                  <CopyButton text={docs.base_url} />
                </div>
              </div>
            )}
            {docs.auth_header && (
              <div>
                <h3 className="font-semibold text-lg mb-2">{t('Authentication', { defaultValue: 'Authentication' })}</h3>
                <div className="bg-muted p-4 rounded-md font-mono text-sm flex items-center justify-between">
                  {docs.auth_header}
                  <CopyButton text={docs.auth_header} />
                </div>
              </div>
            )}
            {docs.headers && (
              <div>
                <h3 className="font-semibold text-lg mb-2">{t('Headers', { defaultValue: 'Headers' })}</h3>
                <div className="bg-muted p-4 rounded-md font-mono text-sm relative">
                  <pre>{JSON.stringify(docs.headers, null, 2)}</pre>
                  <div className="absolute top-2 right-2">
                    <CopyButton text={JSON.stringify(docs.headers, null, 2)} />
                  </div>
                </div>
              </div>
            )}
            {docs.endpoints && Array.isArray(docs.endpoints) && docs.endpoints.map((ep: any, idx: number) => (
              <div key={idx} className="border border-border rounded-md p-4">
                <h4 className="font-medium text-md">{ep.name || ep.path}</h4>
                {ep.description && <p className="text-sm text-muted mt-1">{ep.description}</p>}
                {ep.path && (
                  <div className="mt-2 bg-muted p-2 rounded text-xs font-mono">
                    <span className="font-bold text-primary mr-2">{ep.method || 'GET'}</span>
                    {ep.path}
                  </div>
                )}
              </div>
            ))}
            {docs.markdown && (
              <div className="prose prose-sm max-w-none mt-4 dark:prose-invert">
                <pre className="whitespace-pre-wrap">{docs.markdown}</pre>
              </div>
            )}
            {(!docs.base_url && !docs.endpoints && !docs.markdown && !docs.headers) && (
              <div className="bg-muted p-4 rounded-md font-mono text-sm">
                <pre className="whitespace-pre-wrap">{JSON.stringify(docs, null, 2)}</pre>
              </div>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
