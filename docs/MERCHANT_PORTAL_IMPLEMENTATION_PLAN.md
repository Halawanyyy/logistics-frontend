# Merchant Portal Frontend Implementation Plan

## Goal

Build a dedicated Merchant Portal frontend under `/merchant/*`.

The Merchant Portal should feel similar to the Admin Dashboard in quality, layout, and usability, but it must only show and manage data belonging to the authenticated merchant.

The portal must use only Merchant Portal scoped APIs:

```text
/api/merchant-portal/*
```

Admin/internal APIs must not be used to display merchant portal data unless explicitly documented as merchant-safe.

## Core Rules

1. The Merchant Portal is merchant-scoped by backend middleware.
2. The frontend must never send `merchant_id` in query params or request payloads.
3. The frontend must rely on the authenticated merchant membership returned from:

   ```text
   GET /api/merchant-portal/me
   ```
4. The frontend must use the returned `capabilities` to control navigation and actions.
5. The Merchant Portal is not an admin panel.
6. The merchant cannot access other merchants’ data.
7. Shipment operations are read-only for the merchant.
8. Internal operations remain admin-only:

   * assign driver
   * update shipment status
   * complete delivery
   * delivery attempts
   * warehouse receipt confirmation
   * inventory adjustments
   * finance approvals
   * invoice creation
   * payout approval/completion
9. The portal must support Arabic/English and RTL/LTR.
10. The portal must use the existing design system where possible.

---

## Recommended Frontend Structure

```text
/src
  /apps
    /admin
    /merchant
  /features
    /merchant-portal
      /auth
      /dashboard
      /profile
      /orders
      /shipments
      /warehouse
      /finance
      /integrations
      /exports
      /attachments
      /notifications
      /settings
      /store
  /shared
    /api
    /components
    /hooks
    /layouts
    /utils
    /types
```

Recommended route namespace:

```text
/merchant/login
/merchant/dashboard
/merchant/profile
/merchant/settings
/merchant/orders
/merchant/orders/create
/merchant/orders/:orderId
/merchant/orders/:orderId/edit
/merchant/shipments
/merchant/shipments/:shipmentId
/merchant/warehouse/products
/merchant/warehouse/products/:productId
/merchant/warehouse/inventory
/merchant/warehouse/inventory/:stockId
/merchant/warehouse/movements
/merchant/warehouse/charges
/merchant/warehouse/inbound-requests
/merchant/warehouse/inbound-requests/create
/merchant/warehouse/inbound-requests/:requestId
/merchant/finance
/merchant/finance/wallet
/merchant/finance/wallet/transactions
/merchant/finance/wallet/transactions/:transactionId
/merchant/finance/invoices
/merchant/finance/invoices/:invoiceId
/merchant/finance/payouts
/merchant/finance/payouts/:payoutId
/merchant/finance/payouts/request
/merchant/integrations
/merchant/integrations/tokens
/merchant/integrations/docs
/merchant/exports
/merchant/exports/:exportId
/merchant/attachments
/merchant/notifications
/merchant/store
```

---

## Merchant Portal Sidebar

```text
Dashboard

Orders
  Orders List
  Create Order

Shipments
  Shipments List
  Tracking

Warehouse
  Products
  Inventory
  Low Stock
  Stock Movements
  Charges
  Inbound Requests

Finance
  Summary
  Wallet
  Wallet Transactions
  Invoices
  Payouts

Store
  Catalog / Services

Integrations
  Tokens
  API Docs
  Test Integration

Exports

Attachments

Notifications

Settings
  Profile
  Portal Settings
```

Each sidebar item must be gated by the proper merchant capability.

---

## Merchant Portal Capabilities

Expected capabilities:

```text
dashboard.view

profile.view
profile.update
settings.view
settings.update

orders.view
orders.create
orders.update
orders.confirm
orders.cancel

shipments.view

labels.print

warehouse.view
warehouse.inbound_requests.view
warehouse.inbound_requests.create
warehouse.inbound_requests.cancel

finance.view
wallet.view
invoices.view
invoices.download
payouts.view
payouts.request

integrations.view
integrations.manage

exports.view
exports.create
exports.download

attachments.view
attachments.upload
attachments.download
attachments.delete

notifications.view
```

Capability behavior:

