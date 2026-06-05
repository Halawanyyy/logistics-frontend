# Frontend Full API + Flow Implementation Audit

Source of truth:
- `docs/api-documentation.md`
- `docs/admin_frontend_flows_documentation.md`

Status legend:
- `OK`: implemented in code and aligned with both docs
- `Partial`: implemented in part, or implemented against an older contract
- `Missing`: absent in client, types, or UI
- `Wrong`: present but mismatched with docs
- `Not Required Now`: future/plugin-facing only

## Latest Backend Sync Pass

Implemented in this pass:
- Warehouse Receipts now have admin list, draft create/edit flow, details page, item quantities, status display, and confirm/cancel actions.
- Warehouse Transfers now have admin list, draft create/edit flow, details page, item quantities, status display, and confirm/dispatch/receive/cancel actions.
- Orders now surface `warehouse_fulfillment_status`, new documented filters, the staged warehouse workflow actions, and the stricter shipment-creation gate for `from_warehouse` orders.
- Shipments now include the additional documented filters, prevent direct final-completion status updates in the manual status dialog, and expose shipment label/waybill actions plus bulk label loading.
- Localization now has a stored English/Arabic preference, sends `X-Locale` and `Accept-Language`, and uses backend-provided additive labels on the updated order, shipment, warehouse, portal-user, and inbound-request surfaces.
- Label printing now has a reusable raw-response client and reusable preview dialog handling `html`, `pdf`, `zpl`, `tspl`, and `json`, with actions added for warehouse products, orders, shipments, warehouse bins, bulk labels, manifest formatted print, and settings preview/test.
- Warehouse Returns now show staged lifecycle status and actions instead of assuming a single-step stock effect.
- Inventory, warehouse products, and stock movements now honor the expanded backend filters and low-stock endpoints on the updated list screens.
- Merchant Portal UI remains `Not Required Now` for this admin-only project, but admin-side merchant portal user management is now available inside merchant details.
- Merchant inbound stock requests now have an admin review page with list/detail, approve/reject/link-receipt actions, and explicit stock-authority guidance.

Honest status summary:
- `OK`: Warehouse Receipts, Warehouse Transfers, Warehouse Order Workflow gate/actions, Warehouse Return Lifecycle, Orders/Shipments final filter/lifecycle sync, Merchant Portal scope decision, Merchant inbound stock request admin review, build verification.
- `Partial`: Label Printing breadth, Localization label adoption breadth, low-stock UX polish.
- `Not Required Now`: Merchant-facing `/merchant` route namespace and merchant app screens, because this frontend still only implements the admin application.

## Optional UX Polish Pass

Implemented in this pass:
- Warehouse KPIs now include dedicated low-stock quick cards for inventory and products, powered by the existing low-stock endpoints and linked to the existing filtered list screens.
- Inventory Stocks and Warehouse Products now expose one-click low-stock filter actions plus low-stock summary cards based on the backend low-stock list responses under the current page filters.
- Warehouse Bins now have a dedicated details page under `/admin/warehouse/bins/:warehouseBinId` with backend-backed details loading, label printing, barcode copy, edit, and delete flows.
- Warehouse Locations bin rows now link to the new details page, while still keeping inline label printing from the list.
- Dashboard polish now includes clearer recent status labels plus operational coverage/progress panels derived directly from `GET /api/dashboard/summary`, without inventing historical chart data.
- The dashboard content grid was rebalanced to remove the visible empty-gap issue between the main activity stack and the right-hand summary rail, while keeping the same documented data sources and responsive behavior.
- The dashboard finance surface was upgraded from a generic chart treatment to a clearer real-data snapshot that highlights net company profit, unverified COD gap, COD verification progress, fees, expenses, and merchant payout context without inventing numbers.
- Shared status-badge mapping now uses explicit state-to-tone rules so `inactive`, `draft`, `disabled`, `returned`, and staged shipment states no longer fall through to misleading success colors.
- The topbar hamburger/sidebar interaction now uses separate desktop-collapse and mobile-drawer state so desktop content reflows cleanly while mobile keeps an overlay drawer, instead of both behaviors sharing one glitch-prone flag.
- The topbar search is now functional and uses only existing list APIs/routes: Orders and Shipments query documented backend search params, Warehouse Products merges documented `search`/`sku`/`barcode` list queries, and Merchants/Drivers reuse the current frontend's existing client-side list filtering pattern on top of their documented list endpoints.
- Searchable dropdown coverage was expanded further across warehouse KPI filters, warehouse receipts, warehouse transfers, treasury filters, storage/pick-pack fee rules, picking-list generation, reserve-stock/product selection, shared warehouse record forms, shared finance record forms, and other remaining high-traffic selectors.
- Broader label-first rendering was extended to additional older screens including dashboard recent tables, treasury transactions, exports, barcode tools, audit logs, settings groups, and shared state/modals where additive label fields or static UI text are now available.
- `react-i18next` is now configured with English and Arabic resources, initialized at app bootstrap, and synchronized with the existing locale provider so the current locale preference continues driving `X-Locale` and `Accept-Language` headers without backend changes.
- Company Settings helper descriptions now render as neutral guidance instead of error-like red text, and the branding/settings card layout was refined without introducing any undocumented settings upload flow or backend changes.

