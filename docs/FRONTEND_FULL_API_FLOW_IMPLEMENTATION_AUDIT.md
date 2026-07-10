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

## Admin Form + Actions Stabilization Pass

Implemented in this pass:
- Shared form primitives now support icon-ready submit actions and a cleaner create/edit section header treatment without changing API contracts.
- Merchant, order, user, location/pricing, finance, warehouse, driver, and treasury create/edit wrappers now use the shared form shell more consistently and pass page-specific section icons.
- `OrderForm` was restructured from one squeezed generic grid into grouped sections for order context, customer details, delivery, commercial details, operational notes, and item management.
- Shipment detail dialogs were cleaned up so key labels and action text are localized instead of staying hardcoded English.
- Row action menus across orders, shipments, users, merchants, governorates, areas, and shipping rates now use direct click handlers instead of nested links inside dropdown items.

Honest status summary:
- `OK`: shared form-shell polish, order form rewrite, dropdown click stabilization, and shipment dialog localization cleanup.
- `Partial`: some older non-form list/detail screens still contain residual English copy outside the scope of this pass.

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

## Driver Manifest Print Document Pass

Implemented in this pass:
- Driver Manifest printing no longer relies on rendering the live admin page inside `PrintView` and then calling `window.print()` on that UI shell.
- A dedicated frontend-owned printable manifest document now exists under `src/features/driver-manifests/utils/driverManifestPrint.ts`, built from backend manifest data and wrapped with the shared UTF-8, locale-aware, Arabic-safe print document helper.
- The new print flow is used from both `DriverManifestsPage` and `DriverManifestDetailsPage` through one page-owned `DriverManifestPrintDialog`, so the visible print output is no longer a screenshot-like copy of dashboard chrome, filters, or cards.
- Printed manifests now render a clean metadata header, selected-filters summary block, totals cards, and a table-first shipment report with strong borders and print-safe styling.
- Driver Manifest print intentionally contains no barcode and keeps shipment numbers as plain text because this document is a report/manifest, not a label.

Honest driver-manifest-print status summary:
- `OK`: Dedicated frontend-owned Driver Manifest print document, shared print wrapper reuse, filter-summary block, no-barcode report layout, list/details flow wiring, and build verification.
- `Partial`: Driver Manifest print remains a report-specific print path rather than joining the shared label-family builder, which is intentional and not a blocker.

## Responsive Layout + Table Reduction Pass

Implemented in this pass:
- Orders list no longer renders the Customer, COD, or Shipping Fee columns in the main table, while keeping the underlying API data/types and detail-page access intact.
- Shipments list no longer renders the Order Number, Customer, COD, or Shipping Fee columns in the main table, reducing width while preserving list filters, actions, and detail flows.
- Shared admin layout CSS was tightened so content wrappers, cards, page headers, actions, and table containers handle smaller widths and RTL better without forcing page-level horizontal overflow.
- Shared detail grids no longer stretch cards to equal heights as aggressively, and the generic detail-list layout now packs content more evenly to reduce large blank card areas on detail pages.
- Shared form-page styling was introduced for the touched create/edit wrappers so cards use a more compact max width and responsive form grids instead of large empty desktop whitespace.
- Settings layout was adjusted through shared grid/content rules so the branding/settings overview and settings form grid collapse more safely and do not push cards partially off-screen as easily.

Honest responsive-pass status summary:
- `OK`: Orders/Shipments list column reduction, central responsive CSS pass, compact form-shell treatment on touched wrappers, detail-card spacing improvement, settings layout visibility improvement, and build verification.
- `Partial`: This is still an incremental frontend polish pass. It improves shared layout behavior broadly, but it is not a claim that every untouched legacy page has received full manual device-by-device QA.

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

## Follow-up Localization + Navigation Polish Pass

Implemented in this pass:
- Shared `StatusBadge` mapping was refined again for logistics-heavy operational states so `unassigned`, `assigned`, `pending_pickup`, `pending_return`, `review_required`, `failed_delivery`, `returned_to_hub`, and `returned_to_warehouse` no longer collapse into ambiguous tones.
- The sidebar information architecture was tightened by grouping Orders and Shipments under one localized `Orders & Shipments` dropdown while preserving permission-gated children, active-child auto-open behavior, and persisted open state.
- Report and print surfaces now use an Arabic-capable font stack through shared CSS and the print wrapper so shipment/manifest/report views render mixed Arabic and Latin text more safely without any package changes.
- Export history download feedback is now row-scoped: only the clicked download button enters a loading state while the file request is in flight.
- Localization coverage was extended again across shipment details and print surfaces, export history/filter/dialog copy, and the main driver-manifest list page plus its generate/close/print dialogs.
- Arabic resource entries were updated for the new sidebar label, print action copy, driver-manifest list strings, shipment-detail strings, and export-history helper text used in this pass.

