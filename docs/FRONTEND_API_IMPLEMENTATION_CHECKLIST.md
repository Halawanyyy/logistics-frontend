# Frontend API Implementation Checklist

## 2026-05-23 Admin Sprint 1 And 2 Sync

- [x] Created `docs/FRONTEND_FULL_API_FLOW_IMPLEMENTATION_CHECKLIST.md` before the new implementation batch.
- [x] Created `docs/FRONTEND_FULL_API_FLOW_IMPLEMENTATION_AUDIT.md` against the May 23 docs.
- [x] Moved canonical protected routes under `/admin/*`.
- [x] Added legacy route redirects from older unprefixed paths into the `/admin/*` namespace.
- [x] Updated RBAC to prefer backend permission slugs and keep role fallback only when permissions are missing.
- [x] Added Roles & Permissions clients, types, routes, list/details/create/edit flows, and grouped permission assignment UI.
- [x] Added Settings clients, types, `/admin/settings`, group-driven rendering, public settings fetch, and bulk update flow.
- [x] Added Pricing Plans and Pricing Plan Rates clients, types, routes, details, and form flows.
- [x] Added `pricing_plan_id` support to merchant types and create/edit forms.
- [x] Added `POST /api/users/{user}/assign-role` client and wired edit-user role assignment to `role_id`.
- [x] `npm run build` passed after this Sprint 1 and Sprint 2 implementation batch.

This checklist tracks implementation against `api-documentation.md`. Items are marked complete only when implemented in the frontend.

## 2026-04-26 New API Sync

- [x] Used `docs/api-documentation.md` and `docs/api-endpoints-list.md` as the current source of truth.
- [x] Created `docs/FRONTEND_NEW_API_SYNC_AUDIT.md` covering every endpoint in the new endpoint list.
- [x] Added `GET /areas?governorate_id=` API support and used it for dependent area filtering where applicable.
- [x] Added documented server-side order filters: `date_from`, `date_to`, `merchant_id`, `merchant_name`, `status`, `fulfillment_type`, `payment_type`, `search`.
- [x] Displayed new order fields: `pickup_type`, shipment summary/link, `has_stock_reservations`, and `stock_reservation_status`.
- [x] Locked edit/delete UI for orders that have a shipment or `shipment_created` status.
- [x] Added `GET /shipments/print-list` client and print action using returned manifest data.
- [x] Added `POST /drivers/{driver}/cash-closures/generate` client and generate UI without sending `expected_amount`.
- [x] Added warehouse detail/edit/delete clients and routes for warehouses and warehouse products.
- [x] Added detail clients and routes for inventory stocks and stock movements.
- [x] Added RBAC keys for `warehouse.update`, `warehouse.delete`, `inventory.update`, and `inventory.delete`.
- [x] Intentional partials remain documented in the new sync audit: `/auth/ping`, `/api/user`, and route-list endpoints missing detailed docs.

## 2026-04-26 Orders And Shipments Fixes

- [x] Order create now loads active merchant warehouse products with `GET /warehouse-products?merchant_id={merchant_id}&status=active` when fulfillment is `from_warehouse`.
- [x] `from_warehouse` order create no longer requires manual product-name item rows; selected warehouse products are converted into documented order items before submit.
- [x] `pickup_from_merchant` order create still requires manual order items.
- [x] `prepaid` payment type sets `cod_amount = 0` and disables the COD amount input; `cod` requires a positive COD amount.
- [x] Orders list filter UI moved into a labeled responsive card with reset action.
- [x] `merchant_name` was removed from Orders list UI filters and is no longer sent by the frontend.
- [x] Delivery governorate/area controls use `GET /areas?governorate_id=...` for dependent area options, but are not sent to `/orders` until documented by backend.
- [x] Shipment creation invalidates and refetches order details/orders/shipments queries so `shipment_created` status and shipment link are shown when returned by backend.
- [x] Shipment print now uses `GET /shipments/print-list`, renders a dedicated manifest section, and uses print CSS to avoid printing the admin shell.

## Auth