* Hide navigation items if the user does not have the needed capability.
* Hide actions if the user does not have the needed action capability.
* If a user manually opens a forbidden route, show a clean 403 page.
* Do not expose raw capability slugs to normal users unless the app already has a diagnostic mode.

---

# Implementation Phases

## Phase 0 — Audit and Foundation Planning

### Tasks

1. Inspect current admin frontend architecture.
2. Identify reusable shared components:

   * layout
   * sidebar
   * topbar
   * DataTable
   * StatusBadge
   * MoneyDisplay
   * DateRangeFilter
   * ConfirmActionModal
   * Attachments
   * ExportButton
   * label/print helpers
   * EmptyState / LoadingState / ErrorState
3. Inspect existing auth storage and API client.
4. Confirm whether `/merchant/login` should reuse `POST /api/auth/login`.
5. Confirm current i18n and locale header behavior.
6. Create a new frontend implementation checklist:

```text
docs/MERCHANT_PORTAL_FRONTEND_IMPLEMENTATION_CHECKLIST.md
```

### Deliverables

* Merchant Portal route plan.
* Merchant Portal API client plan.
* Merchant Portal capability matrix.
* Implementation checklist.

---

## Phase 1 — Merchant Portal App Shell

### APIs

```text
POST /api/auth/login
GET /api/auth/me
POST /api/auth/logout
GET /api/merchant-portal/me
```

### Screens

```text
/merchant/login
/merchant/dashboard
```

### Tasks

1. Add `/merchant/*` route namespace.
2. Create `MerchantPortalLayout`.
3. Create merchant sidebar and topbar.
4. Add merchant portal auth guard.
5. On portal boot:

   * check token
   * call `GET /api/merchant-portal/me`
   * store user, merchant, portal_role, portal_status, capabilities
6. If merchant portal membership is missing or inactive:

   * show forbidden/inactive portal state.
7. Add capability helper:

   * `hasMerchantCapability(capability)`
   * `hasAnyMerchantCapability([...])`
   * `hasAllMerchantCapabilities([...])`
8. Ensure all merchant portal requests send:

   * `Authorization`
   * `X-Locale`
   * `Accept-Language`

### Acceptance Criteria

* Merchant can login.
* Portal shell renders.
* Merchant context loads.
* Sidebar items are capability-gated.
* 401 redirects to `/merchant/login`.
* 403 shows Merchant Portal forbidden page.
* Arabic/English switching works.
* RTL/LTR layout works.

---

## Phase 2 — Dashboard, Profile, and Settings

### APIs

```text
GET /api/merchant-portal/dashboard/summary
GET /api/merchant-portal/profile
PUT /api/merchant-portal/profile
GET /api/merchant-portal/settings
PUT /api/merchant-portal/settings
```

### Screens

```text
/merchant/dashboard
/merchant/profile
/merchant/settings
```

### Tasks

1. Build Merchant Dashboard with cards:

   * total orders
   * shipments summary
   * pending/in transit/delivered
   * wallet summary if returned
   * recent activity if returned
2. Build Profile page:

   * merchant company info
   * contact info
   * address
   * update action if `profile.update`
3. Build Settings page:

   * notification preferences
   * portal preferences
   * language preference if supported
4. Do not show internal admin fields:

   * pricing plan internals unless backend returns them as portal-safe
   * internal notes
   * internal finance configuration

### Acceptance Criteria

* Dashboard loads merchant-scoped summary.
* Profile is portal-safe.
* Settings update works if capability allows.
* No admin-only data appears.

---

## Phase 3 — Orders

### APIs

```text
GET /api/merchant-portal/orders
POST /api/merchant-portal/orders
GET /api/merchant-portal/orders/{order}
PUT /api/merchant-portal/orders/{order}
POST /api/merchant-portal/orders/{order}/confirm
POST /api/merchant-portal/orders/{order}/cancel
GET /api/merchant-portal/orders/{order}/label
```

### Screens

```text
/merchant/orders
/merchant/orders/create
/merchant/orders/:orderId
/merchant/orders/:orderId/edit
```

### Allowed filters

```text
date_from
date_to
status
fulfillment_type
payment_type
order_type
customer_phone
order_number
search
has_shipment
warehouse_fulfillment_status
delivery_governorate_id
delivery_area_id
```

### Forbidden inputs