Honest polish status summary:
- `OK`: Low-stock quick cards and filter shortcuts, dedicated warehouse bin details and label flow, dashboard charts/summary polish, `react-i18next` setup/build verification, and locale-header synchronization preservation.
- `OK`: Dashboard empty-gap fix, finance snapshot readability upgrade, status-badge tone correction, and Company Settings helper/layout cleanup.
- `OK`: Topbar hamburger/sidebar behavior fix across desktop/mobile/RTL-safe shell primitives, and topbar global search grouped by Orders, Shipments, Merchants, Drivers, and Warehouse Products with permission-gated querying.
- `OK`: Role permissions editing now uses a searchable grouped multi-select while preserving backend permission ids/slugs.
- `Partial`: Broader localization adoption, safe RTL rollout, and searchable dropdown coverage. All three improved materially, but not every older screen or every long-list legacy select in the admin app was converted in this pass, and RTL still needs manual visual audit on older pages.
- `Not Required Now`: Any backend changes, new API contracts, fake historical chart data, or a merchant-facing frontend namespace.

## Focused Frontend Polish Pass

Implemented in this pass:
- The dashboard shipment-status donut tooltip now renders a custom tooltip with localized label, raw count, and percentage of total, while keeping the existing real backend summary data and adding basic segment accessibility labels.
- Shared `StatusBadge` tone mapping was expanded substantially so wallet directions, approvals, staged shipment/warehouse statuses, partial delivery/receipt states, and error/return states no longer fall back to visually similar gray badges.
- Sidebar group behavior is now consistent across the implemented admin navigation: every visible group with children has a clickable header, chevron, expand/collapse state, active-child auto-open behavior, and low-risk `localStorage` persistence, while single-link sections such as Dashboard, Orders, and Shipments stay simple links.
- Localization coverage was extended again across targeted older pages: Finance Reports section copy/labels, Merchant Details warehouse panels, Merchant Profile wallet/invoice/token/timeline flows, and Order Details field labels, stock-reservation copy, and warehouse workflow text.
- Arabic resource entries were added for the newly localized strings used by the targeted pages, including the new chart tooltip copy and the finance-report strings already converted to `t(...)`.

Honest focused-pass status summary:
- `OK`: Chart tooltip clarity/build verification, status badge distinction, and sidebar dropdown behavior are implemented and compile cleanly.
- `Partial`: Localization coverage on the targeted older pages is materially better, but some legacy warehouse/admin dialogs and additional older finance/detail surfaces still remain outside this pass.

## Current Summary

The current frontend now includes the `/admin` route namespace, backend-permission-aware RBAC fallback logic, dedicated Roles & Permissions pages, a dynamic Settings page, and Pricing Plans/Pricing Plan Rates CRUD pages. The app still is not fully aligned with the current documentation set, especially outside Sprint 1 and Sprint 2.

Main baseline findings:
- Canonical protected routes now live under `/admin/*`, with legacy unprefixed paths redirected to their `/admin/*` equivalents.
- RBAC now prefers backend permission slugs and falls back to legacy role maps only when permissions are absent.
- Sprint 1 coverage is substantially improved: auth foundation, roles/permissions, and settings are implemented, though some setting detail endpoints remain unused.
- Sprint 2 coverage is substantially improved: pricing plans and pricing plan rates are implemented, and merchants now support `pricing_plan_id`.
- Merchant Profile now uses a tabbed details view with query-param routing for Overview, Orders, Shipments, Wallet, Invoices, Warehouse, Integration Tokens, Attachments, and Activity Timeline, while preserving the older `/dashboard`, `/finance`, and `/warehouse` merchant URLs as low-risk aliases.
- Global foundation fixes are now in place for normalized API errors, shared field-level validation, `/admin/404`, reusable loading/error/empty states, backend-aware permission helpers, and the first shared selector/display/modal/print primitives.
- Orders and Shipments are now substantially closer to the current docs: Orders filters and form rules were aligned, and Shipments now include delivery attempts, item-level complete delivery, and reusable activity timeline sections.
- `docs/admin_frontend_flows_documentation.md` is treated as the high-level flow guide for screens, actions, and permissions, while `docs/api-documentation.md` is the exact source of truth for request payloads, validation, response shapes, and error behavior.

## Global Foundation Fix Pass

Implemented in this pass:
- `normalizeApiError()` now returns a consistent UI-safe error shape for 401, 403, 404, 422, and network failures.
- Existing interceptors were reviewed and retained with the intended behavior: 401 clears session and redirects to `/admin/login`, 403 redirects to `/admin/403`, while 422 and 404 continue to flow back to pages/forms.
- Shared form error handling now exists via `FieldError` and `useFormApiErrors`, and is wired into login, user, merchant, order, and shipment mutation forms.
- Reusable state components now exist under `src/shared/components/states/*`, with representative pages migrated to them.
- `NotFoundState` is now used in representative details pages: users, merchants, orders, shipments, drivers, and warehouse records.
- Permission helpers now support `permission`, `anyOf`, and `allOf`, while still preferring backend permission slugs and only using role fallback when permissions are absent.
- Shared foundation components now exist for money display, date ranges, selectors, confirm actions, approval actions, print view, barcode input, timeline shell, attachments shell, and export button.
- Sidebar grouping is now aligned with the implemented admin sections, permission-gated through the shared layout, and intentionally omits links for pages that do not exist.

## Merchant Profile Completion Pass

