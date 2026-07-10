# Merchant Portal Frontend Implementation Checklist

This checklist tracks the implementation progress of the Merchant Portal modules, pages, routes, API integrations, capability gates, localization, and quality assurance.

## Status Legend
- **Missing**: Not started or unimplemented.
- **Partial**: Partially built or placeholder exists, but lacks API wiring or full design.
- **Implemented**: Code is fully written.
- **Needs Browser QA**: Code is implemented but still requires browser/functional verification.
- **Not Required Now**: Out of scope for current phases.

| Phase | Module | Route | API Endpoint | Client Exists | Types Exist | UI Page Exists | Capability Gate | Arabic/English | RTL Checked | Mobile Checked | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Phase 1** | **Foundation** | `/merchant/login` | `POST /api/auth/login` | Implemented | Implemented | Implemented | None | Implemented | Needs Browser QA | Needs Browser QA | **Needs Browser QA** | Created dedicated Merchant login page |
| **Phase 1** | **Foundation** | `/merchant/dashboard` | `GET /api/merchant-portal/me` | Implemented | Implemented | Implemented | `dashboard.view` | Implemented | Needs Browser QA | Needs Browser QA | **Needs Browser QA** | Dashboard shell / capability-gated routes |
| **Phase 1** | **Foundation** | `/merchant/403` | None | Not Required Now | Not Required Now | Implemented | None | Implemented | Needs Browser QA | Needs Browser QA | **Needs Browser QA** | Dedicated merchant 403 page |
| **Phase 1** | **Foundation** | `/merchant/404` | None | Not Required Now | Not Required Now | Implemented | None | Implemented | Needs Browser QA | Needs Browser QA | **Needs Browser QA** | Dedicated merchant 404 page |
| **Phase 2** | **Dashboard Summary** | `/merchant/dashboard` | `GET /api/merchant-portal/dashboard/summary` | Implemented | Implemented | Implemented | `dashboard.view` | Implemented | Needs Browser QA | Needs Browser QA | **Needs Browser QA** | Dashboard shell, KPI cards, and dynamic Recharts charts (Orders, Shipments, Finance, Warehouse) integrated mirroring Admin Dashboard. |
| **Phase 2** | **Profile** | `/merchant/profile` | `GET/PUT /api/merchant-portal/profile` | Implemented | Implemented | Implemented | `profile.view`, `profile.update` | Implemented | Needs Browser QA | Needs Browser QA | **Needs Browser QA** | Profile page and Profile sidebar navigation implemented. |
| **Phase 2** | **Settings** | `/merchant/settings` | `GET/PUT /api/merchant-portal/settings` | Implemented | Implemented | Implemented | `settings.view`, `settings.update` | Implemented | Needs Browser QA | Needs Browser QA | **Needs Browser QA** | Settings page implemented |
| **Phase 3** | **Orders List** | `/merchant/orders` | `GET /api/merchant-portal/orders` | Implemented | Implemented | Implemented | `orders.view` | Implemented | Needs Browser QA | Needs Browser QA | **Needs Browser QA** | Canonical implementation moved under `src/features/merchant-portal/orders` and uses merchant-scoped filters only. |
| **Phase 3** | **Create Order** | `/merchant/orders/create` | `POST /api/merchant-portal/orders` | Implemented | Implemented | Implemented | `orders.create` | Implemented | Needs Browser QA | Needs Browser QA | **Needs Browser QA** | Uses merchant-only payload sanitization; no `merchant_id`, no forbidden fields, no packaging editing. |
| **Phase 3** | **Order Details** | `/merchant/orders/:orderId` | `GET /api/merchant-portal/orders/{id}` | Implemented | Implemented | Implemented | `orders.view` | Implemented | Needs Browser QA | Needs Browser QA | **Needs Browser QA** | Includes read-only packaging display when returned by the backend. |
| **Phase 3** | **Edit Order** | `/merchant/orders/:orderId/edit` | `PUT /api/merchant-portal/orders/{id}` | Implemented | Implemented | Implemented | `orders.update` | Implemented | Needs Browser QA | Needs Browser QA | **Needs Browser QA** | Reuses the merchant order form and lets backend enforce final lifecycle rules. |
| **Phase 3** | **Confirm Order** | `/merchant/orders/:orderId` (action) | `POST /api/merchant-portal/orders/{id}/confirm` | Implemented | Implemented | Implemented | `orders.confirm` | Implemented | Needs Browser QA | Needs Browser QA | **Needs Browser QA** | Conservative frontend visibility only; backend remains final authority. |
| **Phase 3** | **Cancel Order** | `/merchant/orders/:orderId` (action) | `POST /api/merchant-portal/orders/{id}/cancel` | Implemented | Implemented | Implemented | `orders.cancel` | Implemented | Needs Browser QA | Needs Browser QA | **Needs Browser QA** | Conservative frontend visibility only; backend remains final authority. |
| **Phase 3** | **Order Labels** | `/merchant/orders/:orderId` (action) | `GET /api/merchant-portal/orders/{id}/label` | Implemented | Implemented | Implemented | `labels.print` | Implemented | Needs Browser QA | Needs Browser QA | **Needs Browser QA** | Uses the merchant label endpoint only. |
| **Phase 4** | **Shipments List** | `/merchant/shipments` | `GET /api/merchant-portal/shipments` | Implemented | Implemented | Implemented | `shipments.view` | Implemented | Needs Browser QA | Needs Browser QA | **Needs Browser QA** | Matches Admin style, decoupled API client |
| **Phase 4** | **Shipment Details** | `/merchant/shipments/:shipmentId` | `GET /api/merchant-portal/shipments/{id}` | Implemented | Implemented | Implemented | `shipments.view` | Implemented | Needs Browser QA | Needs Browser QA | **Needs Browser QA** | Safely renders merchant subset of shipment |
| **Phase 4** | **Tracking** | `/merchant/shipments/:shipmentId` (tab) | `GET /api/merchant-portal/shipments/{id}/tracking` | Implemented | Implemented | Implemented | `shipments.view` | Implemented | Needs Browser QA | Needs Browser QA | **Needs Browser QA** | Rendered inside shipment details |
| **Phase 5** | **Warehouse Products** | `/merchant/warehouse/products` | `GET /api/merchant-portal/warehouse/products` | Implemented | Implemented | Partial | `warehouse.view` | Partial | Missing | Missing | **Partial** | Placeholder page exists |
| **Phase 5** | **Inventory Stocks** | `/merchant/warehouse/inventory` | `GET /api/merchant-portal/warehouse/inventory` | Implemented | Implemented | Partial | `warehouse.view` | Partial | Missing | Missing | **Partial** | Placeholder page exists |
| **Phase 5** | **Low Stock Alert** | `/merchant/warehouse/inventory/low-stock` | `GET /api/merchant-portal/warehouse/inventory/low-stock` | Missing | Missing | Missing | `warehouse.view` | Missing | Missing | Missing | **Missing** | Pending Phase 5 |
| **Phase 5** | **Stock Movements** | `/merchant/warehouse/movements` | `GET /api/merchant-portal/warehouse/movements` | Missing | Missing | Missing | `warehouse.view` | Missing | Missing | Missing | **Missing** | Pending Phase 5 |
| **Phase 5** | **Warehouse Charges** | `/merchant/warehouse/charges` | `GET /api/merchant-portal/warehouse/charges` | Missing | Missing | Missing | `warehouse.view` | Missing | Missing | Missing | **Missing** | Pending Phase 5 |
| **Phase 5** | **Inbound Requests** | `/merchant/warehouse/inbound-requests` | `GET /api/merchant-portal/warehouse/inbound-requests` | Missing | Missing | Missing | `warehouse.inbound_requests.view` | Missing | Missing | Missing | **Missing** | Pending Phase 5 |
| **Phase 6** | **Wallet** | `/merchant/finance` | `GET /api/merchant-portal/finance/wallet/summary` | Missing | Missing | Missing | `wallet.view` | Missing | Missing | Missing | **Missing** | Pending Phase 6 |
| **Phase 6** | **Invoices** | `/merchant/finance/invoices` | `GET /api/merchant-portal/finance/invoices` | Missing | Missing | Partial | `invoices.view` | Partial | Missing | Missing | **Partial** | Route and fallback view registered |
| **Phase 6** | **Payouts** | `/merchant/finance/payouts` | `GET /api/merchant-portal/finance/payouts` | Missing | Missing | Missing | `payouts.view` | Missing | Missing | Missing | **Missing** | Pending Phase 6 |
| **Phase 7** | **Integration Tokens** | `/merchant/integrations` | `GET/POST /api/merchant-portal/integration-tokens` | Missing | Missing | Missing | `integrations.view`, `integrations.manage` | Missing | Missing | Missing | **Missing** | Pending Phase 7 |
| **Phase 8** | **Exports** | `/merchant/exports` | `GET/POST /api/merchant-portal/exports` | Missing | Missing | Missing | `exports.view`, `exports.create` | Missing | Missing | Missing | **Missing** | Pending Phase 8 |
| **Phase 8** | **Attachments** | `/merchant/attachments` | `GET/POST /api/merchant-portal/attachments` | Missing | Missing | Missing | `attachments.view` | Missing | Missing | Missing | **Missing** | Pending Phase 8 |
| **Phase 8** | **Notifications** | `/merchant/notifications` | `GET /api/merchant-portal/notifications` | Missing | Missing | Missing | `notifications.view` | Missing | Missing | Missing | **Missing** | Pending Phase 8 |
| **Phase 9** | **Store Info** | `/merchant/store` | `GET /api/merchant-shop/catalog` | Missing | Missing | Missing | None | Missing | Missing | Missing | **Missing** | Pending Phase 9 |