```text
merchant_id
source
status
requires_review
review_reason
external_source
external_order_id
external_order_number
warehouse_fulfillment_status
```

### Tasks

1. Build Orders list with filters.
2. Build Create Order form.
3. Build Edit Order form.
4. Build Order Details.
5. Add confirm action if `orders.confirm`.
6. Add cancel action if `orders.cancel`.
7. Add label print if `labels.print`.
8. Support packaging fields if backend supports them:

   * `requires_packaging`
   * `package_notes`
   * `packaging_items[]`
   * `total_packaging_fee`
9. Do not send `merchant_id`.
10. Do not allow merchant to set internal fields.

### Acceptance Criteria

* Merchant can list own orders.
* Merchant can create order without merchant_id.
* Merchant can edit only when backend allows.
* Merchant can confirm/cancel only when backend allows.
* Label printing works.
* Backend 422 field errors are shown.
* No cross-merchant access.

---

## Phase 4 — Shipments and Tracking

### APIs

```text
GET /api/merchant-portal/shipments
GET /api/merchant-portal/shipments/{shipment}
GET /api/merchant-portal/shipments/{shipment}/tracking
GET /api/merchant-portal/shipments/{shipment}/label
GET /api/merchant-portal/shipments/{shipment}/waybill
```

### Screens

```text
/merchant/shipments
/merchant/shipments/:shipmentId
/merchant/shipments/:shipmentId/tracking
```

### Allowed filters

```text
date_from
date_to
status
shipment_number
search
customer_phone
payment_type
cod_only
delivery_governorate_id
delivery_area_id
has_driver
```

### Forbidden inputs

```text
merchant_id
driver_id
assigned_driver_id
```

### Tasks

1. Build Shipments list.
2. Build Shipment Details.
3. Build Tracking tab/section.
4. Add label and waybill actions if `labels.print`.
5. Keep shipments read-only.
6. Do not expose internal mutation actions:

   * assign driver
   * update status
   * complete delivery
   * delivery attempt
   * manifest actions

### Acceptance Criteria

* Merchant sees only own shipments.
* Merchant can track shipments.
* Merchant can print label/waybill if allowed.
* No shipment mutation actions exist.

---

## Phase 5 — Warehouse Portal

### APIs

```text
POST /api/merchant-portal/warehouse/products/labels/bulk
GET /api/merchant-portal/warehouse/products
GET /api/merchant-portal/warehouse/products/{warehouseProduct}
GET /api/merchant-portal/warehouse/products/{warehouseProduct}/label

GET /api/merchant-portal/warehouse/inventory
GET /api/merchant-portal/warehouse/inventory/low-stock
GET /api/merchant-portal/warehouse/inventory/{inventoryStock}

GET /api/merchant-portal/warehouse/movements
GET /api/merchant-portal/warehouse/charges

GET /api/merchant-portal/warehouse/inbound-requests
POST /api/merchant-portal/warehouse/inbound-requests
GET /api/merchant-portal/warehouse/inbound-requests/{inboundRequest}
POST /api/merchant-portal/warehouse/inbound-requests/{inboundRequest}/cancel
```

### Screens

```text
/merchant/warehouse/products
/merchant/warehouse/products/:productId
/merchant/warehouse/inventory
/merchant/warehouse/inventory/low-stock
/merchant/warehouse/inventory/:stockId
/merchant/warehouse/movements
/merchant/warehouse/charges
/merchant/warehouse/inbound-requests
/merchant/warehouse/inbound-requests/create
/merchant/warehouse/inbound-requests/:requestId
```

### Core rules

1. No `merchant_id`.
2. Warehouse products, inventory, movements, and charges are merchant-scoped.
3. Stock movements are read-only.
4. Warehouse charges are read-only.
5. Inbound requests do not increase inventory directly.
6. Inventory increases only after internal warehouse staff confirms a real warehouse receipt.

### Tasks

1. Build product list/details.
2. Add product label and bulk labels if `labels.print`.
3. Build inventory list/details.
4. Add low stock screen.
5. Build stock movements list.
6. Build warehouse charges list.
7. Build inbound requests list/details/create/cancel.
8. Add filters according to API docs.
9. Add clean status badges and empty states.

### Acceptance Criteria