Implemented in this pass:
- Merchant profile now uses `?tab=` query params on the existing `/admin/merchants/:merchantId` route as the least risky tab-routing approach, while preserving the older nested merchant detail URLs as backward-compatible aliases.
- The profile now exposes the documented tab set for the admin flow: Overview, Orders, Shipments, Wallet, Invoices, Warehouse, Integration Tokens, Attachments, and Activity Timeline.
- Orders and Shipments tabs now query their existing backend list endpoints with merchant-scoped backend filters rather than local-only filtering.
- Wallet APIs and types now exist for summary, transactions, manual deposit, manual withdraw, transaction details, approve, and reject flows, and the Merchant Profile wallet tab uses backend-owned balances only.
- Merchant invoice listing, preview, and download actions are now wired into the Merchant Profile invoices tab.
- Merchant integration token APIs and types now exist for list, create, details, revoke, and delete. The create flow shows `plain_token` once only and never stores it persistently.
- Merchant attachments now use the reusable attachments component with real list/upload/download/delete wiring for `attachable_type=merchants`.
- Merchant activity timeline now uses the audit timeline endpoint with a reusable timeline renderer and excludes obviously sensitive token/password fields from the displayed metadata summary.

## Orders + Shipments Completion Pass

Implemented in this pass:
- Orders list filters now match the documented backend filters used by the admin flow: `status`, `order_type`, `fulfillment_type`, `payment_type`, `delivery_status`, `partially_delivered`, `merchant_id`, `date_from`, `date_to`, and `search`.
- Orders no longer send undocumented governorate/area list filters; merchant selection remains the documented backend filter for the Orders list.
- Orders create/edit flows now align with the documented business rules for `order_type`, `payment_type`, and `fulfillment_type`, including swap fields, prepaid COD disabling, return orders forcing `pickup_from_customer`, and merchant-scoped warehouse product loading for `from_warehouse`.
- Order details now surface the documented status, order type, fulfillment type, payment type, shipment link, review warnings, stock reservation section, and reusable activity timeline section.
- Shipments list filters now match the documented backend filters and use the same shared filter-card pattern as Orders without page reloads.
- Shipment details now support assign-driver, status updates, item-level complete delivery, delivery attempts, and reusable activity timeline rendering with permission-gated sections.
- The shipment print flow now aligns with the documented `/api/shipments/print-list` contract, including a required single `date` parameter and frontend-rendered print output from the returned JSON payload.

## Module Audit