Honest follow-up-pass status summary:
- `OK`: Status-badge distinction, sidebar regrouping, Arabic-safe report/print font fallback, export row-loading behavior, and build verification are all implemented and compile cleanly.
- `Partial`: Localization breadth is materially improved again, but some older finance, warehouse, and admin dialogs still remain outside this pass.

## Full Localization Audit Pass

Implemented in this pass:
- A dedicated page-by-page localization audit file now exists at `docs/FRONTEND_LOCALIZATION_PAGE_CHECKLIST.md`, covering admin routes/pages plus shared layout/component surfaces with explicit `OK` / `Partial` / `Missing` status.
- Route discovery was reconciled against `src/app/router.tsx`, feature page files under `src/features`, layouts, and shared UI so old routes that are no longer prominent in the sidebar are still tracked in the checklist.
- Additional localization was implemented across the location/pricing module wrappers and details, public tracking, order create/edit wrappers, and several finance wrapper/list/detail/form surfaces.
- Arabic translation entries were added for the newly localized wrapper/page strings introduced in this pass.
- The checklist now documents exact remaining untranslated file paths and examples instead of leaving the remaining gaps implicit.

Honest full-localization-pass status summary:
- `OK`: Checklist creation, route/page inventorying, additional location/pricing localization, additional finance wrapper localization, public tracking localization, and build verification.
- `Partial`: Full app-wide localization is still in progress. The checklist explicitly records remaining warehouse-heavy pages plus a few older merchant, finance-report, order-form, and driver-manifest detail surfaces that still contain English strings.

## Localization Closure Continuation Pass

Implemented in this pass:
- Driver manifest details now localize the main detail header/cards, print surface, close-manifest modal, shipment snapshot labels, and timeline fallback copy.
- Shared warehouse record details now localize the wrapper actions, delete/confirm flows, loading/not-found states, return lifecycle card, and timeline fallback copy across warehouse/product/stock-movement/return/charge detail routes.
- Warehouse products, stock movements, warehouse returns, and warehouse charges list pages now localize their page copy, filters, headers, and row actions while preserving backend enum values and route behavior.
- Arabic translation entries were added for the newly localized warehouse and manifest strings introduced in this continuation pass.
- `npm run build` passed after the continuation pass.

Honest continuation-pass status summary:
- `OK`: `WarehouseProductsPage`, `StockMovementsPage`, `WarehouseReturnsPage`, and `WarehouseChargesPage` now have localized immediate list-page UI.
- `Partial`: `DriverManifestDetailsPage` and the shared `WarehouseRecordDetailsPage` wrapper are materially improved, but residual validation/helper copy and generated raw field-label fallbacks still remain.

## Localization Checklist Continuation Pass

Implemented in this pass:
- Warehouse bin details now localize the overview labels, edit dialog, delete confirmation, barcode copy feedback, and label-print trigger/title.
- Warehouse receipt details now localize the header, overview card, receipt-items table, confirmation modal, and empty/loading/not-found states.
- Warehouse transfer details now localize the header, lifecycle action labels, overview card, item table, confirmation modal, and empty/loading/not-found states.
- Storage fee rules now localize the list surface, filters, create-rule dialog, generate-fees dialog, helper text, and table labels while preserving backend enum values.
- Arabic translation entries were added for the newly localized warehouse strings introduced in this pass.
- `npm run build` passed after this continuation pass.

Honest checklist-continuation status summary:
- `OK`: `WarehouseBinDetailsPage`, `WarehouseReceiptDetailsPage`, `WarehouseTransferDetailsPage`, and `StorageFeeRulesPage` now have localized immediate static UI and no longer remain `Missing`.
- `Partial`: The broader warehouse cluster still has remaining `Missing` pages, especially locations, receipts list, transfers list, picking/packing detail surfaces, KPI surfaces, pick-pack fees, and inbound requests.

## Remaining Missing Warehouse Closure Pass

