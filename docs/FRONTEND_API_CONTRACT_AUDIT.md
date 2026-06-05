# Frontend API Contract Audit

## 2026-04-26 New API Sync Note

The current route-list-based audit is now maintained in `docs/FRONTEND_NEW_API_SYNC_AUDIT.md`, using only `docs/api-documentation.md` and `docs/api-endpoints-list.md`. The new audit supersedes older root-level API documentation assumptions.

Newly corrected in frontend:
- `GET /api/orders` now uses documented server-side filters instead of local-only filtering.
- Order list/details now render `pickup_type`, shipment summary, and stock reservation status, and hide edit/delete after shipment creation.
- `GET /api/shipments/print-list` is implemented and used for print manifests.
- `POST /api/drivers/{driver}/cash-closures/generate` is implemented; create UI no longer sends `expected_amount`.
- `GET/PUT/DELETE /api/warehouses/{warehouse}`, `GET/PUT/DELETE /api/warehouse-products/{warehouseProduct}`, `GET /api/inventory-stocks/{inventoryStock}`, and `GET /api/stock-movements/{stockMovement}` clients/routes are implemented where the route list exposes them.

Source of truth: `api-documentation.md` only.

Audit date: 2026-04-26

Legend:
- `OK`: endpoint path/method/payload/response mapping/filters/UI flow match documented behavior.
- `PARTIAL`: client exists but UI is intentionally limited, or docs omit enough response detail to make strict typed mapping impossible.
- `MISSING`: endpoint has no frontend client/UI.
- `WRONG`: implementation contradicts the documented contract.
- `N/A`: not applicable for that endpoint.