| Module | Screen / Flow from admin_frontend_flows_documentation.md | Endpoint from api-documentation.md | Method | Permission required | API client exists? | TypeScript types exist? | UI page exists? | UI action exists? | Request payload matches docs? | Response mapping matches docs? | Filters implemented? | Flow behavior matches frontend flow doc? | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Auth | Login, logout, session bootstrap | `/api/auth/login` | POST | None | Yes | Yes | Yes | Yes | Partial | Partial | N/A | Partial | Partial | Login exists, but `/admin/login` route and full bootstrap/global error alignment are still missing. |
| Auth | Session bootstrap | `/api/auth/me` | GET | Authenticated | Yes | Yes | No | No | N/A | Partial | N/A | Missing | Partial | Client exists, but the app does not consistently bootstrap the session from `/auth/me` on load. |
| Auth | Logout | `/api/auth/logout` | POST | Authenticated | Yes | Yes | N/A | Yes | N/A | Yes | N/A | Partial | Partial | Works, but redirect target still uses `/login` instead of `/admin/login`. |
| Auth | Health check | `/api/auth/ping` | GET | None | Yes | Partial | No | No | N/A | Partial | N/A | Not Required Now | Not Required Now | Diagnostic-only; no admin UI needed. |
| Dashboard | `/admin/dashboard` | `/api/dashboard/summary` | GET | `dashboard.view` | Yes | Yes | Yes | Yes | Partial | Partial | Yes | Yes | OK | Dashboard summary is now the main source for cards, shipment insights, and chart-driven operational polish. Finance overview remains supplemental, but the dashboard no longer depends on invented historical data. |
| Users | Users list/create/edit/details | `/api/users` | GET/POST | `users.view`, `users.create` | Yes | Yes | Yes | Yes | Partial | Partial | Partial | Partial | Partial | CRUD exists, role assignment remains stable, and the user details page now previews explicit backend permissions when they are returned. |
| Users | User details/edit/delete | `/api/users/{user}` | GET/PUT/DELETE | `users.view`, `users.update`, `users.delete` | Yes | Yes | Yes | Yes | Partial | Partial | N/A | Partial | Partial | Current forms use legacy role assumptions. |
| Users | Assign role | `/api/users/{user}/assign-role` | POST | `users.update`, `roles.update` | Yes | Yes | Yes | Yes | Partial | Partial | N/A | Partial | Partial | Client and edit flow now call assign-role when `role_id` changes, and the details screen surfaces the explicit backend permissions attached to the assigned role/user state. |
| Roles & Permissions | Roles CRUD and grouped permissions | `/api/roles`, `/api/roles/{role}`, `/api/roles/{role}/permissions`, `/api/permissions`, `/api/permissions/grouped` | GET/POST/PUT/DELETE | `roles.*`, `permissions.*` | Yes | Yes | Yes | Yes | Partial | Partial | N/A | Partial | Partial | Dedicated roles list, details, create, and edit pages now exist; still no separate permissions-only screen. |
| Settings | Settings groups and dynamic forms | `/api/settings`, `/api/settings/groups`, `/api/settings/group/{group}`, `/api/settings/{setting}`, `/api/settings/bulk-update`, `/api/public/settings` | GET/PUT | `settings.*` | Partial | Yes | Yes | Yes | Partial | Partial | Partial | Partial | Partial | Groups page, dynamic fields, public settings, and bulk update are implemented; single-setting detail/update endpoints are not used directly yet. |
| Merchants | Merchant CRUD | `/api/merchants`, `/api/merchants/{merchant}` | GET/POST/PUT/DELETE | `merchants.*` | Yes | Yes | Yes | Yes | Partial | Partial | Partial | Partial | Partial | Basic CRUD exists with `pricing_plan_id` support; the broader merchants module remains partial because several non-profile areas are still outside this pass. |
| Merchants | Dashboard and finance tabs | `/api/merchants/{merchant}/dashboard/summary`, `/api/merchants/{merchant}/finance/summary` | GET | `merchants.view`, `finance.view` | Yes | Yes | Yes | N/A | Partial | Partial | Partial | Partial | Partial | These legacy summary sections were preserved and reorganized under the tabbed Merchant Profile. |
| Merchants | Merchant Profile - Orders tab | `/api/orders` | GET | `orders.view` | Yes | Yes | Yes | Yes | Yes | Partial | Yes | Yes | OK | Merchant-scoped Orders tab now uses backend filters: `merchant_id`, `date_from`, `date_to`, `status`, `order_type`, `fulfillment_type`, `payment_type`. |
| Merchants | Merchant Profile - Shipments tab | `/api/shipments` | GET | `shipments.view` | Yes | Yes | Yes | Yes | Yes | Partial | Yes | Yes | OK | Merchant-scoped Shipments tab now uses backend filters: `merchant_id`, `date_from`, `date_to`, `status`, `assigned_driver_id`, `delivery_governorate_id`, `delivery_area_id`. |
| Merchants | Wallet tabs and actions | `/api/merchants/{merchant}/wallet/summary`, `/api/merchants/{merchant}/wallet/transactions`, `/api/merchants/{merchant}/wallet/deposit`, `/api/merchants/{merchant}/wallet/withdraw`, `/api/merchant-wallet-transactions/{transaction}`, `/api/merchant-wallet-transactions/{transaction}/approve`, `/api/merchant-wallet-transactions/{transaction}/reject` | GET/POST | `merchant_wallet.*` or `finance.view` | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | OK | Wallet summary, transactions, details, manual deposit, manual withdraw, approve, and reject are implemented in the Merchant Profile and use backend-owned balances only. |
| Merchants | Merchant Profile - Invoices tab | `/api/merchant-invoices`, `/api/merchant-invoices/{merchantInvoice}/preview`, `/api/merchant-invoices/{merchantInvoice}/download` | GET | `finance.invoices.view`, `finance.invoices.download` | Yes | Yes | Yes | Yes | N/A | Yes | Yes | Yes | OK | Merchant invoice list is filtered by `merchant_id`; preview and download are available from the tab. |
| Merchants | Merchant Profile - Integration Tokens tab | `/api/merchants/{merchant}/integration-tokens`, `/api/merchant-integration-tokens/{token}`, `/api/merchant-integration-tokens/{token}/revoke` | GET/POST/DELETE | `merchant_integrations.*` | Yes | Yes | Yes | Yes | Yes | Yes | N/A | Yes | OK | Admin integration token flow now supports list/create/details/revoke/delete and shows `plain_token` once only after creation. |
| Merchants | Merchant integration plugin APIs | `/api/integrations/me`, `/api/integrations/orders` | GET/POST | Plugin-facing | No | No | No | No | N/A | N/A | N/A | Not Required Now | Not Required Now | These APIs are intentionally left out of the Admin UI because the flow docs mark them as future/plugin-facing. |
| Merchants | Merchant Profile - Attachments tab | `/api/attachments`, `/api/attachments/{attachment}`, `/api/attachments/{attachment}/download` | GET/POST/DELETE | `attachments.*` | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | OK | Merchant attachments now use a real reusable attachments component wired to list/upload/download/delete for `attachable_type=merchants`. |
| Merchants | Merchant Profile - Activity Timeline tab | `/api/audit-logs/timeline` | GET | `audit_logs.timeline` | Yes | Yes | Yes | N/A | N/A | Yes | N/A | Yes | OK | Merchant timeline now calls `auditable_type=merchant` and hides obviously sensitive token/password metadata in the UI summary. |
| Merchants | Warehouse tab | `/api/merchants/{merchant}/warehouse/inventory`, `/api/merchants/{merchant}/warehouse/movements`, `/api/merchants/{merchant}/warehouse/charges` | GET | `inventory.view`, `warehouse_charges.view` | Yes | Yes | Yes | N/A | Partial | Partial | Partial | Partial | Partial | Existing warehouse tab is preserved inside the new tabbed Merchant Profile; deeper warehouse workflows remain out of scope for this pass. |
| Locations & Pricing | Governorates, areas, shipping rates | `/api/governorates`, `/api/areas`, `/api/shipping-rates`, `/api/shipping-rates/calculate` | CRUD/POST | `locations.*`, `shipping_rates.*` | Yes | Yes | Yes | Yes | Partial | Partial | Partial | Partial | Partial | Existing location flows exist, and the shipping calculator now supports the documented `merchant_id`, `order_type`, `governorate_id`, and `area_id` inputs with dependent governorate/area selection. The wider module remains partial because broader pricing-plan/list polish is still minimal. |
| Locations & Pricing | Pricing plans | `/api/pricing-plans`, `/api/pricing-plans/{pricingPlan}` | CRUD | `pricing_plans.*` | Yes | Yes | Yes | Yes | Partial | Partial | Partial | Partial | Partial | Implemented with list, details, create, and edit pages; list filters are still minimal. |
| Locations & Pricing | Pricing plan rates | `/api/pricing-plan-rates`, `/api/pricing-plan-rates/{pricingPlanRate}` | CRUD | `pricing_plan_rates.*` | Yes | Yes | Yes | Yes | Partial | Partial | Yes | Partial | Partial | Implemented with list, details, create, and edit pages; documented `pricing_plan_id`, `governorate_id`, and `area_id` filters are now surfaced with dependent governorate/area behavior. |
| Orders | Orders CRUD and actions | `/api/orders`, `/api/orders/{order}`, `/api/orders/{order}/confirm`, `/api/orders/{order}/shipments`, `/api/orders/{order}/reserve-stock`, `/api/orders/{order}/release-stock`, `/api/orders/{order}/fulfill-from-warehouse`, `/api/orders/{order}/stock-reservations` | GET/POST/PUT/DELETE | `orders.*`, `inventory.*`, `audit_logs.timeline` | Yes | Yes | Yes | Yes | Yes | Partial | Yes | Yes | OK | Orders list filters, create/edit rules, shipment creation behavior, stock reservations, and activity timeline are now aligned with the documented admin flow. Response mapping remains marked Partial because the current list/details responses still mix some older optional summary fields. |
| Shipments | Shipments list/details/status/assign | `/api/shipments`, `/api/shipments/{shipment}`, `/api/shipments/{shipment}/status`, `/api/shipments/{shipment}/assign-driver`, `/api/track/{shipment_number}` | GET/PATCH/POST | `shipments.*`, `audit_logs.timeline` | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | OK | Shipments list filters, detail actions, public tracking link preview, activity timeline, and documented print-list flow are now implemented and permission-gated. The print client now sends the documented required `date` param and renders the returned JSON through the shared print surface. |
| Shipments | Delivery completion and delivery attempts | `/api/shipments/{shipment}/complete-delivery`, `/api/delivery-attempts`, `/api/shipments/{shipment}/delivery-attempt` | POST/GET | `shipments.update_status`, `delivery_attempts.*` | Yes | Yes | Yes | Yes | Yes | Partial | Yes | Yes | OK | Complete delivery and delivery attempts are now implemented in Shipment Details, with item-level result entry, 422 field errors, and refetching after success. Delivery-attempt result enums are still kept broad because the docs describe behavior more clearly than a strict closed enum payload. |
| Drivers | Drivers CRUD and detail flows | `/api/drivers`, `/api/drivers/{driver}`, `/api/drivers/{driver}/shipments`, `/api/drivers/{driver}/manifest`, `/api/drivers/{driver}/cash-expected` | GET/POST/PUT/DELETE | `drivers.*` | Yes | Yes | Yes | Yes | Partial | Partial | Partial | Partial | Partial | Driver CRUD remains in place and now feeds the manifest module with driver and cash-expected data. |
| Driver Manifests | Generate/list/details/close/print | `/api/driver-manifests/generate`, `/api/driver-manifests`, `/api/driver-manifests/{manifest}`, `/api/driver-manifests/{manifest}/close`, `/api/driver-manifests/{manifest}/print` | POST/GET | `driver_manifests.*`, `audit_logs.timeline` | Yes | Yes | Yes | Yes | Yes | Partial | Yes | Yes | OK | Driver manifest list, generate flow, details, close flow, print view, attachments reuse, documented activity timeline, and permission gating are now implemented. Response mapping remains Partial only because candidate shipment selection is assembled from documented shipment filters rather than a dedicated manifest-candidate endpoint. |
| Warehouse & Fulfillment | Warehouse locations: zones, shelves, bins | `/api/warehouse-zones`, `/api/warehouse-shelves`, `/api/warehouse-bins` | GET/POST | `warehouse_locations.*` | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | OK | Warehouse location forms now match the documented contracts, including required `warehouse_id`/`name`/`code`, optional shelf/zone linkage, optional bin barcode auto-generation, and dependent selector clearing on warehouse or zone changes. |
| Warehouse & Fulfillment | Picking lists | `/api/picking-lists`, `/api/picking-lists/{pickingList}`, `/api/picking-lists/generate`, `/api/picking-lists/{pickingList}/scan-pick`, `/api/picking-lists/{pickingList}/cancel` | GET/POST | `picking_lists.*` | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | OK | Picking lists now use the documented detail endpoint for the details page, with typed item rows, scan-pick, cancel, and permission-gated status-aware actions. |
| Warehouse & Fulfillment | Packing tasks | `/api/packing-tasks`, `/api/packing-tasks/{packingTask}`, `/api/packing-tasks/generate`, `/api/packing-tasks/{packingTask}/complete` | GET/POST | `packing_tasks.*` | Yes | Yes | Yes | Yes | Yes | Partial | Yes | Yes | OK | Packing tasks now include a dedicated detail page backed by the documented detail endpoint, while generate and complete actions remain wired through the existing backend action responses. |
| Warehouse & Fulfillment | Storage fee rules and generation | `/api/storage-fee-rules`, `/api/storage-fees/generate` | GET/POST | `storage_fee_rules.*`, `storage_fees.generate` | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | OK | Storage fee rule forms now use the documented field names `name`, `calculation_type`, `free_units`, and `unit_price`, with merchant and pricing-plan selectors remaining optional and allowed together. |
| Warehouse & Fulfillment | Pick & pack fee rules and generation | `/api/pick-pack-fee-rules`, `/api/pick-pack-fees/generate` | GET/POST | `pick_pack_fee_rules.*`, `pick_pack_fees.generate` | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | OK | Pick and pack fee rule forms now use the documented fee field names `pick_fee_first_item`, `pick_fee_additional_item`, `packing_fee_base`, and `fragile_extra_fee`, while keeping merchant and pricing-plan selectors optional and compatible with global rules. |
| Warehouse & Fulfillment | Warehouse KPIs | `/api/warehouse/kpis` | GET | `warehouse_kpis.view` | Yes | Yes | Yes | N/A | N/A | Partial | Yes | Yes | OK | Warehouse KPI page now renders inventory, operations, returns, and billing cards from the documented KPI endpoint. |
| Barcode Operations | Lookup, shipment status scan, product lookup | `/api/barcodes/lookup`, `/api/barcodes/scan/shipment-status`, `/api/barcodes/scan/product-lookup` | POST | `barcodes.lookup`, `barcodes.scan` | Yes | Yes | Yes | Yes | Yes | Partial | N/A | Yes | OK | Barcode operations page is implemented with scanner-style input, Enter-to-submit behavior, clear validation states, and entity linking where responses provide related ids. |
| Finance | Wallet transaction details and approvals | `/api/merchant-wallet-transactions/{transaction}`, `/api/merchant-wallet-transactions/{transaction}/approve`, `/api/merchant-wallet-transactions/{transaction}/reject` | GET/POST | `merchant_wallet.*`, `audit_logs.timeline` | Yes | Yes | Yes | Yes | Yes | Yes | N/A | Yes | OK | Wallet transaction details, approve/reject actions, and the documented wallet transaction timeline are implemented in the Merchant Profile wallet flow and reused by the wider finance state model. |
| Finance | Merchant payouts approval flow | `/api/merchant-payouts/{merchantPayout}/approve`, `/api/merchant-payouts/{merchantPayout}/reject`, `/api/merchant-payouts/{merchantPayout}/complete` | POST | `finance.payouts.*` | Yes | Yes | Yes | Yes | Yes | Partial | Yes | Yes | OK | Payout approve/reject/complete flows are now implemented with treasury-account-aware completion and refetching after success. |
| Finance | Expense approval flow | `/api/expenses/{expense}/approve`, `/api/expenses/{expense}/reject`, `/api/expenses/{expense}/mark-paid` | POST | `finance.expenses.*` | Yes | Yes | Yes | Yes | Yes | Partial | Yes | Yes | OK | Expense approve/reject/mark-paid flows are implemented with treasury account selection and post-action refetching. |
| Finance | Treasury accounts and transactions | `/api/treasury-accounts`, `/api/treasury-accounts/{treasuryAccount}`, `/api/treasury-transactions` | GET/POST/PUT/DELETE | `finance.treasury.*`, `audit_logs.timeline` | Yes | Yes | Yes | Yes | Yes | Partial | Yes | Yes | OK | Treasury account CRUD and treasury transaction list pages are implemented under `/admin/finance/treasury/*`, and treasury transaction details now expose the documented timeline surface. Treasury account timelines remain intentionally unavailable because `treasury_account` is not a supported auditable type. |
| Finance | Reconciliation and reports | `/api/finance/reconciliation-summary`, `/api/finance/company-profit-summary`, `/api/finance/reports/daily-cash`, `/api/finance/reports/merchant-ledger`, `/api/finance/reports/driver-discrepancies`, `/api/finance/reports/warehouse-revenue`, `/api/finance/reports/profit-loss` | GET | `finance.reconciliation.view`, `finance.reports.*` | Yes | Yes | Yes | N/A | N/A | Yes | Yes | Yes | OK | Finance reports now use the documented nested response schemas for typed rendering, while still treating optional nullable values defensively. No backend-owned totals are calculated on the frontend. |
| Audit Logs & Timeline | Global audit logs | `/api/audit-logs` | GET | `audit_logs.view` | Yes | Yes | Yes | Yes | N/A | Partial | Yes | Yes | OK | Global audit logs page now exists with documented filters, details dialog, and sensitive-field hiding. |
| Audit Logs & Timeline | Reusable timeline integration | `/api/audit-logs/timeline` | GET | `audit_logs.timeline` | Yes | Yes | Yes | N/A | N/A | Yes | N/A | Yes | OK | Timeline integration is now present on merchants, orders, shipments, warehouse product details, merchant wallet transactions, merchant payouts, expenses, treasury transactions, and driver manifests. Unsupported standalone entities such as merchant invoices, treasury accounts, and driver cash closures now show a clear unavailable state instead of guessed auditable types. |
| Attachments | Reusable attachment module and detail-page reuse | `/api/attachments`, `/api/attachments/{attachment}`, `/api/attachments/{attachment}/download` | GET/POST/DELETE | `attachments.*` | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | OK | The reusable attachments module is fully implemented and now reused on merchants, orders, shipments, expenses, invoices, warehouse returns, and driver manifests. |
| Export System | Export history, detail, generate, download | `/api/exports`, `/api/exports/{exportLog}`, `/api/exports/{type}`, `/api/exports/{exportLog}/download` | GET/POST | `exports.*` | Yes | Yes | Yes | Yes | Yes | Partial | Yes | Yes | OK | Export history page, dedicated export-log details page, async-ready status display, and download actions are implemented. Export history now links into `/admin/exports/:exportLogId`, which loads the documented single-record endpoint. |