### 1. API client functions
- [x] Implement `POST /auth/login`
- [x] Implement `GET /auth/me`
- [x] Implement `POST /auth/logout`
- [x] Implement `GET /auth/ping`

### 2. TypeScript types
- [x] Create auth request and response types

### 3. Routes
- [x] Add `/login` route

### 4. List pages
- [x] Not applicable: Auth has no list endpoint

### 5. Create forms
- [x] Create login form

### 6. Edit forms
- [x] Not applicable: Auth has no edit endpoint

### 7. Details pages
- [x] Current authenticated user is handled through auth state

### 8. Actions
- [x] Login action
- [x] Logout action

### 9. Filters
- [x] Not applicable: Auth has no documented filters

### 10. Loading/Error/Empty states
- [x] Login loading and error states

### 11. Build status
- [x] Verified in final build

## Users

### 1. API client functions
- [x] Implement `GET /users`
- [x] Implement `POST /users`
- [x] Implement `GET /users/{user}`
- [x] Implement `PUT /users/{user}`
- [x] Implement `DELETE /users/{user}`

### 2. TypeScript types
- [x] Create `User` type
- [x] Create users request and response types

### 3. Routes
- [x] Add `/users` route
- [x] Add `/users/create` route
- [x] Add `/users/:userId` route
- [x] Add `/users/:userId/edit` route

### 4. List pages
- [x] Create `UsersListPage`

### 5. Create forms
- [x] Create user create form

### 6. Edit forms
- [x] Create user edit form

### 7. Details pages
- [x] Create user details page

### 8. Actions
- [x] Delete user API function
- [x] Add delete user UI action

### 9. Filters
- [x] Add local user search

### 10. Loading/Error/Empty states
- [x] Add users loading/error/empty states

### 11. Build status
- [x] Verified in final build

## Merchants

### 1. API client functions
- [x] Implement `GET /merchants`
- [x] Implement `POST /merchants`
- [x] Implement `GET /merchants/{merchant}`
- [x] Implement `PUT /merchants/{merchant}`
- [x] Implement `DELETE /merchants/{merchant}`
- [x] Implement `GET /merchants/{merchant}/dashboard/summary`
- [x] Implement `GET /merchants/{merchant}/finance/summary`
- [x] Implement `GET /merchants/{merchant}/warehouse/inventory`
- [x] Implement `GET /merchants/{merchant}/warehouse/movements`
- [x] Implement `GET /merchants/{merchant}/warehouse/charges`

### 2. TypeScript types
- [x] Create `Merchant` type
- [x] Create merchant CRUD request and response types
- [x] Create merchant dashboard, finance, and warehouse response types

### 3. Routes
- [x] Add `/merchants` route
- [x] Add `/merchants/create` route
- [x] Add `/merchants/:merchantId` route
- [x] Add `/merchants/:merchantId/edit` route
- [x] Add `/merchants/:merchantId/dashboard`, `/merchants/:merchantId/finance`, and `/merchants/:merchantId/warehouse` routes

### 4. List pages
- [x] Create `MerchantsListPage`

### 5. Create forms
- [x] Create merchant create form

### 6. Edit forms
- [x] Create merchant edit form

### 7. Details pages
- [x] Create merchant details page with profile card
- [x] Create merchant dashboard summary section
- [x] Create merchant finance summary section
- [x] Create merchant warehouse inventory, movements, and charges sections

### 8. Actions
- [x] Delete merchant API function
- [x] Add delete merchant UI action

### 9. Filters
- [x] Add local merchant search

### 10. Loading/Error/Empty states
- [x] Add merchants loading/error/empty states

### 11. Build status
- [x] Verified in final build

## Location Pricing