* Merchant can view own products/inventory/movements/charges.
* Merchant can create inbound request.
* Merchant can cancel allowed inbound request.
* Merchant cannot adjust stock.
* Merchant cannot confirm receipt.
* Merchant cannot create stock movement.

---

## Phase 6 — Finance Portal

### APIs

```text
GET /api/merchant-portal/finance/summary
GET /api/merchant-portal/finance/wallet/summary
GET /api/merchant-portal/finance/wallet/transactions
GET /api/merchant-portal/finance/wallet/transactions/{transaction}

GET /api/merchant-portal/finance/invoices
GET /api/merchant-portal/finance/invoices/{invoice}
GET /api/merchant-portal/finance/invoices/{invoice}/preview
GET /api/merchant-portal/finance/invoices/{invoice}/download

GET /api/merchant-portal/finance/payouts
GET /api/merchant-portal/finance/payouts/{payout}
POST /api/merchant-portal/finance/payouts/request
```

### Screens

```text
/merchant/finance
/merchant/finance/wallet
/merchant/finance/wallet/transactions
/merchant/finance/wallet/transactions/:transactionId
/merchant/finance/invoices
/merchant/finance/invoices/:invoiceId
/merchant/finance/payouts
/merchant/finance/payouts/:payoutId
/merchant/finance/payouts/request
```

### Rules

Merchant finance is read-only except payout request.

Merchant cannot:

* create wallet transactions
* approve/reject wallet transactions
* create/update/delete invoices
* approve/reject/complete payouts
* view company profit summaries
* view reconciliation-only internal finance data

### Tasks

1. Build finance summary.
2. Build wallet summary.
3. Build wallet transactions list/details.
4. Build invoice list/details.
5. Add invoice preview/download.
6. Build payout list/details.
7. Add payout request form.
8. Use MoneyDisplay.
9. Do not calculate balances on frontend.

### Acceptance Criteria

* Merchant sees finance data only for own merchant.
* Merchant can request payout if capability allows.
* Merchant cannot approve or complete payout.
* Invoices can be viewed/downloaded if allowed.
* No internal finance data is exposed.

---

## Phase 7 — Integrations

### APIs

```text
GET /api/merchant-portal/integration-tokens
POST /api/merchant-portal/integration-tokens
GET /api/merchant-portal/integration-tokens/{token}
POST /api/merchant-portal/integration-tokens/{token}/revoke
DELETE /api/merchant-portal/integration-tokens/{token}
GET /api/merchant-portal/integrations/docs
POST /api/merchant-portal/integrations/test
```

### Screens

```text
/merchant/integrations
/merchant/integrations/tokens
/merchant/integrations/docs
```

### Rules

1. Raw token is shown once only.
2. Do not store raw token.
3. Revoke/delete actions require integration management capability.
4. Integration docs are read-only.

### Acceptance Criteria

* Merchant can create token if allowed.
* Raw token copy flow is clear.
* Merchant can revoke/delete own tokens.
* Integration test works.
* No admin token APIs are used.

---

## Phase 8 — Exports, Attachments, Notifications

### Export APIs

```text
GET /api/merchant-portal/exports/types
POST /api/merchant-portal/exports
GET /api/merchant-portal/exports
GET /api/merchant-portal/exports/{export}
GET /api/merchant-portal/exports/{export}/download
```

### Attachment APIs

```text
GET /api/merchant-portal/attachments
POST /api/merchant-portal/attachments
GET /api/merchant-portal/attachments/{attachment}
GET /api/merchant-portal/attachments/{attachment}/download
DELETE /api/merchant-portal/attachments/{attachment}
```

### Notification APIs

```text
GET /api/merchant-portal/notifications
GET /api/merchant-portal/notifications/unread-count
POST /api/merchant-portal/notifications/{notification}/mark-read
POST /api/merchant-portal/notifications/mark-all-read
```

### Screens

```text
/merchant/exports
/merchant/exports/:exportId
/merchant/attachments
/merchant/notifications
```

### Tasks

1. Build export types and export history.
2. Build export generation flow.
3. Build export download.
4. Build attachment list/upload/download/delete.
5. Build notifications list.
6. Add unread count to topbar.
7. Add mark-read and mark-all-read.

### Acceptance Criteria

* Exports are merchant-scoped.
* Attachments are merchant-scoped.
* Notifications are merchant-scoped.
* Unread count updates after marking read.

---