## Phase 3 Notes

- Implemented: merchant-safe location option endpoints now back the Merchant Orders create/edit location dropdowns.
- Active endpoints:
  - `GET /api/merchant-portal/locations/governorates`
  - `GET /api/merchant-portal/locations/areas?governorate_id={id}`
- Backend Gap: a merchant-safe packaging lookup endpoint is still needed before editable packaging selection can be enabled in create/edit.

## UI/UX Polish Pass - Admin Portal Visual Alignment

| Area | Status | Notes |
| --- | --- | --- |
| Merchant Layout | **Needs Browser QA** | Shared `AppShell`, sidebar, and topbar styling aligned with the admin design system while keeping merchant-specific branding/copy. |
| Dashboard Visual Parity | **Needs Browser QA** | KPI cards, summary panels, empty/loading/error states, and quick actions now follow the admin dashboard presentation. |
| Chart / Graph Surface | **Partial** | Admin-style chart card is present, but merchant dashboard API still returns totals only, so no real chart series are available yet. |
| Orders List Visual Parity | **Needs Browser QA** | Sidebar filters, table container, action buttons, and state handling were aligned with the admin orders list. |
| Order Create / Edit Visual Parity | **Needs Browser QA** | Shared form layout remains active with merchant-safe governorate/area dropdowns and centralized validation/error styling. |
| Order Details Visual Parity | **Needs Browser QA** | Details cards, status badges, packaging read-only rendering, and merchant label action use the admin-style component language. |
| Profile Visual Parity | **Needs Browser QA** | Summary card plus editor card layout now matches the rest of the admin-style merchant surfaces. |
| Settings Visual Parity | **Needs Browser QA** | Settings sections, badges, state handling, and form actions were polished to match shared admin patterns. |
| Coming Soon Visual Parity | **Needs Browser QA** | Non-implemented modules remain placeholders but now render with the polished shared empty-state pattern. |
| Localization Review | **Needs Browser QA** | New copy for dashboard, layout, orders list, profile, and settings was added to the centralized English/Arabic translation map. |