### 1. API client functions
- [x] Implement `GET /governorates`
- [x] Implement `POST /governorates`
- [x] Implement `GET /governorates/{governorate}`
- [x] Implement `PUT /governorates/{governorate}`
- [x] Implement `DELETE /governorates/{governorate}`
- [x] Implement `GET /areas`
- [x] Implement `POST /areas`
- [x] Implement `GET /areas/{area}`
- [x] Implement `PUT /areas/{area}`
- [x] Implement `DELETE /areas/{area}`
- [x] Implement `GET /shipping-rates`
- [x] Implement `POST /shipping-rates`
- [x] Implement `GET /shipping-rates/{shippingRate}`
- [x] Implement `PUT /shipping-rates/{shippingRate}`
- [x] Implement `DELETE /shipping-rates/{shippingRate}`
- [x] Implement `POST /shipping-rates/calculate`

### 2. TypeScript types
- [x] Create governorate, area, and shipping rate types
- [x] Create location pricing request and response types

### 3. Routes
- [x] Add `/governorates` route
- [x] Add `/areas` route
- [x] Add `/shipping-rates` route
- [x] Add create/edit location routes
- [x] Add shipping rate calculator route or section

### 4. List pages
- [x] Create governorates list page
- [x] Create areas list page
- [x] Create shipping rates list page

### 5. Create forms
- [x] Create governorate create form
- [x] Create area create form
- [x] Create shipping rate create form

### 6. Edit forms
- [x] Create governorate edit form
- [x] Create area edit form
- [x] Create shipping rate edit form

### 7. Details pages
- [x] Create governorate details page
- [x] Create area details page
- [x] Create shipping rate details page

### 8. Actions
- [x] Delete location API functions
- [x] Calculate shipping rate API function
- [x] Add delete/calculate UI actions

### 9. Filters
- [x] Add local search filters

### 10. Loading/Error/Empty states
- [x] Add location pricing loading/error/empty states

### 11. Build status
- [x] Verified in final build

## Orders

### 1. API client functions
- [x] Implement `GET /orders`
- [x] Implement `POST /orders`
- [x] Implement `GET /orders/{order}`
- [x] Implement `PUT /orders/{order}`
- [x] Implement `DELETE /orders/{order}`
- [x] Implement `POST /orders/{order}/confirm`
- [x] Implement `POST /orders/{order}/reserve-stock`
- [x] Implement `POST /orders/{order}/release-stock`
- [x] Implement `POST /orders/{order}/fulfill-from-warehouse`
- [x] Implement `GET /orders/{order}/stock-reservations`

### 2. TypeScript types
- [x] Create order types
- [x] Create order CRUD request and response types
- [x] Create warehouse order action response types
- [x] Add defensive optional shipment relation fields for order details when backend returns them

### 3. Routes
- [x] Add `/orders` route
- [x] Add `/orders/:orderId` route
- [x] Add `/orders/create` route
- [x] Add `/orders/:orderId/edit` route

### 4. List pages
- [x] Create orders list page

### 5. Create forms
- [x] Create order create form

### 6. Edit forms
- [x] Create order edit form

### 7. Details pages
- [x] Create order details page
- [x] Add stock reservations section only for `fulfillment_type = from_warehouse`
- [x] Show pickup type / fulfillment type in order details

### 8. Actions
- [x] Confirm order API function
- [x] Add confirm order UI action
- [x] Add `orders.delete` permission and order delete UI actions
- [x] Add reserve stock UI action
- [x] Add release stock UI action
- [x] Add fulfill from warehouse UI action

### 9. Filters
- [x] Add local order search
- [x] Intentionally skipped documented order filters: `GET /api/orders` does not document query filters

### 10. Loading/Error/Empty states
- [x] Add orders loading/error/empty states

### 11. Build status
- [x] Verified in final build

## Shipments

### 1. API client functions
- [x] Implement `GET /shipments`
- [x] Implement `GET /shipments/{shipment}`
- [x] Implement `POST /orders/{order}/shipments`
- [x] Implement `PATCH /shipments/{shipment}/status`
- [x] Implement `POST /shipments/{shipment}/assign-driver`

### 2. TypeScript types
- [x] Create shipment types
- [x] Create shipment request and response types
- [x] Create assign driver request and response types

### 3. Routes
- [x] Add `/shipments` route
- [x] Add `/shipments/:shipmentId` route

### 4. List pages
- [x] Create shipments list page