## Phase 9 — Merchant Store / Catalog

### Current expected route

```text
/merchant/store
```

### Important note

This page is informational only in the current backend phase.

Do not build:

* cart
* checkout
* payment flow
* purchase flow
* add to cart
* buy button

### Possible APIs

```text
GET /api/merchant-shop/catalog
GET /api/merchant-shop/pricing
```

### Required backend confirmation

Before implementation, confirm whether these APIs are valid for merchant portal authentication or whether backend needs merchant portal aliases such as:

```text
GET /api/merchant-portal/store/catalog
GET /api/merchant-portal/store/pricing
```

### Tasks

1. Build only after API access is confirmed.
2. Show merchant-visible packaging products and service catalog entries.
3. Show storage and pick-pack pricing references if backend returns them.
4. Keep the page read-only.

### Acceptance Criteria

* Merchant can view catalog/service info.
* No purchase actions exist.
* Page respects merchant shop settings.

---


## Phase 10 — Final QA, Hardening, Localization, and Responsive Polish
- **API isolation audit**: Passed
- **merchant_id safety audit**: Passed
- **capability gates audit**: Passed
- **UI/UX consistency audit**: Passed
- **Dashboard final review**: Passed
- **Forms final review**: Passed
- **Details pages final review**: Passed
- **Localization final review**: Passed
- **Responsive final review**: Passed
- **Security/sensitive display review**: Passed
- **Download/print flows review**: Passed
- **Browser QA status**: Needs Browser QA


## Phase 10 — Localization, RTL, QA, and Docs

### Tasks

1. Add English/Arabic translations for every portal page.
2. Ensure RTL alignment is clean.
3. Ensure mobile width 390px works.
4. Ensure all forms handle 422 field errors.
5. Ensure 401/403/404 states are clean.
6. Ensure no admin endpoints are used.
7. Ensure no `merchant_id` is sent.
8. Update docs after every phase.

### Required docs

```text
docs/MERCHANT_PORTAL_IMPLEMENTATION_PLAN.md
docs/MERCHANT_PORTAL_FRONTEND_IMPLEMENTATION_CHECKLIST.md
docs/MERCHANT_PORTAL_API_USAGE_MATRIX.md
docs/MERCHANT_PORTAL_CAPABILITY_MATRIX.md
```

---

## API Usage Matrix

| Module             | Endpoints                                  | Screens              | Capabilities                                     | Notes                          |
| ------------------ | ------------------------------------------ | -------------------- | ------------------------------------------------ | ------------------------------ |
| Context            | GET /api/merchant-portal/me                | Shell, topbar        | authenticated merchant membership                | Required on boot               |
| Profile            | GET/PUT /api/merchant-portal/profile       | Profile              | profile.view, profile.update                     | Portal-safe merchant data      |
| Settings           | GET/PUT /api/merchant-portal/settings      | Settings             | settings.view, settings.update                   | Portal preferences             |
| Dashboard          | GET /api/merchant-portal/dashboard/summary | Dashboard            | dashboard.view                                   | Merchant-scoped summary        |
| Orders             | GET/POST/GET one/PUT/confirm/cancel/label  | Orders               | orders.* + labels.print                          | No merchant_id                 |
| Shipments          | GET/GET one/tracking/label/waybill         | Shipments            | shipments.view + labels.print                    | Read-only                      |
| Warehouse Products | products endpoints                         | Warehouse Products   | warehouse.view + labels.print                    | No stock adjustment            |
| Inventory          | inventory endpoints                        | Inventory            | warehouse.view                                   | Read-only                      |
| Movements          | GET movements                              | Stock Movements      | warehouse.view                                   | Internal notes hidden          |
| Charges            | GET charges                                | Warehouse Charges    | warehouse.view                                   | Read-only                      |
| Inbound Requests   | list/create/detail/cancel                  | Inbound Requests     | warehouse.inbound_requests.*                     | Does not affect stock directly |
| Finance            | finance summary/wallet/invoices/payouts    | Finance              | finance.view, wallet.view, invoices.*, payouts.* | Only payout request mutates    |
| Integrations       | portal integration token endpoints         | Integrations         | integrations.view/manage                         | Raw token once only            |
| Exports            | portal export endpoints                    | Exports              | exports.*                                        | Merchant-scoped                |
| Attachments        | portal attachment endpoints                | Attachments          | attachments.*                                    | Merchant-scoped                |
| Notifications      | notification endpoints                     | Notifications/topbar | notifications.view                               | Unread count                   |