## Phase 7: Integrations
- [x] Create API client `merchantPortalIntegrations.api.ts`
- [x] Create types `merchantPortalIntegrations.types.ts`
- [x] Create components for Tokens list, Token Details, and Token Create
- [x] Implement secure one-time plain-token viewing
- [x] Implement Integration Docs panel
- [x] Implement Integration Test panel
- [x] Implement main `MerchantIntegrationsPage.tsx` with tabs
- [x] Gate routes with `integrations.view` and actions with `integrations.manage`
- [x] Update translations for English and Arabic

## Phase 8: Exports, Attachments & Notifications

- [x] **Audit & Scoping**
  - [x] Audit Exports admin UI
  - [x] Audit Attachments admin UI
  - [x] Audit Notifications admin UI
  - [x] Verify API contracts in `merchant-portal-api-documentation.md`

- [x] **Implementation**
  - [x] Build `MerchantExportsPage`
  - [x] Build `MerchantAttachmentsPage`
  - [x] Build `MerchantNotificationsPage`
  - [x] Build `MerchantNotificationBell` in `Topbar`
  - [x] Secure blob downloads
  - [x] Wire routes in `router.tsx`

- [x] **QA & Verification**
  - [x] Verify no `merchant_id` sent in API calls
  - [x] Confirm styling aligns with Admin portal
  - [x] Typecheck and translate new keys for English and Arabic


## Phase 9: Store / Company Catalog

- [x] **Audit & Scoping**
  - [x] Identify backend gap for merchant-safe endpoints.
  - [x] Audit Admin catalog components for UI reference.
- [x] **Implementation**
  - [x] Build `MerchantStorePage.tsx` with polished empty state.
  - [x] Configure backend gap alert and design system alignment.
  - [x] Wire `/merchant/store` route to `store.view` capability.
  - [x] Wire Store sidebar item in `MerchantLayout.tsx`.
- [x] **QA & Verification**
  - [x] Validate no `merchant_id` or `merchant_shop` or `company-catalog-items` endpoints are used.
  - [x] Ensure translations are registered.


## Phase 10: Final QA, Hardening, Localization, and Responsive Polish

- [x] **API Isolation Audit**
  - [x] Verify no `/api/orders`, `/api/admin`, etc. used in Merchant Portal.
  - [x] Verify only `/api/merchant-portal/*` endpoints are used.
- [x] **Merchant_ID Safety Audit**
  - [x] Verify `merchant_id` is stripped from all outgoing payloads.
- [x] **Capability Gates Audit**
  - [x] Verify all `/merchant/*` routes use `requireCapability`.
  - [x] Verify sidebar uses `capability` correctly.
- [x] **UI/UX Consistency Audit**
  - [x] Align PageHeaders, DataTables, Cards, and EmptyStates.
- [x] **Dashboard Final Review**
  - [x] Ensure dashboard only uses `/api/merchant-portal/dashboard/summary`.
- [x] **Details Pages Review**
  - [x] Verify correct unpacking of `response.data`.
- [x] **Localization Review**
  - [x] Ensure strings are piped through `t()` and English/Arabic maps exist.
- [x] **Documentation Closure**
  - [x] Reset "Browser QA Passed" to "Needs Browser QA" pending manual testing.