Implemented in this pass:
- Warehouse receipts now localize the list surface, create/edit dialog, item-row helper copy, filters, success messages, and confirm/cancel flows.
- Warehouse transfers now localize the list surface, create/edit dialog, source/destination filters, success messages, and lifecycle action confirmations.
- Pick and pack fee rules now localize the list surface, create/generate dialogs, fee-field labels, helper text, and table headers.
- Warehouse KPIs now localize the page header, low-stock helper cards, KPI section titles, stat labels, and loading/error states.
- Shared warehouse record details now use a safer field-label translation map for common backend keys before falling back to humanized raw names.
- Arabic translation entries were added for the newly localized warehouse strings introduced in this pass.
- `npm run build` passed after this pass.

Honest missing-closure-pass status summary:
- `OK`: `WarehouseReceiptsPage`, `WarehouseTransfersPage`, `PickPackFeeRulesPage`, and `WarehouseKpisPage` now have localized immediate static UI and no longer remain `Missing`.
- `Partial`: `WarehouseRecordDetailsPage` is improved again with a common field-label map, but uncommon unmapped backend field names can still fall back to English.
- `Missing`: The remaining warehouse-heavy gaps are now concentrated in `WarehouseLocationsPage`, `PickingListDetailsPage`, `PackingTasksPage`, `PackingTaskDetailsPage`, and `MerchantInboundStockRequestsPage`.

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
- `npm run build` also passed after the follow-up localization/navigation pass that regrouped Orders + Shipments, diversified logistics status badges further, added Arabic-safe print/report font fallbacks, and fixed export row-specific download loading.
- `npm run build` also passed after the full localization audit pass that created `docs/FRONTEND_LOCALIZATION_PAGE_CHECKLIST.md` and localized additional location/pricing, finance, order-wrapper, and public-tracking surfaces.
- `npm run build` also passed after the localization continuation pass that moved warehouse products, stock movements, warehouse returns, and warehouse charges list pages to localized `OK`, while advancing manifest details and shared warehouse record details to `Partial`.
- `npm run build` also passed after the next localization checklist continuation pass that moved warehouse bin details, warehouse receipt details, warehouse transfer details, and storage fee rules to localized `OK`.
- `npm run build` also passed after the next warehouse missing-closure pass that moved warehouse receipts, warehouse transfers, pick and pack fee rules, and warehouse KPIs to localized `OK`, while improving shared warehouse detail field-label fallback.
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
- Single-shipment label preview/print no longer writes raw backend HTML directly into a new window or iframe. The shared label dialog now wraps HTML output with UTF-8 meta, locale-driven `lang`/`dir`, and an Arabic-safe font stack, which is the most likely frontend-side fix for the observed Arabic print corruption when backend bytes are otherwise valid.
- Shipment label HTML now renders through a frontend-owned layout with a barcode-first header and structured shipment/order/customer/payment table. If the backend label HTML already includes SVG/IMG barcode markup, the frontend reuses it; otherwise it falls back to readable shipment-code text. A real frontend-generated barcode still requires a manual `npm install jsbarcode`, which was intentionally not auto-installed in this pass.
- `npm run build` passed after the shipment label printing follow-up. Vite still reports a non-blocking large-chunk warning.
- Follow-up tracing confirmed the actual shipment label buttons already flowed from `ShipmentsListPage` / `ShipmentDetailsPage` into `LabelDocumentDialog` and then into `/api/shipments/{id}/label`; the visible leak was inside the shipment HTML helper, which was still willing to reuse the first backend SVG it found. That path is now tightened so single-shipment HTML labels force the frontend-owned layout and only reuse backend markup when it is clearly barcode-specific.
- Final follow-up tightened the behavior further for corrupted backend shipment-label HTML: single-shipment HTML preview no longer depends on backend HTML as display source at all, a temporary visible marker `FRONTEND_LABEL_LAYOUT_V2` is embedded in the generated label, and development-only tracing now logs the actual click/build/iframe path plus whether the final HTML contains the marker, `<svg`, and `<table`.
- Bulk shipment labels previously still flowed through `/api/shipments/labels/bulk` HTML and could render as the old narrow backend layout. The list-page bulk action now uses the same frontend shipment-label builder as single labels for HTML output, composing one wrapped label per shipment with explicit page breaks. PDF selection is still passed through to the backend bulk-label endpoint because the frontend does not generate binary PDFs.
- The shared dropdown menu used by shipment row actions was also refactored away from overflow-prone in-table absolute positioning to a fixed portal-style menu, improving RTL visibility/clickability for Actions menus and the label trigger path.
- Final shipment-label follow-up removes the broken backend PDF dependency from shipment label UI: selecting PDF now keeps the frontend-owned label document and uses the browser print dialog as the no-package Save-as-PDF path. Shipment row actions were also tightened so View navigates explicitly from the dropdown, and the shared shipment label builder now inspects more payment/order fields before falling back.
- Shipment label dialog state is now owned by the shipment pages instead of the row dropdown lifecycle, so clicking `Label` no longer opens and instantly closes the dialog. The shared label dialog also disables backdrop auto-close for this flow, uses one shared frontend print helper for both HTML Print and Print / Save PDF, and applies the entered width/height values to the shipment preview plus the generated single/bulk HTML documents and `@page` size when both dimensions are set.
- The shipment label implementation has now been generalized into a shared frontend entity-label builder in `src/shared/utils/entityLabel.ts`. Orders, warehouse products, bulk warehouse products, and warehouse bins now use the same frontend-owned label family as shipments: UTF-8 wrapped HTML, Arabic-safe fonts, Code 128 barcode generation with `jsbarcode`, code text under the barcode, structured detail tables, width/height-aware preview, and browser print/save-as-PDF for both HTML and PDF selections.
- Real admin label actions now stop relying on backend raw HTML as the primary visible preview for the migrated flows. `GET /api/orders/{id}/label`, `GET /api/warehouse-products/{id}/label`, `POST /api/warehouse-products/labels/bulk`, and `GET /api/warehouse-bins/{id}/label` remain as live backend data/document endpoints, but the frontend uses the current loaded entity data to build the visible HTML/PDF label when that is safely available.
- Order list label behavior now matches the shipment fix: the selected order and `LabelDocumentDialog` open state are owned by the page instead of a dropdown item subtree, so label preview no longer depends on dropdown teardown timing and the same frontend print/save-PDF flow is reused consistently.
- Remaining non-migrated print surfaces are intentionally separate from the new label family: shipment waybills still use their own document path, driver manifest print now uses a dedicated frontend-owned report document rather than a label, settings preview/test utilities still expose backend-managed generic label tools, and the older warehouse barcode-label compatibility endpoints are not shown through the standard migrated label UI.
- Shared badge rendering was tightened again in this pass: `StatusBadge` now uses the raw backend state/category value for color logic even when the displayed text comes from `status_label` or other `*_label` fields, preventing localized labels from accidentally changing the tone. The mapping now covers a broader set of positive, in-progress, warning, danger, and neutral logistics/warehouse/finance/account states, and more pages were moved from plain text to badges for fulfillment type, payment type, direction, transaction type, source type, provider, and return condition displays.
- High-traffic admin surfaces updated in this pass include Orders list/details, Shipments list/details, merchant profile order/wallet/token/warehouse panels, treasury transactions/details, finance reports, finance record details, treasury accounts, warehouse return list/details, and merchant overview status cards. Remaining partials are mostly lower-traffic category displays outside shared detail formatters, such as some barcode result cards, public tracking history rows, and merchant portal role text.
- `npm run lint` still fails because of broad pre-existing repo issues in `.figma-ref`, fast-refresh-only-export rules, `any` usage, and older hook/compiler warnings outside the scope of this frontend-only polish pass.