---

## Global Do / Do Not

### Do

* Use `/api/merchant-portal/*`.
* Use merchant capabilities from `/api/merchant-portal/me`.
* Reuse admin components safely.
* Keep portal UI professional like admin.
* Show only merchant-scoped data.
* Localize all labels.
* Add good empty/loading/error states.
* Run `npm run build` after each phase.

### Do Not

* Do not use admin APIs for portal data.
* Do not send `merchant_id`.
* Do not expose internal admin actions.
* Do not calculate financial balances on frontend.
* Do not expose raw token after creation.
* Do not build cart/checkout/payment.
1. Raw token is shown once only.
2. Do not store raw token.
3. Revoke/delete actions require integration management capability.
4. Integration docs are read-only.

### Acceptance Criteria

* Merchant can create token if allowed.
* Raw token copy flow is clear.
* Merchant can revoke/delete own tokens.
* Integration test works.
* No admin token APIs are used.

---

## Phase 8 — Exports, Attachments, Notifications

### Export APIs

```text
GET /api/merchant-portal/exports/types
POST /api/merchant-portal/exports
GET /api/merchant-portal/exports
GET /api/merchant-portal/exports/{export}
GET /api/merchant-portal/exports/{export}/download
```

### Attachment APIs

```text
GET /api/merchant-portal/attachments
POST /api/merchant-portal/attachments
GET /api/merchant-portal/attachments/{attachment}
GET /api/merchant-portal/attachments/{attachment}/download
DELETE /api/merchant-portal/attachments/{attachment}
```

### Notification APIs

```text
GET /api/merchant-portal/notifications
GET /api/merchant-portal/notifications/unread-count
POST /api/merchant-portal/notifications/{notification}/mark-read
POST /api/merchant-portal/notifications/mark-all-read
```

### Screens

```text
/merchant/exports
/merchant/exports/:exportId
/merchant/attachments
/merchant/notifications
```

### Tasks

1. Build export types and export history.
2. Build export generation flow.
3. Build export download.
4. Build attachment list/upload/download/delete.
5. Build notifications list.
6. Add unread count to topbar.
7. Add mark-read and mark-all-read.

### Acceptance Criteria

* Exports are merchant-scoped.
* Attachments are merchant-scoped.
* Notifications are merchant-scoped.
* Unread count updates after marking read.

---

## Phase 9 — Merchant Store / Catalog

### Current expected route

```text
/merchant/store
```

### Important note

This page is informational only in the current backend phase.

Do not build:

* cart
* checkout
* payment flow
* purchase flow
* add to cart
* buy button

### Possible APIs

```text
GET /api/merchant-shop/catalog
GET /api/merchant-shop/pricing
```

### Required backend confirmation

Before implementation, confirm whether these APIs are valid for merchant portal authentication or whether backend needs merchant portal aliases such as:

```text
GET /api/merchant-portal/store/catalog
GET /api/merchant-portal/store/pricing
```

### Tasks

1. Build only after API access is confirmed.
2. Show merchant-visible packaging products and service catalog entries.
3. Show storage and pick-pack pricing references if backend returns them.
4. Keep the page read-only.

### Acceptance Criteria

* Merchant can view catalog/service info.
* No purchase actions exist.
* Page respects merchant shop settings.

---

## Phase 10 — Localization, RTL, QA, and Docs

### Tasks

1. Add English/Arabic translations for every portal page.
2. Ensure RTL alignment is clean.
3. Ensure mobile width 390px works.
4. Ensure all forms handle 422 field errors.
5. Ensure 401/403/404 states are clean.
6. Ensure no admin endpoints are used.
7. Ensure no `merchant_id` is sent.
8. Update docs after every phase.

### Required docs

```text
docs/MERCHANT_PORTAL_IMPLEMENTATION_PLAN.md
docs/MERCHANT_PORTAL_FRONTEND_IMPLEMENTATION_CHECKLIST.md
docs/MERCHANT_PORTAL_API_USAGE_MATRIX.md
docs/MERCHANT_PORTAL_CAPABILITY_MATRIX.md
```

---

## API Usage Matrix

