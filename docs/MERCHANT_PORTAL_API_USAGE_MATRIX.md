# Merchant Portal API Usage Matrix

This document outlines the API usage requirements, constraints, and security rules for every backend communication performed by the Merchant Portal.

## Global Security Guidelines
- **Always prefix API requests with `/api/merchant-portal/`** (except standard login/logout auth requests).
- **Never send `merchant_id`** in the request headers, query params, or body payloads. Scoping is handled automatically on the backend via authentication.
- **Enforce capability checks** on the frontend before calling endpoints and before showing corresponding UI components.

| Module | Endpoint | Method | Screen | Capability | Query Params Allowed | Forbidden Params | Mutation Allowed? | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Auth/Context** | `/api/auth/login` | `POST` | `/merchant/login` | None | None | `merchant_id` | Yes (Login) | Standard auth endpoint. |
| **Auth/Context** | `/api/merchant-portal/me` | `GET` | App Shell | None | None | `merchant_id` | No | Fetches authenticated user info, merchant info, role, and capabilities. Required on portal boot. |
| **Auth/Context** | `/api/auth/logout` | `POST` | App Shell | None | None | `merchant_id` | Yes (Logout) | Standard session clearance endpoint. |
| **Dashboard** | `/api/merchant-portal/dashboard/summary` | `GET` | `/merchant/dashboard` | `dashboard.view` | None | `merchant_id` | No | Fetches totals and summaries. |
| **Profile** | `/api/merchant-portal/profile` | `GET` | `/merchant/profile` | `profile.view` | None | `merchant_id` | No | Fetches company information. |
| **Profile** | `/api/merchant-portal/profile` | `PUT` | `/merchant/profile` | `profile.update` | None | `merchant_id` | Yes | Updates profile details. |
| **Settings** | `/api/merchant-portal/settings` | `GET` | `/merchant/settings` | `settings.view` | None | `merchant_id` | No | Fetches notifications and portal preferences. |
| **Settings** | `/api/merchant-portal/settings` | `PUT` | `/merchant/settings` | `settings.update` | None | `merchant_id` | Yes | Updates preferences. |
| **Orders** | `/api/merchant-portal/orders` | `GET` | `/merchant/orders` | `orders.view` | `date_from`, `date_to`, `status`, `fulfillment_type`, `payment_type`, `order_type`, `customer_phone`, `order_number`, `search`, `has_shipment`, `warehouse_fulfillment_status`, `delivery_governorate_id`, `delivery_area_id` | `merchant_id`, `source`, `requires_review` | No | Lists merchant's orders. |
| **Orders** | `/api/merchant-portal/orders` | `POST` | `/merchant/orders/create` | `orders.create` | None | `merchant_id`, `status`, `source`, `requires_review`, `review_reason`, `external_source`, `external_order_id`, `external_order_number`, `warehouse_fulfillment_status` | Yes | Creates an order. Submit payload sends only location IDs and does not send packaging selection fields. |
| **Orders** | `/api/merchant-portal/orders/{id}` | `GET` | `/merchant/orders/:orderId` | `orders.view` | None | `merchant_id` | No | Gets details of a specific order. |
| **Orders** | `/api/merchant-portal/orders/{id}` | `PUT` | `/merchant/orders/:orderId/edit` | `orders.update` | None | `merchant_id`, `status`, `source`, `requires_review`, `review_reason`, `external_source`, `external_order_id`, `external_order_number`, `warehouse_fulfillment_status` | Yes | Edits an order. Submit payload sends only location IDs and does not send packaging selection fields. |
| **Orders** | `/api/merchant-portal/orders/{id}/confirm` | `POST` | `/merchant/orders/:orderId` | `orders.confirm` | None | `merchant_id` | Yes | Confirms a draft order. |
| **Orders** | `/api/merchant-portal/orders/{id}/cancel` | `POST` | `/merchant/orders/:orderId` | `orders.cancel` | None | `merchant_id` | Yes | Cancels an order. |
| **Orders** | `/api/merchant-portal/orders/{id}/label` | `GET` | `/merchant/orders/:orderId` | `labels.print` | None | `merchant_id` | No | Prints order label. |
| **Orders** | `/api/merchant-portal/locations/governorates` | `GET` | `/merchant/orders/create`, `/merchant/orders/:orderId/edit`, `/merchant/orders` | `orders.view` / `orders.create` / `orders.update` | None | `merchant_id` | No | Merchant-safe governorate options for order forms and order list filters. |
| **Orders** | `/api/merchant-portal/locations/areas` | `GET` | `/merchant/orders/create`, `/merchant/orders/:orderId/edit`, `/merchant/orders` | `orders.view` / `orders.create` / `orders.update` | `governorate_id` | `merchant_id` | No | Merchant-safe area options keyed by selected governorate for forms and order list filters. |
| **Shipments** | `/api/merchant-portal/shipments` | `GET` | `/merchant/shipments` | `shipments.view` | `date_from`, `date_to`, `status`, `shipment_number`, `search`, `customer_phone`, `payment_type`, `cod_only`, `delivery_governorate_id`, `delivery_area_id`, `has_driver` | `merchant_id`, `driver_id` | No | Lists shipments. Shipments are read-only. |
| **Shipments** | `/api/merchant-portal/shipments/{id}` | `GET` | `/merchant/shipments/:shipmentId` | `shipments.view` | None | `merchant_id` | No | Gets shipment details. |
| **Shipments** | `/api/merchant-portal/shipments/{id}/tracking` | `GET` | `/merchant/shipments/:shipmentId` | `shipments.view` | None | `merchant_id` | No | Gets tracking events. |
| **Shipments** | `/api/merchant-portal/shipments/{id}/label` | `GET` | `/merchant/shipments/:shipmentId` | `labels.print` | None | `merchant_id` | No | Prints shipment label. |
| **Shipments** | `/api/merchant-portal/shipments/{id}/waybill` | `GET` | `/merchant/shipments/:shipmentId` | `labels.print` | None | `merchant_id` | No | Prints waybill. |
| **Warehouse** | `/api/merchant-portal/warehouse/products` | `GET` | `/merchant/warehouse/products` | `warehouse.view` | `search`, `status` | `merchant_id` | No | Lists products. Read-only list. |
| **Warehouse** | `/api/merchant-portal/warehouse/products/{id}` | `GET` | `/merchant/warehouse/products/:productId` | `warehouse.view` | None | `merchant_id` | No | Gets product details. |
| **Warehouse** | `/api/merchant-portal/warehouse/products/{id}/label` | `GET` | `/merchant/warehouse/products/:productId` | `labels.print` | None | `merchant_id` | No | Prints product barcode. |
| **Warehouse** | `/api/merchant-portal/warehouse/products/labels/bulk` | `POST` | `/merchant/warehouse/products` | `labels.print` | None | `merchant_id` | Yes (bulk request) | Bulk barcode prints. |
| **Warehouse** | `/api/merchant-portal/warehouse/inventory` | `GET` | `/merchant/warehouse/inventory` | `warehouse.view` | `search`, `warehouse_id` | `merchant_id` | No | Lists product stocks. |
| **Warehouse** | `/api/merchant-portal/warehouse/inventory/low-stock` | `GET` | `/merchant/warehouse/inventory/low-stock` | `warehouse.view` | `warehouse_id` | `merchant_id` | No | Lists low stock items. |
| **Warehouse** | `/api/merchant-portal/warehouse/movements` | `GET` | `/merchant/warehouse/movements` | `warehouse.view` | `date_from`, `date_to`, `warehouse_product_id` | `merchant_id` | No | Lists stock log. Read-only. |
| **Warehouse** | `/api/merchant-portal/warehouse/charges` | `GET` | `/merchant/warehouse/charges` | `warehouse.view` | `date_from`, `date_to`, `type` | `merchant_id` | No | Lists charges (pick/pack, storage). |
| **Warehouse** | `/api/merchant-portal/warehouse/inbound-requests` | `GET` | `/merchant/warehouse/inbound-requests` | `warehouse.inbound_requests.view` | `status`, `date_from`, `date_to` | `merchant_id` | No | Lists stock inbound requests. |
| **Warehouse** | `/api/merchant-portal/warehouse/inbound-requests` | `POST` | `/merchant/warehouse/inbound-requests/create` | `warehouse.inbound_requests.create` | None | `merchant_id` | Yes | Submits stock request. |
| **Warehouse** | `/api/merchant-portal/warehouse/inbound-requests/{id}` | `GET` | `/merchant/warehouse/inbound-requests/:requestId` | `warehouse.inbound_requests.view` | None | `merchant_id` | No | Gets stock request details. |
| **Warehouse** | `/api/merchant-portal/warehouse/inbound-requests/{id}/cancel` | `POST` | `/merchant/warehouse/inbound-requests/:requestId` | `warehouse.inbound_requests.cancel` | None | `merchant_id` | Yes | Cancels stock request. |
| **Finance** | `/api/merchant-portal/finance/summary` | `GET` | `/merchant/finance` | `finance.view` | None | `merchant_id` | No | Financial stats summary. |
| **Finance** | `/api/merchant-portal/finance/wallet/summary` | `GET` | `/merchant/finance` | `wallet.view` | None | `merchant_id` | No | Wallet balance. |
| **Finance** | `/api/merchant-portal/finance/wallet/transactions` | `GET` | `/merchant/finance` | `wallet.view` | `date_from`, `date_to`, `type` | `merchant_id` | No | Transaction list. Read-only. |
| **Finance** | `/api/merchant-portal/finance/invoices` | `GET` | `/merchant/finance/invoices` | `invoices.view` | `status`, `date_from`, `date_to` | `merchant_id` | No | Lists invoices. |
| **Finance** | `/api/merchant-portal/finance/invoices/{id}/download` | `GET` | `/merchant/finance/invoices` | `invoices.download` | None | `merchant_id` | No | Downloads PDF invoice. |
| **Finance** | `/api/merchant-portal/finance/payouts` | `GET` | `/merchant/finance/payouts` | `payouts.view` | `status` | `merchant_id` | No | Lists payouts. |
| **Finance** | `/api/merchant-portal/finance/payouts/request` | `POST` | `/merchant/finance/payouts/request` | `payouts.request` | None | `merchant_id` | Yes | Requests wallet withdrawal. |
| **Integrations** | `/api/merchant-portal/integration-tokens` | `GET` | `/merchant/integrations` | `integrations.view` | None | `merchant_id` | No | Lists active tokens. |
| **Integrations** | `/api/merchant-portal/integration-tokens` | `POST` | `/merchant/integrations` | `integrations.manage` | None | `merchant_id` | Yes | Generates token (raw visible once). |
| **Integrations** | `/api/merchant-portal/integration-tokens/{id}/revoke` | `POST` | `/merchant/integrations` | `integrations.manage` | None | `merchant_id` | Yes | Revokes integration token. |
| **Exports** | `/api/merchant-portal/exports` | `GET` | `/merchant/exports` | `exports.view` | None | `merchant_id` | No | Lists generated CSV/Excel files. |
| **Exports** | `/api/merchant-portal/exports` | `POST` | `/merchant/exports` | `exports.create` | None | `merchant_id` | Yes | Requests new report export. |
| **Exports** | `/api/merchant-portal/exports/{id}/download` | `GET` | `/merchant/exports` | `exports.download` | None | `merchant_id` | No | Downloads generated file. |
| **Attachments** | `/api/merchant-portal/attachments` | `GET` | `/merchant/attachments` | `attachments.view` | None | `merchant_id` | No | Lists uploaded files. |
| **Attachments** | `/api/merchant-portal/attachments` | `POST` | `/merchant/attachments` | `attachments.upload` | None | `merchant_id` | Yes | Uploads merchant file (PDF/Image). |
| **Attachments** | `/api/merchant-portal/attachments/{id}/download` | `GET` | `/merchant/attachments` | `attachments.download` | None | `merchant_id` | No | Downloads attachment. |
| **Attachments** | `/api/merchant-portal/attachments/{id}` | `DELETE` | `/merchant/attachments` | `attachments.delete` | None | `merchant_id` | Yes | Deletes attachment. |
| **Notifications** | `/api/merchant-portal/notifications` | `GET` | `/merchant/notifications` | `notifications.view` | None | `merchant_id` | No | Lists notifications. |
| **Notifications** | `/api/merchant-portal/notifications/unread-count` | `GET` | App Shell | `notifications.view` | None | `merchant_id` | No | Unread counter for topbar. |
| **Notifications** | `/api/merchant-portal/notifications/{id}/mark-read` | `POST` | App Shell / list | `notifications.view` | None | `merchant_id` | Yes | Marks notification as read. |
| **Notifications** | `/api/merchant-portal/notifications/mark-all-read` | `POST` | App Shell / list | `notifications.view` | None | `merchant_id` | Yes | Marks all notifications as read. |
| **Store** | `/api/merchant-shop/catalog` | `GET` | `/merchant/store` | None | None | `merchant_id` | No | Informational services catalog. |