### 5. Create forms
- [x] Create shipment from order UI action/form

### 6. Edit forms
- [x] Create shipment status update form
- [x] Create assign driver form

### 7. Details pages
- [x] Create shipment details page

### 8. Actions
- [x] Create shipment from order API function
- [x] Update shipment status API function
- [x] Add create shipment UI action
- [x] Add update status UI action
- [x] Add assign driver UI action

### 9. Filters
- [x] Add local shipment search
- [x] Add documented shipment filters

### 10. Loading/Error/Empty states
- [x] Add shipments loading/error/empty states

### 11. Build status
- [x] Verified in final build

## Drivers

### 1. API client functions
- [x] Implement `GET /drivers`
- [x] Implement `POST /drivers`
- [x] Implement `GET /drivers/{driver}`
- [x] Implement `PUT /drivers/{driver}`
- [x] Implement `DELETE /drivers/{driver}`
- [x] Implement `GET /drivers/{driver}/shipments`
- [x] Implement `GET /drivers/{driver}/manifest`
- [x] Implement `GET /drivers/{driver}/cash-expected`

### 2. TypeScript types
- [x] Create driver request and response types

### 3. Routes
- [x] Add drivers routes

### 4. List pages
- [x] Create drivers list page

### 5. Create forms
- [x] Create driver create form

### 6. Edit forms
- [x] Create driver edit form

### 7. Details pages
- [x] Create driver details page
- [x] Create assigned shipments section
- [x] Create manifest page
- [x] Create expected cash section

### 8. Actions
- [x] Add delete driver action

### 9. Filters
- [x] Intentionally skipped documented driver filters: `GET /api/drivers` does not document query filters
- [x] Add documented driver manifest filters: `status` and `date`

### 10. Loading/Error/Empty states
- [x] Add drivers loading/error/empty states

### 11. Build status
- [x] Verified in final build

## Dashboard

### 1. API client functions
- [x] Implement `GET /dashboard/summary`

### 2. TypeScript types
- [x] Create dashboard summary types

### 3. Routes
- [x] Add `/dashboard` route

### 4. List pages
- [x] Not applicable: dashboard is summary/reporting UI

### 5. Create forms
- [x] Not applicable: dashboard has no create endpoint

### 6. Edit forms
- [x] Not applicable: dashboard has no edit endpoint

### 7. Details pages
- [x] Create dashboard page

### 8. Actions
- [x] Add dashboard query refetch through filters

### 9. Filters
- [x] Add dashboard summary filters: `date_from`, `date_to`, `merchant_id`, and `assigned_driver_id`

### 10. Loading/Error/Empty states
- [x] Add dashboard loading/error/empty states

### 11. Build status
- [x] Verified in final build

## Finance

### 1. API client functions
- [x] Implement `GET /merchant-payouts`
- [x] Implement `POST /merchant-payouts`
- [x] Implement `GET /merchant-payouts/{merchantPayout}`
- [x] Implement `PUT /merchant-payouts/{merchantPayout}`
- [x] Implement `DELETE /merchant-payouts/{merchantPayout}`
- [x] Implement `GET /driver-cash-closures`
- [x] Implement `POST /driver-cash-closures`
- [x] Implement `GET /driver-cash-closures/{driverCashClosure}`
- [x] Implement `PUT /driver-cash-closures/{driverCashClosure}`
- [x] Implement `DELETE /driver-cash-closures/{driverCashClosure}`
- [x] Implement `GET /expenses`
- [x] Implement `POST /expenses`
- [x] Implement `GET /expenses/{expense}`
- [x] Implement `PUT /expenses/{expense}`
- [x] Implement `DELETE /expenses/{expense}`
- [x] Implement `GET /finance/company-profit-summary`
- [x] Implement `GET /finance/reconciliation-summary`
- [x] Implement `GET /finance/reports/overview`
- [x] Implement `GET /finance/reports/merchant/{merchant}`
- [x] Implement `GET /finance/reports/drivers`
- [x] Implement `GET /finance/reports/expenses`
- [x] Implement `GET /finance/reports/payouts`
- [x] Implement `GET /merchant-invoices`
- [x] Implement `POST /merchant-invoices`
- [x] Implement `GET /merchant-invoices/{merchantInvoice}`
- [x] Implement `PUT /merchant-invoices/{merchantInvoice}`
- [x] Implement `DELETE /merchant-invoices/{merchantInvoice}`
- [x] Implement `GET /merchant-invoices/{merchantInvoice}/preview`
- [x] Implement `GET /merchant-invoices/{merchantInvoice}/download`