| Module             | Endpoints                                  | Screens              | Capabilities                                     | Notes                          |
| ------------------ | ------------------------------------------ | -------------------- | ------------------------------------------------ | ------------------------------ |
| Context            | GET /api/merchant-portal/me                | Shell, topbar        | authenticated merchant membership                | Required on boot               |
| Profile            | GET/PUT /api/merchant-portal/profile       | Profile              | profile.view, profile.update                     | Portal-safe merchant data      |
| Settings           | GET/PUT /api/merchant-portal/settings      | Settings             | settings.view, settings.update                   | Portal preferences             |
| Dashboard          | GET /api/merchant-portal/dashboard/summary | Dashboard            | dashboard.view                                   | Merchant-scoped summary        |
| Orders             | GET/POST/GET one/PUT/confirm/cancel/label  | Orders               | orders.* + labels.print                          | No merchant_id                 |
| Shipments          | GET/GET one/tracking/label/waybill         | Shipments            | shipments.view + labels.print                    | Read-only                      |
| Warehouse Products | products endpoints                         | Warehouse Products   | warehouse.view + labels.print                    | No stock adjustment            |
| Inventory          | inventory endpoints                        | Inventory            | warehouse.view                                   | Read-only                      |
| Movements          | GET movements                              | Stock Movements      | warehouse.view                                   | Internal notes hidden          |
| Charges            | GET charges                                | Warehouse Charges    | warehouse.view                                   | Read-only                      |
| Inbound Requests   | list/create/detail/cancel                  | Inbound Requests     | warehouse.inbound_requests.*                     | Does not affect stock directly |
| Finance            | finance summary/wallet/invoices/payouts    | Finance              | finance.view, wallet.view, invoices.*, payouts.* | Only payout request mutates    |
| Integrations       | portal integration token endpoints         | Integrations         | integrations.view/manage                         | Raw token once only            |
| Exports            | portal export endpoints                    | Exports              | exports.*                                        | Merchant-scoped                |
| Attachments        | portal attachment endpoints                | Attachments          | attachments.*                                    | Merchant-scoped                |
| Notifications      | notification endpoints                     | Notifications/topbar | notifications.view                               | Unread count                   |

---

## Global Do / Do Not

### Do

* Use `/api/merchant-portal/*`.
* Use merchant capabilities from `/api/merchant-portal/me`.
* Reuse admin components safely.
* Keep portal UI professional like admin.
* Show only merchant-scoped data.
* Localize all labels.
* Add good empty/loading/error states.
* Run `npm run build` after each phase.

### Do Not

* Do not use admin APIs for portal data.
* Do not send `merchant_id`.
* Do not expose internal admin actions.
* Do not calculate financial balances on frontend.
* Do not expose raw token after creation.
* Do not build cart/checkout/payment.
* Do not bypass capability checks.
* Do not hardcode merchant IDs.

---

## Current Status
- **Phase 1 (Merchant Portal App Shell)**: **IMPLEMENTED - NEEDS BROWSER QA**. The frontend routing, merchant authentication state, capability context (`MerchantPortalProvider`), API interceptors, and strict separation from Admin layout are operational.
- **Phase 2 (Dashboard, Profile, Settings)**: **IMPLEMENTED - NEEDS BROWSER QA**. Dashboard uses `/api/merchant-portal/dashboard/summary`. Profile and Settings pages are implemented with merchant-scoped editing, centralized translations, and shared shell/components.
- **Phase 3 (Orders)**: **IMPLEMENTED - NEEDS BROWSER QA**. Orders now use a single canonical implementation under `src/features/merchant-portal/orders`, with merchant-only list/create/details/edit pages, confirm/cancel actions, merchant label printing, localized UI, forbidden field stripping, and no admin endpoint usage in the Orders feature.
- **Phase 3 Notes**:
  - Implemented: merchant-safe location option endpoints now support dropdown selectors for merchant order delivery location fields:
    - `GET /api/merchant-portal/locations/governorates`
    - `GET /api/merchant-portal/locations/areas?governorate_id={id}`
  - Backend Gap: merchant-safe packaging lookup is still needed before editable packaging selection can be enabled in merchant order create/edit.