## Remaining Modules Completion Pass

Implemented in this pass:
- Driver Manifests now include list, generate, details, close, print, and attachments integration under `/admin/driver-manifests`.
- Finance advanced flows now include payout approvals/completion, expense approvals/mark-paid, treasury accounts CRUD, treasury transactions, and doc-backed reports.
- Warehouse advanced flows now include locations, picking lists, packing tasks, fee rules, fee generation, and KPI dashboards.
- Barcode Operations now include lookup, shipment-status scan, and product lookup with scanner-style input.
- Global Audit Logs now exist as an admin page, and timeline reuse is expanded beyond the merchant profile.
- The reusable Attachments module is now connected across additional detail pages beyond merchants.
- Export System now includes export history, generation, download, and async-ready status handling.

## Final Partial Closure Pass

Implemented in this pass:
- Warehouse zone, shelf, and bin create forms were realigned to the updated API docs, including documented field names, required `code` handling, optional zone/shelf relationships, and optional bin barcode submission.
- Warehouse selector dependencies now clear stale zone and shelf selections in create forms, and bin shelf choices now filter by warehouse plus selected zone when present.
- Picking list details now use `GET /api/picking-lists/{pickingList}` instead of deriving detail state from the list endpoint.
- Packing tasks now have a dedicated details page under `/admin/warehouse/packing-tasks/:packingTaskId` backed by `GET /api/packing-tasks/{packingTask}`.
- Storage fee rule forms now use `name`, `calculation_type`, `free_units`, and `unit_price` exactly as documented.
- Pick and pack fee rule forms now use `name`, `pick_fee_first_item`, `pick_fee_additional_item`, `packing_fee_base`, and `fragile_extra_fee` exactly as documented.
- Shipment print-list now uses the documented `GET /api/shipments/print-list` contract with a required single `date` field and the existing print surface renders the returned JSON payload.
- Finance reports now use the documented nested response schemas for daily cash, merchant ledger, driver discrepancies, warehouse revenue, profit and loss, reconciliation summary, and company profit summary.
- Finance timelines now use only the documented `auditable_type` values: `merchant_wallet_transaction`, `merchant_payout`, `expense`, `treasury_transaction`, `driver_manifest`, and the existing `warehouse_product`.