Remaining honest localization partials:
- `src/features/dashboard/pages/DashboardPage.tsx` and adjacent dashboard detail cards are substantially improved, but some deeper operational table/dialog text in older modules still remains English.
- `src/features/settings/pages/SettingsPage.tsx` now covers the touched company-branding and helper-copy surfaces, but other settings groups still depend on backend-provided labels/descriptions and are not fully translated end-to-end.
- `src/features/finance/pages/FinanceReportsPage.tsx` is improved and now uses the report-surface Arabic-safe font wrapper, but still contains remaining untranslated static copy for report sections, metric labels, and some error/loading text.
- `src/features/merchants/pages/MerchantDetailsPage.tsx` and `src/features/merchants/components/MerchantProfilePanels.tsx` are improved on touched panels, but still contain meaningful English UI across some tabs, wallet flows, and merchant-scoped tables/dialogs.
- `src/features/orders/pages/OrderDetailsPage.tsx` and `src/features/shipments/pages/ShipmentDetailsPage.tsx` are materially more localized now, but some residual English strings may still remain in less-traveled actions/dialog states.
- `src/features/driver-manifests/pages/DriverManifestDetailsPage.tsx` is mostly localized now, but some validation/helper text still needs cleanup.
- `src/features/warehouse/pages/WarehouseRecordDetailsPage.tsx` is materially improved, and common backend field labels now map through translations, but uncommon unmapped backend field names can still fall back to English.
- Several warehouse-heavy pages still remain outside the latest pass, especially locations, picking/packing details, and inbound requests.