### 2. TypeScript types
- [x] Create finance summary and overview types
- [x] Create finance CRUD/report request and response types
- [x] Add defensive dynamic finance report type for undocumented report response shapes

### 3. Routes
- [x] Add finance routes

### 4. List pages
- [x] Create merchant payouts list page
- [x] Create driver cash closures list page
- [x] Create expenses list page
- [x] Create merchant invoices list page

### 5. Create forms
- [x] Create merchant payout form
- [x] Create driver cash closure form
- [x] Create expense form
- [x] Create merchant invoice form

### 6. Edit forms
- [x] Create merchant payout edit form
- [x] Create driver cash closure edit form
- [x] Create expense edit form
- [x] Create merchant invoice edit form

### 7. Details pages
- [x] Create finance summary/report pages
- [x] Create finance detail pages
- [x] Create invoice preview page/section
- [x] Add structured summary-card/table rendering for merchant, expenses, and payouts reports with undocumented response schemas

### 8. Actions
- [x] Add delete finance record actions
- [x] Add invoice download action

### 9. Filters
- [x] Add documented finance overview filters: `date_from`, `date_to`, `merchant_id`, `driver_id`, and `status`
- [x] Add documented driver finance report filters: `date_from`, `date_to`, `driver_id`, and `status`
- [x] Merchant-specific finance report is available from the finance reports page when a merchant filter is selected

### 10. Loading/Error/Empty states
- [x] Add finance loading/error/empty states

### 11. Build status
- [x] Verified in final build

## Warehouse

### 1. API client functions
- [x] Implement `GET /warehouses`
- [x] Implement `POST /warehouses`
- [x] Implement `GET /warehouse-products`
- [x] Implement `POST /warehouse-products`
- [x] Implement `GET /inventory-stocks`
- [x] Implement `POST /inventory-stocks/adjust`
- [x] Implement `GET /stock-movements`
- [x] Implement `POST /warehouse-returns`
- [x] Implement `GET /warehouse-returns`
- [x] Implement `GET /warehouse-returns/{warehouseReturn}`
- [x] Implement `GET /warehouse-charges`
- [x] Implement `POST /warehouse-charges`
- [x] Implement `GET /warehouse-charges/{warehouseCharge}`
- [x] Implement `PUT /warehouse-charges/{warehouseCharge}`
- [x] Implement `DELETE /warehouse-charges/{warehouseCharge}`
- [x] Implement `GET /stock-reservations`

### 2. TypeScript types
- [x] Create warehouse request and response types

### 3. Routes
- [x] Add warehouse routes

### 4. List pages
- [x] Create warehouses list page
- [x] Create warehouse products list page
- [x] Create inventory stocks list page
- [x] Create stock movements list page
- [x] Create warehouse returns list page
- [x] Create warehouse charges list page
- [x] Create stock reservations list page

### 5. Create forms
- [x] Create warehouse create form
- [x] Create warehouse product create form
- [x] Create stock adjustment form
- [x] Create warehouse return form
- [x] Create warehouse charge form

### 6. Edit forms
- [x] Create warehouse charge edit form

### 7. Details pages
- [x] Create warehouse return details page
- [x] Create warehouse charge details page

### 8. Actions
- [x] Add stock adjustment action
- [x] Add delete warehouse charge action

### 9. Filters
- [x] Add documented warehouse filters for warehouse products, inventory stocks, stock movements, warehouse returns, warehouse charges, and stock reservations

### 10. Loading/Error/Empty states
- [x] Add warehouse loading/error/empty states