Important honest partials:
- There are no remaining partials inside shipment print-list, finance report schema coverage, or supported finance timeline mappings after the backend documentation hardening.
- Unsupported standalone entities such as `merchant_invoice`, `treasury_account`, `driver_cash_closure`, `warehouse_charge`, and `warehouse_return` intentionally do not expose guessed timeline integrations.

## Updated Completion Snapshot

Completed modules:
- Auth foundation
- Global foundation fixes and reusable component base
- Roles & Permissions
- Settings
- Merchants, including full Merchant Profile tabs
- Orders
- Driver Manifests
- Warehouse & Fulfillment
- Barcode Operations
- Exports

Partial modules:
- Dashboard
- Users
- Locations & Pricing
- Some module polish areas

Missing endpoints or intentionally limited usage:
- `GET /api/settings/{setting}` and `PUT /api/settings/{setting}` are still not used as standalone UI flows because the settings page uses group and bulk-update flows.

Not Required Now:
- `GET /api/integrations/me`
- `POST /api/integrations/orders`

Build result:
- Passed manual validation for documentation hardening alignment pass.
- Vite reported large chunk warnings; this is a performance optimization item, not a functional build failure.

Latest polish validation result:
- `npm run build` passed after the optional UX polish and `react-i18next` localization pass.
- `npm run build` also passed after the focused dashboard/settings/status cleanup pass that tightened the dashboard grid, replaced the finance widget treatment, corrected status badge tones, and refined Company Settings helper text/layout.
- `npm run build` also passed after the topbar behavior pass that fixed hamburger/sidebar state handling and added functional global search using existing routes and API list flows.
- Export history now includes a dedicated View Details action and `/admin/exports/:exportLogId` page backed by `GET /api/exports/{exportLog}`, with download preserved from both history and details surfaces.
- Warehouse CRUD route/action visibility is now verified on the admin frontend: the Warehouse sidebar link lands on the list page, the list page exposes a clear Create Warehouse action, and view/edit/delete actions are visible from the list when permissions allow.
- Warehouse CRUD discoverability is now restored in the grouped sidebar itself: `Warehouses` is again visible as the first child under the Warehouse section because the implemented `/admin/warehouses` route is now included in the permission-filtered dashboard navigation list.
- Shared warehouse create/edit forms now surface backend `422` field errors through the existing `FieldError` / `useFormApiErrors` pattern instead of only showing a generic mutation error.
- `react-i18next` now has a frontend resource layer, bootstrap initialization, locale-provider synchronization, and shared/static UI coverage across sidebar, topbar, buttons, shared states, auth screens, settings, exports, barcode tools, audit logs, roles, orders, shipments, drivers, locations, and finance CRUD/list screens.
- Static localization coverage was extended further in this pass across shared resource-list empty/search states, admin 403/404 pages, driver create/details pages, treasury account create/details pages, shipping rates list states/actions, user create/edit/details pages, merchant create/edit pages, and the authenticated-user fallback in the admin shell. This remains an incremental rollout rather than a claim that every legacy admin string is translated.
- Arabic resource corruption caused by frontend file edits has now been repaired in `translations.ts`: no known UI translation value remains as literal `???`, and the affected keys were rewritten safely with Unicode escapes so they survive Windows terminal/code-page issues.
- Sidebar localization is now materially more complete: child items are translated at render time, the Warehouse section now includes discoverable links for products, inventory stocks, stock movements, stock reservations, returns, and charges when their routes/permissions exist, and finance children now read as Reports, Treasury Accounts, and Treasury Transactions.
- A safe Arabic-supporting font fallback was added at the global CSS level using `Cairo`, `Tajawal`, `Noto Kufi Arabic`, `Arial`, and `sans-serif`, without adding packages or changing the existing theme system.
- Safe Arabic RTL support now sets `dir` from the saved locale and uses logical CSS properties plus targeted row/action reversals in the shared shell and searchable dropdown surfaces. This is intentionally a low-risk rollout rather than a full visual re-layout of every legacy page.
- Searchable dropdown coverage now also includes the role-permissions picker as a grouped searchable multi-select and replaces the remaining long treasury-account select in expense mark-paid flow.
- Dashboard and settings localization coverage was extended again for the newly touched shell, finance snapshot, branding, and helper-copy surfaces, but this remains a targeted pass rather than full app-wide translation completion.
- Touched list screens now honor incoming `?search=` URL params so topbar Enter navigation can land on an existing results/list page without inventing a separate backend-powered global search endpoint.
- `npm run lint` still fails because of broad pre-existing repo issues in `.figma-ref`, fast-refresh-only-export rules, `any` usage, and older hook/compiler warnings outside the scope of this frontend-only polish pass.

