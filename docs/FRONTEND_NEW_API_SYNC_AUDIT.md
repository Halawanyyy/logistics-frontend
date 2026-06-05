# Frontend New API Sync Audit

## 2026-05-23 Admin Frontend Sync Note

The April 26 sync below is no longer sufficient as the primary implementation record. The current source of truth for the new admin alignment work is now:

- `docs/FRONTEND_FULL_API_FLOW_IMPLEMENTATION_CHECKLIST.md`
- `docs/FRONTEND_FULL_API_FLOW_IMPLEMENTATION_AUDIT.md`

This repo has since been updated to add:

- `/admin/*` canonical route structure with redirects from legacy unprefixed paths
- backend-permission-aware RBAC fallback logic
- Roles & Permissions admin pages
- Settings admin page with dynamic group rendering
- Pricing Plans and Pricing Plan Rates admin pages
- merchant `pricing_plan_id` form support

Remaining gaps are now tracked in the newer full audit/checklist files rather than this older sync log.

Source of truth: `docs/api-documentation.md` and `docs/api-endpoints-list.md` only. `api-documentation-old.md` and root-level legacy docs were not used.

Build verification: `npm run build` passed on 2026-04-26.

Status legend: OK = implemented and aligned where documented; Partial = implemented but documentation is incomplete or UI intentionally limited; Missing = no frontend UI/client or endpoint absent from docs; Wrong = frontend contract mismatch found.