Performance note:
- TODO: Consider route-level dynamic imports/code splitting later to reduce Vite chunk warnings.

## UI Polish Pass

Implemented in this pass:
- Shared filter layouts now use a more consistent responsive grid across the existing filter-card and filter-bar patterns, so wrapped filters keep aligned widths, labels, and control heights in both light and dark mode.
- Destructive actions now use clearer red styling through the shared button system and destructive dropdown-item treatment instead of inconsistent neutral text actions.
- Shared dialog behavior now respects viewport width and height more reliably, with internal body scrolling for larger forms and selection tables so admin modals no longer depend on browser zoom-out.
- Searchable dropdowns now back the shared merchant, driver, warehouse, treasury account, and governorate/area selectors, plus high-traffic admin selectors such as settings groups, user role assignment, pricing-plan filters/forms, reserve-stock warehouse/product selection, picking-list generation assignee/warehouse selection, and other long-list warehouse/finance flows. Small fixed enum selects intentionally remain native where search would add noise rather than value.
- Public Settings is now clearly positioned as a read-only reflection of `/api/public/settings`, with explicit guidance to manage company name, logo, and support details through editable admin settings groups and an inline logo preview where applicable.
- The next visual/layout pass pushed the admin surface closer to the supplied reference direction without changing data flow: shared page headers now separate title/description from action clusters inside a dedicated card-like header shell, form pages reuse the cleaner responsive card-shell layout, detail/table cards align to content more naturally, and Settings was reorganized into clearer company, tools, and live public-information sections with friendlier copy.
- Arabic readability and shell polish were also improved in that pass through locale-aware font sizing/line-height/weight tuning plus stronger sidebar contrast for inactive, hover, and active states. Shared mobile header/action wrapping, settings tool cards, and long-value wrapping were tightened further as part of the same responsive cleanup.
- `npm run build` passed after the UI enhancement pass. Vite still reports the same non-blocking chunk-size warning.
- The follow-up create/edit form migration now applies the attached form-reference direction across the main standalone admin form pages. `FormPageLayout` provides a centered page-level shell with a separated back action, while `FormActionsBar` standardizes cancel/save alignment and responsive stacking inside the form itself. The migration intentionally avoids backend, validation, and payload changes.
- Coverage for that pass includes merchants, users, drivers, orders, governorates, areas, shipping rates, pricing plans, pricing plan rates, finance record forms, treasury accounts, warehouse record forms, and roles. Remaining non-migrated inputs are mostly embedded list-page or modal dialogs such as warehouse location/receipt/transfer/picking/packing inline flows rather than standalone create/edit pages.

## Logistics Redesign Pass

Implemented in this pass:
- The shared visual system was retuned toward the supplied logistics reference direction with a deep navy sidebar, blue primary actions, orange accents, larger radii, softer card shadows, and updated shared table/button/badge/input styling so the main admin pages feel consistent without rewriting business logic.
- The app shell was redesigned with a branded sidebar, clearer active navigation pills, a responsive menu toggle, a more SaaS-style topbar, and a support/help card while preserving permission-gated navigation and keeping `Warehouses` as the first Warehouse child item.
- Dashboard UI was rebuilt around real endpoints already in use: `/api/dashboard/summary`, `/api/finance/overview`, `/api/orders`, and `/api/shipments`, with KPI cards, a live orders table, shipment distribution donut, finance snapshot, recent shipments, and a real shipment-tracking panel that uses live shipment history or clean empty states when data is absent.
- Company branding now resolves from shared public settings query state so company name/logo refresh globally across the sidebar, topbar company display, auth layout, login copy, and public settings preview after settings saves invalidate shared queries.
- The documented backend settings contract still exposes `company_logo` as a normal settings value/public setting, not a documented binary upload field; frontend Company Settings now uses an honest URL/path-based logo input with preview and field-level `422` handling instead of faking a file upload flow.
- `npm run build` passed after the redesign changes. Vite still reports a non-blocking large-chunk warning.