Remaining honest localization partials:
- `src/features/dashboard/pages/DashboardPage.tsx` and adjacent dashboard detail cards are substantially improved, but some deeper operational table/dialog text in older modules still remains English.
- `src/features/settings/pages/SettingsPage.tsx` now covers the touched company-branding and helper-copy surfaces, but other settings groups still depend on backend-provided labels/descriptions and are not fully translated end-to-end.
- `src/features/finance/pages/FinanceReportsPage.tsx` still contains substantial untranslated static copy for report sections, metric labels, and error/loading text.
- `src/features/merchants/pages/MerchantDetailsPage.tsx` and `src/features/merchants/components/MerchantProfilePanels.tsx` still contain significant English UI across tabs, wallet flows, and merchant-scoped tables/dialogs.
- `src/features/orders/pages/OrderDetailsPage.tsx` still contains substantial English static UI across action buttons, section titles, review states, and stock-reservation copy.
- Some warehouse/admin filter labels and older detail dialogs still use English strings even where the surrounding page chrome is now translated.

Performance note:
- TODO: Consider route-level dynamic imports/code splitting later to reduce Vite chunk warnings.

## UI Polish Pass

Implemented in this pass:
- Shared filter layouts now use a more consistent responsive grid across the existing filter-card and filter-bar patterns, so wrapped filters keep aligned widths, labels, and control heights in both light and dark mode.
- Destructive actions now use clearer red styling through the shared button system and destructive dropdown-item treatment instead of inconsistent neutral text actions.
- Shared dialog behavior now respects viewport width and height more reliably, with internal body scrolling for larger forms and selection tables so admin modals no longer depend on browser zoom-out.
- Searchable dropdowns now back the shared merchant, driver, warehouse, treasury account, and governorate/area selectors, plus high-traffic admin selectors such as settings groups, user role assignment, pricing-plan filters/forms, reserve-stock warehouse/product selection, picking-list generation assignee/warehouse selection, and other long-list warehouse/finance flows. Small fixed enum selects intentionally remain native where search would add noise rather than value.
- Public Settings is now clearly positioned as a read-only reflection of `/api/public/settings`, with explicit guidance to manage company name, logo, and support details through editable admin settings groups and an inline logo preview where applicable.