| Endpoint | Method | API client exists? | Used in UI? | Request payload correct? | Response mapping correct? | Filters implemented? | UI flow correct? | Status | Notes |
|---|---:|---|---|---|---|---|---|---|---|
| `/api/auth/login` | POST | Yes | Yes | Yes | Yes | N/A | Yes | OK | `apiClient` base URL strips `/api`; frontend uses `/auth/login`. |
| `/api/auth/me` | GET | Yes | Yes | N/A | Yes | N/A | Yes | OK | Auth store consumes authenticated user. |
| `/api/auth/logout` | POST | Yes | Yes | Yes | Yes | N/A | Yes | OK | Logout flow uses documented method/path. |
| `/api/auth/ping` | GET | Yes | No | N/A | Yes | N/A | Diagnostic only | PARTIAL | Client exists; no UI needed for ping health check. |
| `/api/users` | GET | Yes | Yes | N/A | Yes | N/A | Yes | OK | Local search only; docs do not define server filters. |
| `/api/users` | POST | Yes | Yes | Yes | Yes | N/A | Yes | OK | User form fields match documented create fields. |
| `/api/users/{user}` | GET | Yes | Yes | N/A | Yes | N/A | Yes | OK | Details/edit pages use `response.data.data`. |
| `/api/users/{user}` | PUT | Yes | Yes | Yes | Yes | N/A | Yes | OK | Update payload is partial documented user fields. |
| `/api/users/{user}` | DELETE | Yes | Yes | N/A | Yes | N/A | Yes | OK | Delete action is RBAC guarded. |
| `/api/merchants` | GET | Yes | Yes | N/A | Yes | N/A | Yes | OK | Local search/status only; docs do not define server filters. |
| `/api/merchants` | POST | Yes | Yes | Yes | Yes | N/A | Yes | OK | Merchant form matches documented fields. |
| `/api/merchants/{merchant}` | GET | Yes | Yes | N/A | Yes | N/A | Yes | OK | Used by edit and detail route. |
| `/api/merchants/{merchant}` | PUT | Yes | Yes | Yes | Yes | N/A | Yes | OK | Update payload is partial documented merchant fields. |
| `/api/merchants/{merchant}` | DELETE | Yes | Yes | N/A | Yes | N/A | Yes | OK | Delete action is RBAC guarded. |
| `/api/governorates` | GET | Yes | Yes | N/A | Yes | N/A | Yes | OK | Local filters only; docs do not define server filters. |
| `/api/governorates` | POST | Yes | Yes | Yes | Yes | N/A | Yes | OK | Form matches `name`, `is_active`. |
| `/api/governorates/{governorate}` | GET | Yes | Yes | N/A | Yes | N/A | Yes | OK | Used by edit and read-only details. |
| `/api/governorates/{governorate}` | PUT | Yes | Yes | Yes | Yes | N/A | Yes | OK | Update form matches documented fields. |
| `/api/governorates/{governorate}` | DELETE | Yes | Yes | N/A | Yes | N/A | Yes | OK | Delete action is RBAC guarded. |
| `/api/areas` | GET | Yes | Yes | N/A | Yes | N/A | Yes | OK | Local filters only; docs do not define server filters. |
| `/api/areas` | POST | Yes | Yes | Yes | Yes | N/A | Yes | OK | Form matches `governorate_id`, `name`, `is_active`. |
| `/api/areas/{area}` | GET | Yes | Yes | N/A | Yes | N/A | Yes | OK | Used by edit and read-only details. |
| `/api/areas/{area}` | PUT | Yes | Yes | Yes | Yes | N/A | Yes | OK | Update form matches documented fields. |
| `/api/areas/{area}` | DELETE | Yes | Yes | N/A | Yes | N/A | Yes | OK | Delete action is RBAC guarded. |
| `/api/shipping-rates` | GET | Yes | Yes | N/A | Yes | N/A | Yes | OK | Local filters only; docs do not define server filters. |
| `/api/shipping-rates` | POST | Yes | Yes | Yes | Yes | N/A | Yes | OK | Form matches documented rate fields. |
| `/api/shipping-rates/{shippingRate}` | GET | Yes | Yes | N/A | Yes | N/A | Yes | OK | Used by edit and read-only details. |
| `/api/shipping-rates/{shippingRate}` | PUT | Yes | Yes | Yes | Yes | N/A | Yes | OK | Update form matches documented fields. |
| `/api/shipping-rates/{shippingRate}` | DELETE | Yes | Yes | N/A | Yes | N/A | Yes | OK | Delete action is RBAC guarded. |
| `/api/shipping-rates/calculate` | POST | Yes | Yes | Yes | Yes | N/A | Yes | OK | Calculator sends documented governorate/area fields. |
| `/api/orders` | GET | Yes | Yes | N/A | Yes | N/A | Yes | OK | Local search/status retained because docs do not define order query filters. |
| `/api/orders` | POST | Yes | Yes | Yes | Yes | N/A | Yes | OK | Create form omits server-generated fields and sends documented manual order body. |
| `/api/orders/{order}` | GET | Yes | Yes | N/A | Yes | N/A | Yes | OK | Details page maps `response.data.data`. |
| `/api/orders/{order}/confirm` | POST | Yes | Yes | Yes | Yes | N/A | Yes | OK | Confirm action exists and shows API errors for invalid states. |
| `/api/orders/{order}` | PUT | Yes | Yes | Yes | Yes | N/A | Yes | OK | Edit payload matches documented partial update fields. |
| `/api/orders/{order}` | DELETE | Yes | Yes | N/A | Yes | N/A | Yes | OK | `orders.delete` permission added; admin allowed through wildcard, non-admin roles are not granted by default. Delete is exposed on list and details with confirmation. |
| `/api/track/{shipment_number}` | GET | Yes | Yes | N/A | Yes | N/A | Yes | OK | Public tracking lookup maps `response.data.data`. |
| `/api/shipments` | GET | Yes | Yes | N/A | Yes | Yes | Yes | OK | UI now sends all documented filters: `status`, `merchant_id`, `assigned_driver_id`, delivery location IDs, dates, and `search`. |
| `/api/shipments/{shipment}` | GET | Yes | Yes | N/A | Yes | N/A | Yes | OK | Details page maps status histories safely. |
| `/api/orders/{order}/shipments` | POST | Yes | Yes | Yes | Yes | N/A | Yes | OK | UI now disables creation unless order is confirmed, not under review, and has items. |
| `/api/shipments/{shipment}/status` | PATCH | Yes | Yes | Yes | Yes | N/A | Yes | OK | Dialog sends `status` and required `notes`; options match documented statuses observed in docs. |
| `/api/shipments/{shipment}/assign-driver` | POST | Yes | Yes | Yes | Yes | N/A | Yes | OK | Form requires numeric `driver_id`. |
| `/api/drivers` | GET | Yes | Yes | N/A | Yes | N/A | Yes | OK | Local search only; docs do not define server filters. |
| `/api/drivers` | POST | Yes | Yes | Yes | Yes | N/A | Yes | OK | Driver form matches documented fields. |
| `/api/drivers/{driver}` | GET | Yes | Yes | N/A | Yes | N/A | Yes | OK | Used by edit/details. |
| `/api/drivers/{driver}` | PUT | Yes | Yes | Yes | Yes | N/A | Yes | OK | Update form matches documented fields. |
| `/api/drivers/{driver}` | DELETE | Yes | Yes | N/A | Yes | N/A | Yes | OK | Delete action is RBAC guarded. |
| `/api/merchants/{merchant}/dashboard/summary` | GET | Yes | Yes | N/A | Yes | Yes | Yes | OK | Merchant detail dashboard sends documented date/assigned-driver filters. |
| `/api/drivers/{driver}/shipments` | GET | Yes | Yes | N/A | Yes | N/A | Yes | OK | Driver details page lists assigned shipments. |
| `/api/drivers/{driver}/manifest` | GET | Yes | Yes | N/A | Yes | Yes | Yes | OK | UI sends documented `status` and `date` filters. |
| `/api/dashboard/summary` | GET | Yes | Yes | N/A | Yes | Yes | Yes | OK | UI sends documented date, merchant, and assigned-driver filters. |
| `/api/merchant-payouts` | GET | Yes | Yes | N/A | Yes | Yes | Yes | OK | List page uses documented query params. |
| `/api/merchant-payouts` | POST | Yes | Yes | Yes | Yes | N/A | Yes | OK | Form fields match documented body. |
| `/api/merchant-payouts/{merchantPayout}` | GET | Yes | Yes | N/A | Yes | N/A | Yes | OK | Generic finance detail maps `data`. |
| `/api/merchant-payouts/{merchantPayout}` | PUT | Yes | Yes | Yes | Yes | N/A | Yes | OK | Edit form uses documented payout fields. |
| `/api/merchant-payouts/{merchantPayout}` | DELETE | Yes | Yes | N/A | Yes | N/A | Yes | OK | Delete action is RBAC guarded. |
| `/api/merchants/{merchant}/finance/summary` | GET | Yes | Yes | N/A | Yes | Yes | Yes | OK | Merchant finance sub-route sends documented date filters only. |
| `/api/driver-cash-closures` | GET | Yes | Yes | N/A | Yes | Yes | Yes | OK | List page uses documented filters. |
| `/api/driver-cash-closures` | POST | Yes | Yes | Yes | Yes | N/A | Yes | OK | Form matches documented body; difference remains backend-calculated. |
| `/api/driver-cash-closures/{driverCashClosure}` | GET | Yes | Yes | N/A | Yes | N/A | Yes | OK | Finance detail uses documented response envelope. |
| `/api/driver-cash-closures/{driverCashClosure}` | PUT | Yes | Yes | Yes | Yes | N/A | Yes | OK | Edit form matches documented fields. |
| `/api/driver-cash-closures/{driverCashClosure}` | DELETE | Yes | Yes | N/A | Yes | N/A | Yes | OK | Delete action is RBAC guarded. |
| `/api/drivers/{driver}/cash-expected` | GET | Yes | Yes | N/A | Yes | N/A | Yes | OK | Driver details displays backend-calculated expected cash. |
| `/api/expenses` | GET | Yes | Yes | N/A | Yes | Yes | Yes | OK | List page uses documented filters. |
| `/api/expenses` | POST | Yes | Yes | Yes | Yes | N/A | Yes | OK | Form matches documented body. |
| `/api/expenses/{expense}` | GET | Yes | Yes | N/A | Yes | N/A | Yes | OK | Finance detail maps documented envelope. |
| `/api/expenses/{expense}` | PUT | Yes | Yes | Yes | Yes | N/A | Yes | OK | Edit form matches documented fields. |
| `/api/expenses/{expense}` | DELETE | Yes | Yes | N/A | Yes | N/A | Yes | OK | Delete action is RBAC guarded. |
| `/api/finance/company-profit-summary` | GET | Yes | Yes | N/A | Yes | Yes | Yes | OK | Client now sends only documented date filters. |
| `/api/merchant-invoices` | GET | Yes | Yes | N/A | Yes | Yes | Yes | OK | List page uses documented filters. |
| `/api/merchant-invoices` | POST | Yes | Yes | Yes | Yes | N/A | Yes | OK | Form matches documented body and lets backend calculate totals. |
| `/api/merchant-invoices/{merchantInvoice}` | GET | Yes | Yes | N/A | Yes | N/A | Yes | OK | Finance detail maps documented envelope. |
| `/api/merchant-invoices/{merchantInvoice}/preview` | GET | Yes | Yes | N/A | Yes | N/A | Yes | OK | Invoice detail displays preview section. |
| `/api/merchant-invoices/{merchantInvoice}/download` | GET | Yes | Yes | N/A | Blob | N/A | Yes | OK | Download action uses blob response. |
| `/api/merchant-invoices/{merchantInvoice}` | PUT | Yes | Yes | Yes | Yes | N/A | Yes | OK | Edit form uses documented invoice fields. |
| `/api/merchant-invoices/{merchantInvoice}` | DELETE | Yes | Yes | N/A | Yes | N/A | Yes | OK | Delete action is RBAC guarded. |
| `/api/finance/reconciliation-summary` | GET | Yes | Yes | N/A | Yes | Yes | Yes | OK | Client now sends only documented date filters. |
| `/api/finance/reports/overview` | GET | Yes | Yes | N/A | Yes | Yes | Yes | OK | Report page uses documented `date_from`, `date_to`, `merchant_id`, `driver_id`, `status`. |
| `/api/finance/reports/merchant/{merchant}` | GET | Yes | Yes | N/A | Defensive normalized `data` | N/A | Yes | OK | Docs provide no response schema; UI now normalizes scalar totals into summary cards and array records into labelled tables without raw JSON labels. |
| `/api/finance/reports/drivers` | GET | Yes | Yes | N/A | Yes | Yes | Yes | OK | Client filters to documented date/driver/status params only. |
| `/api/finance/reports/expenses` | GET | Yes | Yes | N/A | Defensive normalized `data` | N/A | Yes | OK | Docs provide no response schema; UI now normalizes scalar totals into summary cards and array records into labelled tables. |
| `/api/finance/reports/payouts` | GET | Yes | Yes | N/A | Defensive normalized `data` | N/A | Yes | OK | Docs provide no response schema; UI now normalizes scalar totals into summary cards and array records into labelled tables. |
| `/api/user` | GET | No | No | N/A | N/A | N/A | Not needed | PARTIAL | Default framework route duplicates authenticated-user behavior already covered by documented `/api/auth/me`; not used by app navigation. |
| `/api/warehouses` | GET | Yes | Yes | N/A | Yes | N/A | Yes | OK | List/form selectors use documented endpoint. |
| `/api/warehouses` | POST | Yes | Yes | Yes | Yes | N/A | Yes | OK | Form matches documented body. |
| `/api/warehouse-products` | GET | Yes | Yes | N/A | Yes | Yes | Yes | OK | List uses documented `merchant_id`, `status`, `search`. |
| `/api/warehouse-products` | POST | Yes | Yes | Yes | Yes | N/A | Yes | OK | Form matches documented body. |
| `/api/inventory-stocks` | GET | Yes | Yes | N/A | Yes | Yes | Yes | OK | List uses all documented filters. |
| `/api/inventory-stocks/adjust` | POST | Yes | Yes | Yes | Yes | N/A | Yes | OK | Stock adjustment form matches documented structure. |
| `/api/stock-movements` | GET | Yes | Yes | N/A | Yes | Yes | Yes | OK | List uses all documented filters. |
| `/api/merchants/{merchant}/warehouse/inventory` | GET | Yes | Yes | N/A | Yes | N/A | Yes | OK | Merchant warehouse sub-route displays inventory. |
| `/api/merchants/{merchant}/warehouse/movements` | GET | Yes | Yes | N/A | Yes | N/A | Yes | OK | Merchant warehouse sub-route displays movements. |
| `/api/warehouse-returns` | POST | Yes | Yes | Yes | Yes | N/A | Yes | OK | Return form matches documented fields. |
| `/api/warehouse-returns` | GET | Yes | Yes | N/A | Yes | Yes | Yes | OK | List uses all documented filters. |
| `/api/warehouse-returns/{warehouseReturn}` | GET | Yes | Yes | N/A | Yes | N/A | Yes | OK | Details page maps documented envelope. |
| `/api/warehouse-charges` | GET | Yes | Yes | N/A | Yes | Yes | Yes | OK | List uses all documented filters. |
| `/api/warehouse-charges` | POST | Yes | Yes | Yes | Yes | N/A | Yes | OK | Form now exposes optional order/shipment/product IDs and sends documented fields. |
| `/api/warehouse-charges/{warehouseCharge}` | GET | Yes | Yes | N/A | Yes | N/A | Yes | OK | Details/edit pages use documented envelope. |
| `/api/warehouse-charges/{warehouseCharge}` | PUT | Yes | Yes | Yes | Yes | N/A | Yes | OK | Edit form matches documented update fields. |
| `/api/warehouse-charges/{warehouseCharge}` | DELETE | Yes | Yes | N/A | Yes | N/A | Yes | OK | Delete action is RBAC guarded. |
| `/api/merchants/{merchant}/warehouse/charges` | GET | Yes | Yes | N/A | Yes | Yes | Yes | OK | Merchant detail sends documented date filters only; other filters are available on the warehouse charges list. |
| `/api/orders/{order}/reserve-stock` | POST | Yes | Yes | Yes | Yes | N/A | Yes | OK | Reservation dialog sends documented `warehouse_id` and `items`. |
| `/api/orders/{order}/release-stock` | POST | Yes | Yes | Yes | Yes | N/A | Yes | OK | Action exists and maps `data` array. |
| `/api/orders/{order}/fulfill-from-warehouse` | POST | Yes | Yes | Yes | Yes | N/A | Yes | OK | Action exists and maps `data` array. |
| `/api/orders/{order}/stock-reservations` | GET | Yes | Yes | N/A | Yes | N/A | Yes | OK | Order detail displays reservation rows. |
| `/api/stock-reservations` | GET | Yes | Yes | N/A | Yes | Yes | Yes | OK | List uses all documented filters. |

## Issues Fixed During Audit

- Added missing documented shipment filters: `merchant_id`, `assigned_driver_id`, `delivery_governorate_id`, and `delivery_area_id`.
- Enforced the documented order-to-shipment rule in UI: shipment creation is disabled unless the order is confirmed, not under review, and has at least one item.
- Corrected finance summary clients to avoid sending undocumented query params to company-profit and reconciliation summary endpoints.
- Corrected driver finance report params to exclude unrelated `merchant_id`.
- Added UI usage for finance expense, payout, and merchant report endpoints.
- Replaced raw finance report rendering with defensive summary-card and table normalization for undocumented report shapes.
- Added `orders.delete` permission and delete actions in orders list/details.
- Added optional `order_id` and `shipment_id` fields to warehouse charge form so the payload can match the documented charge body.
- Corrected merchant scoped finance/warehouse charge calls to avoid sending undocumented `assigned_driver_id`.

## Remaining Intentional Partials

- `/api/auth/ping`: client exists but no UI is needed.
- `/api/user`: intentionally not used because `/api/auth/me` is the documented app auth endpoint already consumed by the frontend.