## P0 Company Catalog + Order Packaging Sync

- Company Catalog API client/types: `OK`
  Added frontend types and CRUD client wrappers for `GET/POST/GET by id/PUT/DELETE /api/company-catalog-items` using the existing `apiClient` + `{ data: ... }` response pattern.
- Company Catalog admin page: `OK`
  Added `/admin/company-catalog` with list filters, type chips, status/visibility controls, badges, and permission-gated create/edit/delete actions.
- Company Catalog create/edit/delete actions: `OK`
  Added create/edit form pages under `/admin/company-catalog/create` and `/admin/company-catalog/:companyCatalogItemId/edit`, plus delete confirmation from the list page.
- Sidebar/RBAC integration: `OK`
  Added permission keys for `company_catalog.view/create/update/delete` and linked the new page into the admin router, dashboard navigation map, and Warehouse sidebar group.
- Order packaging selection: `OK`
  Order create/edit now keeps `requires_packaging` + `package_notes`, adds frontend-managed `packaging_items[]`, and loads only active `packaging_product` catalog items in a separate packaging section.
- Order packaging payload mapping: `OK`
  Submit logic now sends `packaging_items` only when `requires_packaging` is true and clears packaging lines when packaging is turned off.
- Order packaging response mapping: `OK`
  Order types now include `total_packaging_fee` and `packaging_items`, edit pages preload backend packaging snapshots, and Order Details renders packaging summary plus a read-only packaging-items table.
- Localization: `OK`
  Added Company Catalog and packaging strings to the shared translation map and preserved existing Arabic/English + RTL/LTR behavior.
- Build result: `OK`
  `npm run build` passed after implementation. The existing non-blocking Vite chunk-size warning remains.
- Needs Browser QA: `Needs Browser QA`
  No manual browser smoke test was performed in this pass.

## P1/P2 Merchant Shop Preview + Settings + Audit/Export Sync

- Merchant Shop Preview tab visibility: \OK\ (Fixed the missing tab by ensuring it uses \PERMISSIONS.MERCHANT_SHOP_VIEW\ and is visible in the profile tabs array)
- Merchant Shop Preview API client and types: \OK\ (Wired accurately to GET /api/merchants/{merchant}/shop-preview)
- Merchant Shop Preview admin UI pages: \OK\
- Settings support/labels for merchant shop and packaging settings: \OK\
- Audit log labels for new backend events: \OK\
- Export type support for company_catalog_items: \OK\
- Localization for new events: \OK\ (Added Shop Preview translation keys to Arabic resources)
- Permission/RBAC behavior: \OK\ (Follows standard backend permission fallback; users must have merchant_shop.view, or be admin)
- Build result: \OK\ (npm run build passed successfully)
- Needs Browser QA: \Needs Browser QA\ (The tab should now be visible and the temporary marker 'MERCHANT_SHOP_PREVIEW_V1' should appear inside the panel header.)



## Merchant Shop Preview UI Polish

Statuses:
- Debug marker removed: `OK`
- Preview header card: `OK`
- Product cards for packaging products: `OK`
- Pricing cards for storage/pick-pack sections: `OK`
- Professional empty states: `OK`
- Read-only behavior preserved: `OK`
- Localization: `OK`
- Responsive layout: `OK`
- Build result: `OK`
- Needs Browser QA: `Needs Browser QA`


## Merchant Profile Permissions Fix

- Audited all Merchant Profile tabs for explicit backend permission coverage.
- Added constants for `DASHBOARD_MERCHANT_VIEW`, `WAREHOUSE_PRODUCTS_VIEW`, and renamed invoice permissions to `FINANCE_INVOICES_*`.
- Fixed `getEffectivePermissions` in frontend RBAC helper to prioritize explicit arrays correctly.
- Wrapped 'Requires Packaging' section in OrderForm with `ORDER_PACKAGING_MANAGE` Can component.
- Documented explicit matrix in `MERCHANT_PROFILE_PERMISSION_MATRIX.md`.
- Build Result: \OK\ (npm run build passed successfully)
- Needs Browser QA: \Needs Browser QA\ (Verify Admin vs other roles behavior)