## Logistics Redesign Pass

Implemented in this pass:
- The shared visual system was retuned toward the supplied logistics reference direction with a deep navy sidebar, blue primary actions, orange accents, larger radii, softer card shadows, and updated shared table/button/badge/input styling so the main admin pages feel consistent without rewriting business logic.
- The app shell was redesigned with a branded sidebar, clearer active navigation pills, a responsive menu toggle, a more SaaS-style topbar, and a support/help card while preserving permission-gated navigation and keeping `Warehouses` as the first Warehouse child item.
- Dashboard UI was rebuilt around real endpoints already in use: `/api/dashboard/summary`, `/api/finance/overview`, `/api/orders`, and `/api/shipments`, with KPI cards, a live orders table, shipment distribution donut, finance snapshot, recent shipments, and a real shipment-tracking panel that uses live shipment history or clean empty states when data is absent.
- Company branding now resolves from shared public settings query state so company name/logo refresh globally across the sidebar, topbar company display, auth layout, login copy, and public settings preview after settings saves invalidate shared queries.
- The documented backend settings contract still exposes `company_logo` as a normal settings value/public setting, not a documented binary upload field; frontend Company Settings now uses an honest URL/path-based logo input with preview and field-level `422` handling instead of faking a file upload flow.
- `npm run build` passed after the redesign changes. Vite still reports a non-blocking large-chunk warning.