- **Phase 4 (Shipments)**: **IMPLEMENTED - NEEDS BROWSER QA**. The Shipments module now includes a read-only list with filtering and a detailed view with a tracking timeline. Admin layout and UI components (Cards, Tables, LabelDocumentDialog) are reused safely with isolated API fetches (`/api/merchant-portal/shipments`).
- **Phase 5 (Warehouse & Inventory)**: **IMPLEMENTED - NEEDS BROWSER QA**. The Warehouse module now includes list and detailed views for Products, Inventory Stocks, Low Stock, Stock Movements, Warehouse Charges, and Inbound Requests. UI patterns mirror Orders/Shipments using only safe `merchant-portal` endpoints.
- **Phase 6-10**: Pending implementation.

## UI/UX Polish Pass - Admin Portal Visual Alignment

- **Layout / Sidebar / Topbar**: **Improved - Needs Browser QA**. Merchant shell now uses the shared admin-grade app shell styling with merchant-specific topbar and sidebar identity copy.
- **Dashboard visual parity**: **Implemented - Needs Browser QA**. KPI cards, summary panels, empty/error/loading states, and quick actions were aligned to the admin dashboard style using shared cards and stat components.
- **Graph / chart parity**: **Implemented - Needs Browser QA**. The merchant dashboard now renders responsive charts derived safely from real dashboard summary fields using Recharts components, including Orders, Shipments, Finance, and Warehouse snapshots. No fake chart series are rendered.
- **Orders list parity**: **Improved - Needs Browser QA**. Filters, table container, actions, and empty/error/loading states were aligned with the admin orders experience, while keeping merchant-only endpoints and capability gates.
- **Order create / edit parity**: **Improved - Needs Browser QA**. Shared form layout and merchant-safe location dropdowns remain active, with payload sanitization and merchant-only APIs preserved.
- **Order details parity**: **Improved - Needs Browser QA**. Details cards, actions, payment/delivery mapping, packaging read-only display, and label flow use the admin visual language without switching to admin APIs.
- **Profile / Settings parity**: **Improved - Needs Browser QA**. Both screens now use shared detail-card, form-section, and state components instead of rough custom layouts.
- **Coming Soon modules**: **Improved - Needs Browser QA**. Non-implemented merchant modules remain placeholders but now render through a more polished shared empty-state pattern.
- **Shipments parity**: **Implemented - Needs Browser QA**. Shipments list now uses the page-sidebar-filters layout and data table parity. Shipment details uses the detail-cards-grid layout, identical to Orders.
- **Localization review**: **Implemented - Needs Browser QA**. New merchant portal UI copy was added to the centralized translations map for English and Arabic.
- **Data mapping fixes**: **Implemented - Needs Browser QA**. Merchant order details and edit hydration continue to use merchant-safe response unwrapping for customer, delivery, payment, and fulfillment data.
- **Remaining backend gaps**:
  - **Backend Gap**: merchant dashboard chart-ready series are still not returned by `/api/merchant-portal/dashboard/summary`.
  - **Backend Gap**: merchant-safe packaging lookup is still needed before editable packaging selection can be enabled.

## Phase 7 — Integrations & API Tokens

Statuses:

* Integrations API client/types: **Implemented**
* Integrations overview: **Implemented**
* Tokens list: **Implemented**
* Token create: **Implemented**
* Token details: **Implemented**
* Token revoke: **Implemented**
* Token delete: **Implemented**
* One-time token secret display: **Implemented**
* Integration docs panel: **Implemented**
* Integration test panel: **Implemented**
* Capability gates: **Implemented**
* Admin design alignment: **Implemented**
* Merchant modules visual parity: **Implemented**
* Localization: **Implemented**
* Responsive layout: **Implemented - Needs Browser QA**
* Build result: **Implemented**
* Browser QA status: **Needs Browser QA**
* Backend Gap: None identified, flexible shapes allow parsing docs and tests safely.


## Phase 9 — Store / Company Catalog
- **Store API client/types**: Backend Gap
- **Store route**: Implemented
- **Catalog section**: Backend Gap
- **Packaging products section**: Backend Gap
- **Storage pricing section**: Backend Gap
- **Pick & pack pricing section**: Backend Gap
- **Services section**: Backend Gap
- **Read-only restrictions**: Implemented
- **Capability gates**: Implemented
- **Admin design alignment**: Implemented (Empty State)
- **Localization**: Implemented
- **Browser QA status**: Needs Browser QA
