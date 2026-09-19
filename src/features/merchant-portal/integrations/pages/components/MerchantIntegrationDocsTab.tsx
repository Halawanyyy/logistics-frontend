import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import {
  Lock,
  ShoppingCart,
  FileText,
  Truck,
  MapPin,
  Copy,
  Check,
} from 'lucide-react'
import { getMerchantIntegrationDocs } from '../../api/merchantPortalIntegrations.api'
import { LoadingState } from '../../../../../shared/components/states/LoadingState'
import { ErrorState } from '../../../../../shared/components/states/ErrorState'
import { getApiErrorMessage } from '../../../../../shared/api/api-error'
import { Button } from '../../../../../shared/components/ui/Button'
import { CodeViewer } from './CodeViewer'

type DocSectionId = 'auth' | 'create_order' | 'orders' | 'shipments' | 'tracking'

interface DocSectionConfig {
  id: DocSectionId
  label: string
  icon: typeof Lock
  title: string
  description: string
  exampleTitle: string
  method: 'GET' | 'POST'
  endpoint: string
  authHeader: string
  notes: string[]
  curlSnippet: string
  jsonSnippet: string
}

export function MerchantIntegrationDocsTab() {
  const { t } = useTranslation()
  const [activeSectionId, setActiveSectionId] = useState<DocSectionId>('auth')
  const [activeLanguage, setActiveLanguage] = useState<'curl' | 'json'>('curl')
  const [copiedAuth, setCopiedAuth] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)

  const docsQuery = useQuery({
    queryKey: ['merchant-portal', 'integration-docs'],
    queryFn: getMerchantIntegrationDocs,
  })

  const docs = docsQuery.data?.data
  const basePath = docs?.base_path || '/api/integrations'
  const authHeader = docs?.auth_header || 'Authorization: Bearer {plain_token}'

  const orderExampleJson = useMemo(() => {
    if (docs?.create_order_example) {
      return JSON.stringify(docs.create_order_example, null, 2)
    }
    return JSON.stringify(
      {
        external_source: 'woocommerce',
        external_order_id: 'WC-12345',
        external_order_number: '12345',
        customer_name: 'Ahmed Adel',
        customer_phone: '01000000000',
        delivery_governorate_id: 1,
        delivery_area_id: 1,
        delivery_address: 'Nasr City, Cairo',
        payment_type: 'cod',
        cod_amount: 500,
        items: [
          {
            product_name: 'T-Shirt',
            sku: 'TSHIRT-001',
            quantity: 1,
            unit_price: 500,
          },
        ],
      },
      null,
      2
    )
  }, [docs?.create_order_example])

  const sections: DocSectionConfig[] = useMemo(
    () => [
      {
        id: 'auth',
        label: t('Authentication', { defaultValue: 'Authentication' }),
        icon: Lock,
        title: t('Authentication', { defaultValue: 'Authentication' }),
        description: t(
          'Include your API token in the Authorization header for all requests.',
          {
            defaultValue:
              'Include your API token in the Authorization header for all requests.',
          }
        ),
        exampleTitle: t('Example: Check Connection', {
          defaultValue: 'Example: Check Connection',
        }),
        method: 'GET',
        endpoint: `${basePath}/me`,
        authHeader,
        notes: [
          t(
            'merchant_id is derived from the integration token and cannot be spoofed.',
            {
              defaultValue:
                'merchant_id is derived from the integration token and cannot be spoofed.',
            }
          ),
          t(
            'Keep your plain token safe. It is only shown once during creation.',
            {
              defaultValue:
                'Keep your plain token safe. It is only shown once during creation.',
            }
          ),
        ],
        curlSnippet: `curl -X GET "https://api.fastlogistics.com${basePath}/me" \\\n  -H "${authHeader}" \\\n  -H "Accept: application/json"`,
        jsonSnippet: JSON.stringify(
          {
            data: {
              merchant_id: 1,
              merchant_name: 'Demo Store',
              token_name: 'WooCommerce Integration',
              provider: 'woocommerce',
              token_prefix: 'mit_live_c4fe01c...',
              abilities: [
                'integrations.me',
                'orders.create',
                'orders.view',
                'shipments.view',
                'tracking.view',
              ],
            },
          },
          null,
          2
        ),
      },
      {
        id: 'create_order',
        label: t('Create Order', { defaultValue: 'Create Order' }),
        icon: ShoppingCart,
        title: t('Create Order', { defaultValue: 'Create Order' }),
        description: t(
          'Create new merchant-scoped delivery orders directly from your store.',
          {
            defaultValue:
              'Create new merchant-scoped delivery orders directly from your store.',
          }
        ),
        exampleTitle: t('Example: Create Order', {
          defaultValue: 'Example: Create Order',
        }),
        method: 'POST',
        endpoint: `${basePath}/orders`,
        authHeader,
        notes: [
          t(
            'merchant_id is derived from the integration token and cannot be spoofed.',
            {
              defaultValue:
                'merchant_id is derived from the integration token and cannot be spoofed.',
            }
          ),
          t(
            'duplicate external_source + external_order_id pairs are blocked per merchant.',
            {
              defaultValue:
                'duplicate external_source + external_order_id pairs are blocked per merchant.',
            }
          ),
          t(
            'Requires the orders.create ability on the token.',
            {
              defaultValue: 'Requires the orders.create ability on the token.',
            }
          ),
        ],
        curlSnippet: `curl -X POST "https://api.fastlogistics.com${basePath}/orders" \\\n  -H "${authHeader}" \\\n  -H "Content-Type: application/json" \\\n  -H "Accept: application/json" \\\n  -d '${orderExampleJson}'`,
        jsonSnippet: orderExampleJson,
      },
      {
        id: 'orders',
        label: t('Orders', { defaultValue: 'Orders' }),
        icon: FileText,
        title: t('Orders', { defaultValue: 'Orders' }),
        description: t(
          'Retrieve and inspect orders placed through your integration.',
          {
            defaultValue:
              'Retrieve and inspect orders placed through your integration.',
          }
        ),
        exampleTitle: t('Example: List Orders', {
          defaultValue: 'Example: List Orders',
        }),
        method: 'GET',
        endpoint: `${basePath}/orders`,
        authHeader,
        notes: [
          t('Results are strictly scoped to your merchant account.', {
            defaultValue:
              'Results are strictly scoped to your merchant account.',
          }),
          t('Requires the orders.view ability on the token.', {
            defaultValue: 'Requires the orders.view ability on the token.',
          }),
        ],
        curlSnippet: `curl -X GET "https://api.fastlogistics.com${basePath}/orders?status=active" \\\n  -H "${authHeader}" \\\n  -H "Accept: application/json"`,
        jsonSnippet: JSON.stringify(
          {
            data: [
              {
                id: 101,
                order_number: 'ORD-2026-00101',
                external_order_id: 'WC-12345',
                status: 'processing',
                customer_name: 'Ahmed Adel',
                total_amount: 500,
                created_at: '2026-09-14T20:30:00Z',
              },
            ],
          },
          null,
          2
        ),
      },
      {
        id: 'shipments',
        label: t('Shipments', { defaultValue: 'Shipments' }),
        icon: Truck,
        title: t('Shipments', { defaultValue: 'Shipments' }),
        description: t(
          'View shipment dispatches and carrier handover status.',
          {
            defaultValue:
              'View shipment dispatches and carrier handover status.',
          }
        ),
        exampleTitle: t('Example: List Shipments', {
          defaultValue: 'Example: List Shipments',
        }),
        method: 'GET',
        endpoint: `${basePath}/shipments`,
        authHeader,
        notes: [
          t('Returns dispatch status, tracking codes, and waybills.', {
            defaultValue:
              'Returns dispatch status, tracking codes, and waybills.',
          }),
          t('Requires the shipments.view ability on the token.', {
            defaultValue: 'Requires the shipments.view ability on the token.',
          }),
        ],
        curlSnippet: `curl -X GET "https://api.fastlogistics.com${basePath}/shipments" \\\n  -H "${authHeader}" \\\n  -H "Accept: application/json"`,
        jsonSnippet: JSON.stringify(
          {
            data: [
              {
                id: 501,
                shipment_number: 'SHP-2026-0501',
                order_id: 101,
                status: 'out_for_delivery',
                tracking_number: 'TRK987654321',
                dispatched_at: '2026-09-14T21:15:00Z',
              },
            ],
          },
          null,
          2
        ),
      },
      {
        id: 'tracking',
        label: t('Tracking', { defaultValue: 'Tracking' }),
        icon: MapPin,
        title: t('Tracking', { defaultValue: 'Tracking' }),
        description: t(
          'Query public tracking checkpoints and delivery lifecycle events.',
          {
            defaultValue:
              'Query public tracking checkpoints and delivery lifecycle events.',
          }
        ),
        exampleTitle: t('Example: Query Tracking', {
          defaultValue: 'Example: Query Tracking',
        }),
        method: 'GET',
        endpoint: `${basePath}/tracking/{tracking_number}`,
        authHeader,
        notes: [
          t('Tracking updates include driver checkpoint events and timestamps.', {
            defaultValue:
              'Tracking updates include driver checkpoint events and timestamps.',
          }),
          t('Requires the tracking.view ability on the token.', {
            defaultValue: 'Requires the tracking.view ability on the token.',
          }),
        ],
        curlSnippet: `curl -X GET "https://api.fastlogistics.com${basePath}/tracking/TRK987654321" \\\n  -H "${authHeader}" \\\n  -H "Accept: application/json"`,
        jsonSnippet: JSON.stringify(
          {
            data: {
              tracking_number: 'TRK987654321',
              status: 'out_for_delivery',
              last_location: 'Nasr City Hub, Cairo',
              estimated_delivery: '2026-09-15T14:00:00Z',
              events: [
                {
                  status: 'picked_up',
                  timestamp: '2026-09-14T18:00:00Z',
                  description: 'Shipment picked up from merchant warehouse',
                },
                {
                  status: 'out_for_delivery',
                  timestamp: '2026-09-14T22:30:00Z',
                  description: 'Courier assigned and out for delivery',
                },
              ],
            },
          },
          null,
          2
        ),
      },
    ],
    [t, basePath, authHeader, orderExampleJson]
  )

  const activeSection = useMemo(() => {
    return sections.find((s) => s.id === activeSectionId) || sections[0]
  }, [sections, activeSectionId])

  async function handleCopyAuth() {
    await navigator.clipboard.writeText(activeSection.authHeader)
    setCopiedAuth(true)
    setTimeout(() => setCopiedAuth(false), 2000)
  }

  async function handleCopyCode() {
    const textToCopy =
      activeLanguage === 'curl'
        ? activeSection.curlSnippet
        : activeSection.jsonSnippet
    await navigator.clipboard.writeText(textToCopy)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  if (docsQuery.isLoading) {
    return (
      <div style={{ padding: '2rem' }}>
        <LoadingState
          title={t('Loading API documentation...', {
            defaultValue: 'Loading API documentation...',
          })}
        />
      </div>
    )
  }

  if (docsQuery.isError) {
    return (
      <div style={{ padding: '2rem' }}>
        <ErrorState
          title={t('Unable to load documentation', {
            defaultValue: 'Unable to load documentation',
          })}
          message={getApiErrorMessage(docsQuery.error)}
          onRetry={() => void docsQuery.refetch()}
        />
      </div>
    )
  }

  return (
    <div className="merchant-docs-layout">
      {/* Left Column: API Reference Navigation */}
      <nav
        className="merchant-docs-sidebar"
        aria-label={t('API Reference Navigation', {
          defaultValue: 'API Reference Navigation',
        })}
      >
        <div className="merchant-docs-sidebar__title">
          {t('API Reference', { defaultValue: 'API Reference' })}
        </div>
        {sections.map((section) => {
          const Icon = section.icon
          const isActive = section.id === activeSection.id
          return (
            <button
              key={section.id}
              type="button"
              className={`merchant-docs-nav-btn ${isActive ? 'is-active' : ''}`}
              onClick={() => {
                setActiveSectionId(section.id)
                // If switching to Create Order, default to cURL or JSON
                if (section.id === 'create_order') {
                  setActiveLanguage('curl')
                }
              }}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon size={16} aria-hidden="true" />
              <span>{section.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Right Column: Documentation Panel */}
      <div className="merchant-docs-content">
        {/* Section Header */}
        <div className="merchant-docs-content__header">
          <h3 className="merchant-docs-content__title">{activeSection.title}</h3>
          <p className="merchant-docs-content__desc">
            {activeSection.description}
          </p>
        </div>

        {/* Authentication Snippet Box */}
        <div className="merchant-auth-box">
          <span className="merchant-auth-box__text">
            {activeSection.authHeader}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => void handleCopyAuth()}
            aria-label={t('Copy Authorization header', {
              defaultValue: 'Copy Authorization header',
            })}
          >
            {copiedAuth ? (
              <Check size={14} className="mr-1 text-emerald-400" />
            ) : (
              <Copy size={14} className="mr-1" />
            )}
            <span>
              {copiedAuth
                ? t('Copied', { defaultValue: 'Copied' })
                : t('Copy', { defaultValue: 'Copy' })}
            </span>
          </Button>
        </div>

        {/* Example Box */}
        <div className="merchant-example-card">
          <div className="merchant-example-title">
            {activeSection.exampleTitle}
          </div>

          <div className="merchant-example-meta">
            <div className="merchant-example-endpoint">
              <span
                className={`merchant-method-badge merchant-method-badge--${activeSection.method.toLowerCase()}`}
              >
                {activeSection.method}
              </span>
              <span className="merchant-example-path">
                {activeSection.endpoint}
              </span>
            </div>

            <div className="merchant-example-actions">
              <div
                className="merchant-lang-toggle"
                role="group"
                aria-label={t('Language selector', {
                  defaultValue: 'Language selector',
                })}
              >
                <button
                  type="button"
                  className={`merchant-lang-btn ${
                    activeLanguage === 'curl' ? 'is-active' : ''
                  }`}
                  onClick={() => setActiveLanguage('curl')}
                >
                  cURL
                </button>
                <button
                  type="button"
                  className={`merchant-lang-btn ${
                    activeLanguage === 'json' ? 'is-active' : ''
                  }`}
                  onClick={() => setActiveLanguage('json')}
                >
                  JSON
                </button>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => void handleCopyCode()}
                aria-label={t('Copy example code', {
                  defaultValue: 'Copy example code',
                })}
              >
                {copiedCode ? (
                  <Check size={14} className="mr-1 text-emerald-400" />
                ) : (
                  <Copy size={14} className="mr-1" />
                )}
                <span>
                  {copiedCode
                    ? t('Copied', { defaultValue: 'Copied' })
                    : t('Copy', { defaultValue: 'Copy' })}
                </span>
              </Button>
            </div>
          </div>

          {/* Bounded Code Viewer with Line Numbers */}
          <CodeViewer
            code={
              activeLanguage === 'curl'
                ? activeSection.curlSnippet
                : activeSection.jsonSnippet
            }
            language={activeLanguage}
            maxHeight="360px"
          />
        </div>

        {/* Notes and Business Rules */}
        {activeSection.notes.length > 0 && (
          <div
            style={{
              padding: '0.85rem 1rem',
              borderRadius: '0.5rem',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border)',
            }}
          >
            <div
              style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.5rem',
              }}
            >
              {t('Integration Constraints & Notes', {
                defaultValue: 'Integration Constraints & Notes',
              })}
            </div>
            <ul
              style={{
                margin: 0,
                paddingInlineStart: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem',
                fontSize: '0.85rem',
                color: 'var(--text-muted)',
              }}
            >
              {activeSection.notes.map((note, idx) => (
                <li key={idx}>{note}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