| Endpoint | Method | Exists in api-documentation.md? | API client exists? | Correct method? | Correct URL? | Correct request payload? | Correct response mapping? | UI flow exists? | Filters implemented? | Status | Notes |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---|---|
| `/api/areas/{area}` | DELETE | Yes | Yes | Yes | Yes | N/A | Yes | Yes | N/A | OK | Location pricing delete flow retained. |
| `/api/driver-cash-closures/{driverCashClosure}` | DELETE | Yes | Yes | Yes | Yes | N/A | Yes | Yes | N/A | OK | Finance delete flow retained. |
| `/api/drivers/{driver}` | DELETE | Yes | Yes | Yes | Yes | N/A | Yes | Yes | N/A | OK | Driver delete flow retained. |
| `/api/expenses/{expense}` | DELETE | Yes | Yes | Yes | Yes | N/A | Yes | Yes | N/A | OK | Expense delete flow retained. |
| `/api/governorates/{governorate}` | DELETE | Yes | Yes | Yes | Yes | N/A | Yes | Yes | N/A | OK | Governorate delete flow retained. |
| `/api/merchant-invoices/{merchantInvoice}` | DELETE | Yes | Yes | Yes | Yes | N/A | Yes | Yes | N/A | OK | Invoice delete flow retained. |
| `/api/merchant-payouts/{merchantPayout}` | DELETE | Yes | Yes | Yes | Yes | N/A | Yes | Yes | N/A | OK | Payout delete flow retained. |
| `/api/merchants/{merchant}` | DELETE | Yes | Yes | Yes | Yes | N/A | Yes | Yes | N/A | OK | Merchant delete flow retained. |
| `/api/orders/{order}` | DELETE | Yes | Yes | Yes | Yes | N/A | Yes | Yes | N/A | OK | UI hides delete when order has a shipment. |
| `/api/shipping-rates/{shippingRate}` | DELETE | Yes | Yes | Yes | Yes | N/A | Yes | Yes | N/A | OK | Shipping rate delete flow retained. |
| `/api/users/{user}` | DELETE | Yes | Yes | Yes | Yes | N/A | Yes | Yes | N/A | OK | User delete flow retained. |
| `/api/warehouse-charges/{warehouseCharge}` | DELETE | Yes | Yes | Yes | Yes | N/A | Yes | Yes | N/A | OK | Charge delete flow retained. |
| `/api/warehouse-products/{warehouseProduct}` | DELETE | Yes | Yes | Yes | Yes | N/A | Yes | Yes | N/A | OK | Documentation hardened with delete response. |
| `/api/warehouses/{warehouse}` | DELETE | Yes | Yes | Yes | Yes | N/A | Yes | Yes | N/A | OK | Documentation hardened with delete response. |
| `/api/areas` | GET | Yes | Yes | Yes | Yes | N/A | Yes | Yes | Yes | OK | `governorate_id` query param is supported and used where dependent areas are needed. |
| `/api/areas/{area}` | GET | Yes | Yes | Yes | Yes | N/A | Yes | Yes | N/A | OK | Details page retained. |
| `/api/auth/me` | GET | Yes | Yes | Yes | Yes | N/A | Yes | Yes | N/A | OK | Auth session bootstrap. |
| `/api/auth/ping` | GET | Minimal | No | N/A | N/A | N/A | N/A | No | N/A | Partial | Intentional diagnostic endpoint; no product UI needed. |
| `/api/dashboard/summary` | GET | Yes | Yes | Yes | Yes | N/A | Yes | Yes | Yes | OK | Duplicate docs removed and stable schema documented. |
| `/api/driver-cash-closures` | GET | Yes | Yes | Yes | Yes | N/A | Yes | Yes | Yes | OK | Finance list filters retained. |
| `/api/driver-cash-closures/{driverCashClosure}` | GET | Yes | Yes | Yes | Yes | N/A | Yes | Yes | N/A | OK | Details page retained. |
| `/api/drivers` | GET | Yes | Yes | Yes | Yes | N/A | Yes | Yes | N/A | OK | Used by filters and forms. |
| `/api/drivers/{driver}` | GET | Yes | Yes | Yes | Yes | N/A | Yes | Yes | N/A | OK | Details page retained. |
| `/api/drivers/{driver}/cash-expected` | GET | Yes | Yes | Yes | Yes | N/A | Yes | Yes | N/A | OK | Used to display read-only expected cash in generate closure UI. |
| `/api/drivers/{driver}/cash-closures/generate` | POST | Yes | Yes | Yes | Yes | Yes | Yes | Yes | N/A | OK | Create cash closure UI now calls this endpoint and does not send `expected_amount`. |
| `/api/drivers/{driver}/manifest` | GET | Yes | Yes | Yes | Yes | N/A | Yes | Yes | Yes | OK | Driver manifest supports documented filters. |
| `/api/drivers/{driver}/shipments` | GET | Yes | Yes | Yes | Yes | N/A | Yes | Yes | N/A | OK | Driver details flow retained. |
| `/api/expenses` | GET | Yes | Yes | Yes | Yes | N/A | Yes | Yes | Yes | OK | Finance expenses list/report filters retained. |
| `/api/expenses/{expense}` | GET | Yes | Yes | Yes | Yes | N/A | Yes | Yes | N/A | OK | Details page retained. |
| `/api/finance/company-profit-summary` | GET | Yes | Yes | Yes | Yes | N/A | Yes | Yes | Yes | OK | Finance report cards retained. |
| `/api/finance/reconciliation-summary` | GET | Yes | Yes | Yes | Yes | N/A | Yes | Yes | Yes | OK | Finance report cards retained. |
| `/api/finance/reports/drivers` | GET | Yes | Yes | Yes | Yes | N/A | Yes | Yes | Yes | OK | Structured driver report UI retained. |
| `/api/finance/reports/expenses` | GET | Yes | Yes | Yes | Yes | N/A | Yes | Yes | Yes | OK | Stable totals/list response schema documented. |
| `/api/finance/reports/merchant/{merchant}` | GET | Yes | Yes | Yes | Yes | N/A | Yes | Yes | Yes | OK | Stable merchant report schema documented. |
| `/api/finance/reports/overview` | GET | Yes | Yes | Yes | Yes | N/A | Yes | Yes | Yes | OK | Uses documented filters. |
| `/api/finance/reports/payouts` | GET | Yes | Yes | Yes | Yes | N/A | Yes | Yes | Yes | OK | Stable totals/list response schema documented. |
| `/api/governorates` | GET | Yes | Yes | Yes | Yes | N/A | Yes | Yes | N/A | OK | Location pricing list retained. |
| `/api/governorates/{governorate}` | GET | Yes | Yes | Yes | Yes | N/A | Yes | Yes | N/A | OK | Details page retained. |
| `/api/inventory-stocks` | GET | Yes | Yes | Yes | Yes | N/A | Yes | Yes | Yes | OK | Documented filters implemented. |
| `/api/inventory-stocks/{inventoryStock}` | GET | Yes | Yes | Yes | Yes | N/A | Yes | Yes | N/A | OK | Detail schema documented. |
| `/api/merchant-invoices` | GET | Yes | Yes | Yes | Yes | N/A | Yes | Yes | Yes | OK | List flow retained. |
| `/api/merchant-invoices/{merchantInvoice}` | GET | Yes | Yes | Yes | Yes | N/A | Yes | Yes | N/A | OK | Details page retained. |
| `/api/merchant-invoices/{merchantInvoice}/download` | GET | Yes | Yes | Yes | Yes | N/A | Blob | Yes | N/A | OK | Download action retained. |
| `/api/merchant-invoices/{merchantInvoice}/preview` | GET | Yes | Yes | Yes | Yes | N/A | Yes | Yes | N/A | OK | Preview action retained. |
| `/api/merchant-payouts` | GET | Yes | Yes | Yes | Yes | N/A | Yes | Yes | Yes | OK | List filters retained. |
| `/api/merchant-payouts/{merchantPayout}` | GET | Yes | Yes | Yes | Yes | N/A | Yes | Yes | N/A | OK | Details page retained. |
| `/api/merchants` | GET | Yes | Yes | Yes | Yes | N/A | Yes | Yes | N/A | OK | Used by lists/forms/filters. |
| `/api/merchants/{merchant}` | GET | Yes | Yes | Yes | Yes | N/A | Yes | Yes | N/A | OK | Merchant detail page implemented. |
| `/api/merchants/{merchant}/dashboard/summary` | GET | Yes | Yes | Yes | Yes | N/A | Defensive | Yes | N/A | OK | Merchant detail dashboard card. |
| `/api/merchants/{merchant}/finance/summary` | GET | Yes | Yes | Yes | Yes | N/A | Defensive | Yes | N/A | OK | Available/remaining balance displayed by merchant page. |
| `/api/merchants/{merchant}/warehouse/charges` | GET | Yes | Yes | Yes | Yes | N/A | Yes | Yes | Yes | OK | Merchant warehouse charges table. |
| `/api/merchants/{merchant}/warehouse/inventory` | GET | Yes | Yes | Yes | Yes | N/A | Yes | Yes | N/A | OK | Merchant inventory table. |
| `/api/merchants/{merchant}/warehouse/movements` | GET | Yes | Yes | Yes | Yes | N/A | Yes | Yes | N/A | OK | Merchant movements table. |
| `/api/orders` | GET | Yes | Yes | Yes | Yes | N/A | Yes | Yes | Yes | OK | Server filters now pass `date_from`, `date_to`, `merchant_id`, `merchant_name`, `status`, `fulfillment_type`, `payment_type`, `search`. |
| `/api/orders/{order}` | GET | Yes | Yes | Yes | Yes | N/A | Yes | Yes | N/A | OK | Shows `pickup_type`, shipment summary/link, and stock reservation status separately. |
| `/api/orders/{order}/stock-reservations` | GET | Yes | Yes | Yes | Yes | N/A | Yes | Yes | N/A | OK | Only shown for warehouse fulfillment orders. |
| `/api/shipments` | GET | Yes | Yes | Yes | Yes | N/A | Yes | Yes | Yes | OK | List filters retained. |
| `/api/shipments/print-list` | GET | Yes | Yes | Yes | Yes | N/A | Yes | Yes | Yes | OK | Print action now uses backend print-friendly data. |
| `/api/shipments/{shipment}` | GET | Yes | Yes | Yes | Yes | N/A | Yes | Yes | N/A | OK | Details page retained. |
| `/api/shipping-rates` | GET | Yes | Yes | Yes | Yes | N/A | Yes | Yes | N/A | OK | Location pricing list retained. |
| `/api/shipping-rates/{shippingRate}` | GET | Yes | Yes | Yes | Yes | N/A | Yes | Yes | N/A | OK | Details page retained. |
| `/api/stock-movements` | GET | Yes | Yes | Yes | Yes | N/A | Yes | Yes | Yes | OK | Documented filters implemented. |
| `/api/stock-movements/{stockMovement}` | GET | Yes | Yes | Yes | Yes | N/A | Yes | Yes | N/A | OK | Detail schema documented. |
| `/api/stock-reservations` | GET | Yes | Yes | Yes | Yes | N/A | Yes | Yes | Yes | OK | Documented filters implemented. |
| `/api/track/{shipment_number}` | GET | Yes | Yes | Yes | Yes | N/A | Yes | Yes | N/A | OK | Public tracking flow retained. |
| `/api/user` | GET | Minimal | No | N/A | N/A | N/A | N/A | No | N/A | Partial | Laravel compatibility endpoint; product auth uses `/auth/me`. |
| `/api/users` | GET | Yes | Yes | Yes | Yes | N/A | Yes | Yes | N/A | OK | Users list retained. |
| `/api/users/{user}` | GET | Yes | Yes | Yes | Yes | N/A | Yes | Yes | N/A | OK | User details retained. |
| `/api/warehouse-charges` | GET | Yes | Yes | Yes | Yes | N/A | Yes | Yes | Yes | OK | Documented filters implemented. |
| `/api/warehouse-charges/{warehouseCharge}` | GET | Yes | Yes | Yes | Yes | N/A | Yes | Yes | N/A | OK | Details page retained. |
| `/api/warehouse-products` | GET | Yes | Yes | Yes | Yes | N/A | Yes | Yes | Yes | OK | Documented filters implemented. |
| `/api/warehouse-products/{warehouseProduct}` | GET | Yes | Yes | Yes | Yes | N/A | Yes | Yes | N/A | OK | Detail schema documented. |
| `/api/warehouse-returns` | GET | Yes | Yes | Yes | Yes | N/A | Yes | Yes | Yes | OK | Documented filters implemented. |
| `/api/warehouse-returns/{warehouseReturn}` | GET | Yes | Yes | Yes | Yes | N/A | Yes | Yes | N/A | OK | Details page retained. |
| `/api/warehouses` | GET | Yes | Yes | Yes | Yes | N/A | Yes | Yes | N/A | OK | List flow retained. |
| `/api/warehouses/{warehouse}` | GET | Yes | Yes | Yes | Yes | N/A | Yes | Yes | N/A | OK | Detail schema documented. |
| `/api/shipments/{shipment}/status` | PATCH | Yes | Yes | Yes | Yes | Yes | Yes | Yes | N/A | OK | Status action uses documented status payload. |
| `/api/areas` | POST | Yes | Yes | Yes | Yes | Yes | Yes | Yes | N/A | OK | Create form retained. |
| `/api/auth/login` | POST | Yes | Yes | Yes | Yes | Yes | Yes | Yes | N/A | OK | Login flow retained. |
| `/api/auth/logout` | POST | Yes | Yes | Yes | Yes | N/A | Yes | Yes | N/A | OK | Logout flow retained. |
| `/api/driver-cash-closures` | POST | Yes | Yes | Yes | Yes | Yes | Yes | Edit only | N/A | Partial | Generic create UI now uses generate endpoint; direct POST client kept for documented/manual compatibility. |
| `/api/drivers` | POST | Yes | Yes | Yes | Yes | Yes | Yes | Yes | N/A | OK | Create form retained. |
| `/api/expenses` | POST | Yes | Yes | Yes | Yes | Yes | Yes | Yes | N/A | OK | Create form retained. |
| `/api/governorates` | POST | Yes | Yes | Yes | Yes | Yes | Yes | Yes | N/A | OK | Create form retained. |
| `/api/inventory-stocks/adjust` | POST | Yes | Yes | Yes | Yes | Yes | Yes | Yes | N/A | OK | Stock adjustment payload unchanged. |
| `/api/merchant-invoices` | POST | Yes | Yes | Yes | Yes | Yes | Yes | Yes | N/A | OK | Create form retained. |
| `/api/merchant-payouts` | POST | Yes | Yes | Yes | Yes | Yes | Yes | Yes | N/A | OK | Create form retained. |
| `/api/merchants` | POST | Yes | Yes | Yes | Yes | Yes | Yes | Yes | N/A | OK | Create form retained. |
| `/api/orders` | POST | Yes | Yes | Yes | Yes | Yes | Yes | Yes | N/A | OK | Order create supports documented warehouse fulfillment option and reservations after create. |
| `/api/orders/{order}/confirm` | POST | Yes | Yes | Yes | Yes | N/A | Yes | Yes | N/A | OK | Confirm action retained. |
| `/api/orders/{order}/fulfill-from-warehouse` | POST | Yes | Yes | Yes | Yes | N/A | Yes | Yes | N/A | OK | Warehouse fulfillment action retained. |
| `/api/orders/{order}/release-stock` | POST | Yes | Yes | Yes | Yes | N/A | Yes | Yes | N/A | OK | Release stock action retained. |
| `/api/orders/{order}/reserve-stock` | POST | Yes | Yes | Yes | Yes | Yes | Yes | Yes | N/A | OK | Stock reservation UI shown only for warehouse fulfillment. |
| `/api/orders/{order}/shipments` | POST | Yes | Yes | Yes | Yes | N/A | Yes | Yes | N/A | OK | Shipment creation only enabled for confirmed orders. |
| `/api/shipments/{shipment}/assign-driver` | POST | Yes | Yes | Yes | Yes | Yes | Yes | Yes | N/A | OK | Requires `driver_id`. |
| `/api/shipping-rates` | POST | Yes | Yes | Yes | Yes | Yes | Yes | Yes | N/A | OK | Create form retained. |
| `/api/shipping-rates/calculate` | POST | Yes | Yes | Yes | Yes | Yes | Yes | Yes | N/A | OK | Calculator retained. |
| `/api/users` | POST | Yes | Yes | Yes | Yes | Yes | Yes | Yes | N/A | OK | Create form retained. |
| `/api/warehouse-charges` | POST | Yes | Yes | Yes | Yes | Yes | Yes | Yes | N/A | OK | Create form retained. |
| `/api/warehouse-products` | POST | Yes | Yes | Yes | Yes | Yes | Yes | Yes | N/A | OK | Barcode remains optional; generated barcode shown after details fetch. |
| `/api/warehouse-returns` | POST | Yes | Yes | Yes | Yes | Yes | Yes | Yes | N/A | OK | Create form retained. |
| `/api/warehouses` | POST | Yes | Yes | Yes | Yes | Yes | Yes | Yes | N/A | OK | Create form retained. |
| `/api/areas/{area}` | PUT | Yes | Yes | Yes | Yes | Yes | Yes | Yes | N/A | OK | Edit form retained. |
| `/api/driver-cash-closures/{driverCashClosure}` | PUT | Yes | Yes | Yes | Yes | Yes | Yes | Yes | N/A | OK | Edit form retained; expected amount displayed read-only. |
| `/api/drivers/{driver}` | PUT | Yes | Yes | Yes | Yes | Yes | Yes | Yes | N/A | OK | Edit form retained. |
| `/api/expenses/{expense}` | PUT | Yes | Yes | Yes | Yes | Yes | Yes | Yes | N/A | OK | Edit form retained. |
| `/api/governorates/{governorate}` | PUT | Yes | Yes | Yes | Yes | Yes | Yes | Yes | N/A | OK | Edit form retained. |
| `/api/merchant-invoices/{merchantInvoice}` | PUT | Yes | Yes | Yes | Yes | Yes | Yes | Yes | N/A | OK | Edit form retained. |
| `/api/merchant-payouts/{merchantPayout}` | PUT | Yes | Yes | Yes | Yes | Yes | Yes | Yes | N/A | OK | Edit form retained. |
| `/api/merchants/{merchant}` | PUT | Yes | Yes | Yes | Yes | Yes | Yes | Yes | N/A | OK | Edit form retained. |
| `/api/orders/{order}` | PUT | Yes | Yes | Yes | Yes | Yes | Yes | Yes | N/A | OK | Edit route protected and hidden when order has shipment. |
| `/api/shipping-rates/{shippingRate}` | PUT | Yes | Yes | Yes | Yes | Yes | Yes | Yes | N/A | OK | Edit form retained. |
| `/api/users/{user}` | PUT | Yes | Yes | Yes | Yes | Yes | Yes | Yes | N/A | OK | Edit form retained. |
| `/api/warehouse-charges/{warehouseCharge}` | PUT | Yes | Yes | Yes | Yes | Yes | Yes | Yes | N/A | OK | Edit form retained. |
| `/api/warehouse-products/{warehouseProduct}` | PUT | Yes | Yes | Yes | Yes | Yes | Yes | Yes | N/A | OK | Update payload and response schema documented. |
| `/api/warehouses/{warehouse}` | PUT | Yes | Yes | Yes | Yes | Yes | Yes | Yes | N/A | OK | Update payload and response schema documented. |