### 11. Build status
- [x] Verified in final build

## Public Tracking

### 1. API client functions
- [x] Implement `GET /track/{shipment_number}`

### 2. TypeScript types
- [x] Create public tracking response types

### 3. Routes
- [x] Add public tracking route

### 4. List pages
- [x] Not applicable: Public tracking has no list endpoint

### 5. Create forms
- [x] Create tracking lookup form

### 6. Edit forms
- [x] Not applicable: Public tracking has no edit endpoint

### 7. Details pages
- [x] Create public tracking details page

### 8. Actions
- [x] Add tracking lookup action

### 9. Filters
- [x] Not applicable: Tracking uses shipment number route param

### 10. Loading/Error/Empty states
- [x] Add public tracking loading/error/empty states

### 11. Build status
- [x] Verified in final build

## Summary

### Completed
- Initial checklist created.
- Strict API contract audit completed in `FRONTEND_API_CONTRACT_AUDIT.md` using `api-documentation.md` as the only source of truth.
- Business change request audit created in `BUSINESS_CHANGE_REQUESTS_AUDIT.md`; backend-required changes are proposed there because backend code is not available in this workspace.
- Existing implemented functionality marked based on current frontend files.
- Missing API clients and TypeScript types added for drivers, finance, warehouse, merchant scoped endpoints, public tracking, shipment assignment, and order stock actions.
- Read-only list/report/tracking pages and routes added for drivers, finance, warehouse, and public tracking.
- Merchants create/edit forms and list edit/delete actions added.
- Orders create/edit forms, dynamic item rows, confirm action, shipment creation action, and warehouse stock actions added.
- Orders delete permission and delete actions added; admin receives access through wildcard RBAC, non-admin roles are not granted by default.
- Order details now show fulfillment type, defensively show shipment number/link when returned, and hide warehouse stock controls unless the order is warehouse-fulfilled.
- Shipments update status and assign driver modals/actions added.
- Users create/edit/detail pages, routes, role handling, and delete action added.
- Location Pricing create/edit pages, delete actions, and shipping rate calculator added.
- Location Pricing read-only details pages added for governorates, areas, and shipping rates.
- Drivers create/edit/detail pages, assigned shipments, manifest, expected cash, and delete action added.
- Driver manifest status/date filters added.
- Finance create/edit/detail pages, invoice preview/download, and delete actions added.
- Finance report pages now use documented overview and driver-report filters.
- Finance merchant, expenses, and payouts report endpoints now render structured summary cards/tables with defensive normalization instead of raw data.
- Warehouse create forms, stock adjustment, warehouse return/charge details, warehouse charge edit/delete added.
- Merchant detail, merchant dashboard, merchant finance, and merchant warehouse routes/pages added.
- Shipments list now uses documented API query params for search, status, and date filters.
- Shipments list now also uses documented merchant, assigned-driver, governorate, and area query params.
- Order detail now enforces the documented rule that shipments can only be created from confirmed, non-review orders with items.
- Finance list pages now use documented API query params with resettable filter bars.
- Finance summary/report clients now avoid sending undocumented params to date-only summary endpoints, and report UI calls overview, driver, merchant, expenses, and payouts report endpoints.
- Warehouse product, inventory, movement, return, charge, and stock reservation pages now use documented API query params with resettable filter bars.
- Warehouse charge form now exposes documented optional `order_id` and `shipment_id` fields.
- Dashboard, Finance, and Warehouse routes are code-split with `React.lazy`; the initial app bundle is below Vite's warning threshold.

### Pending
- None.

### Issues
- No build issues.
- Intentional partials remain documented in `FRONTEND_API_CONTRACT_AUDIT.md`: diagnostic `/auth/ping` has no UI, and default `/user` is not used because `/auth/me` is used for app auth.
- Backend-required business changes remain proposals in `BUSINESS_CHANGE_REQUESTS_AUDIT.md` because backend code is not available in this workspace.

### Next steps
- Optional polish: add server-backed pagination if the backend adds pagination metadata in a future API revision.