## Phase 3 Backend Gaps

- Merchant Orders create/edit and order list location selectors now use merchant-safe location APIs:
  - `GET /api/merchant-portal/locations/governorates`
  - `GET /api/merchant-portal/locations/areas?governorate_id={id}`
- Merchant-safe packaging lookup is still needed before editable packaging selection can be enabled in merchant order create/edit.

## UI/UX Polish Pass - Admin Portal Visual Alignment

- **Implemented - Needs Browser QA**: Merchant dashboard, profile, settings, orders list, order details, and merchant shell continue to use only merchant-scoped endpoints while adopting shared admin-grade cards, tables, filters, and state components.
- **Partial**: Merchant dashboard chart parity remains limited by the current `/api/merchant-portal/dashboard/summary` response shape, which does not yet return chart-ready series.

## 8. Integrations (`src/features/merchant-portal/integrations/api/merchantPortalIntegrations.api.ts`)
| Endpoint | Method | Safe? | Description |
| :--- | :--- | :--- | :--- |
| `/api/merchant-portal/integration-tokens` | GET | Yes | Lists tokens without `merchant_id` in request body. |
| `/api/merchant-portal/integration-tokens/{token}` | GET | Yes | Fetches token details. |
| `/api/merchant-portal/integration-tokens` | POST | Yes | Creates token securely. Returns `plain_token` once. |
| `/api/merchant-portal/integration-tokens/{token}/revoke` | POST | Yes | Revokes token. |
| `/api/merchant-portal/integration-tokens/{token}` | DELETE | Yes | Deletes token. |
| `/api/merchant-portal/integrations/docs` | GET | Yes | Fetches API docs for merchant. |
| `/api/merchant-portal/integrations/test` | POST | Yes | Runs test endpoint securely. |