## Endpoint Documentation Gaps

- None from `docs/api-endpoints-list.md`.
- `/api/auth/ping` remains intentionally outside product UI because it is a diagnostic endpoint.
- `POST /api/driver-cash-closures` remains documented and implemented as a client, but the create UI follows the newer generate endpoint so `expected_amount` is system-calculated.

## Fixes Applied In This Sync

- Added server-side order filters from the new docs and removed local-only order filtering.
- Added order list/details display for `pickup_type`, shipment summary, and stock reservation status.
- Locked order edit/delete UI when a shipment exists or status is `shipment_created`.
- Added `GET /api/shipments/print-list` client and print action using backend print-friendly data.
- Added generated driver cash closure client/UI and stopped sending `expected_amount` to the generate endpoint.
- Added missing warehouse/warehouse-product detail, edit, and delete clients/routes/actions.
- Added inventory stock and stock movement detail clients/routes.
- Updated `GET /api/areas` client to support `governorate_id`.

## Orders And Shipments Follow-Up Fixes

- Order creation now loads active warehouse products for the selected merchant when `fulfillment_type = from_warehouse`.
- Warehouse fulfillment order creation builds documented `items[]` from selected warehouse products instead of forcing manual product rows.
- Prepaid orders disable COD and submit `cod_amount = 0`; COD orders require a positive COD amount.
- Orders list no longer sends `merchant_name`; global `search` remains for order/customer/phone search.
- Orders list delivery governorate/area UI uses dependent `GET /areas?governorate_id=...`, but does not send undocumented delivery filters to `/api/orders`.
- After shipment creation, order details and list queries are invalidated and order details are refetched.
- Shipment print uses `GET /api/shipments/print-list` and renders a print-only manifest with generated time, filters, totals, and shipment rows.
